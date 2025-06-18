import type { API_ThreadsResponse, APIThread, APIThreadMessage } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';

import { api } from '@/components/auth/AuthContext';
import { getThreadOpts } from '@/hooks/queries';

type APIThreadMessageWithId = APIThreadMessage & { threadId: string };

export interface ThreadMessagesResponse {
	data: APIThreadMessage[];
	meta: {
		nextCursor: number | null;
	};
}

export interface ThreadPersistence {
	getType: () => 'localStorage' | 'db';
	listThreads(): Promise<API_ThreadsResponse>;
	createMessage(threadId: string, message: CreateMessageSchema): Promise<void>;
	listMessagesForThread(threadId: string, from: number | null): Promise<ThreadMessagesResponse>;
	createNewThread(): Promise<APIThread>;
	updateThreadName?(threadId: string, name: string): Promise<void>;
	sendMessageWithHistory?(
		message: CreateMessageSchema,
		history: Array<{ role: 'user' | 'assistant'; content: string }>,
		existingThreadId?: string,
	): Promise<{ threadId: string }>;
}

const THREADS_KEY = 'lbd:threads';
const MESSAGES_KEY = 'lbd:thread_messages';

function jsonSafeParse<T>(key: string, data: string | null, defaultValue: T): T {
	if (!data) return defaultValue;

	try {
		return JSON.parse(data);
	} catch (error) {
		console.warn(`Failed to parse JSON for key "${key}", deleting corrupted data:`, error);
		localStorage.removeItem(key);
		return defaultValue;
	}
}

export const syncToServer = async (): Promise<void> => {
	try {
		const threads = jsonSafeParse(THREADS_KEY, localStorage.getItem(THREADS_KEY), {
			data: [],
			meta: { nextCursor: null, prevCursor: null, total: 0 },
		}) as API_ThreadsResponse;

		// build threads with their messages
		const threadsWithMessages = threads.data.map((thread) => {
			const messagesKey = `lbd:thread_messages_${thread.id}`;
			const threadMessages = jsonSafeParse(
				messagesKey,
				localStorage.getItem(messagesKey),
				[],
			) as APIThreadMessage[];

			// strip 'local-' prefix from thread ID for server sync
			const serverThreadId = thread.id.startsWith('local-') ? thread.id.replace('local-', '') : thread.id;

			return {
				...thread,
				id: serverThreadId,
				messages: threadMessages.map((msg) => ({
					...msg,
					threadId: serverThreadId,
				})),
			};
		});

		if (threadsWithMessages.length === 0) {
			console.log('No local data to sync');
			return;
		}

		console.log(`Syncing ${threadsWithMessages.length} threads with their messages to server`);

		// Send threads with nested messages
		await api('/threads/sync', {
			body: JSON.stringify({
				threads: threadsWithMessages,
			}),
			method: 'POST',
		});

		// remove all local data
		localStorage.removeItem(THREADS_KEY);
		localStorage.removeItem(MESSAGES_KEY);

		threadsWithMessages.forEach((thread) => {
			const originalThreadId =
				threads.data.find((t) => t.id.replace('local-', '') === thread.id)?.id || thread.id;

			const messagesKey = `lbd:thread_messages_${originalThreadId}`;
			localStorage.removeItem(messagesKey);
		});

		console.log('Local data successfully synced and cleaned up');
	} catch (error) {
		console.error('Sync to server failed:', error);
		throw error; // Re-throw to allow caller to handle
	}
};

export const localStoragePersistence: ThreadPersistence = {
	async createMessage(threadId: string, message: CreateMessageSchema): Promise<void> {
		const messagesKey = `${MESSAGES_KEY}_${threadId}`;
		const existingMessages: APIThreadMessageWithId[] = jsonSafeParse(
			messagesKey,
			localStorage.getItem(messagesKey),
			[],
		);

		const newMessage: APIThreadMessageWithId = {
			attachments: [],
			content: message.content,
			createdAt: new Date().toISOString(),
			id: crypto.randomUUID(),
			model: null,
			threadId,
			type: 'user',
			updatedAt: new Date().toISOString(),
		};

		existingMessages.push(newMessage);
		localStorage.setItem(messagesKey, JSON.stringify(existingMessages));

		// update the thread's last message timestamp
		const threads = await this.listThreads();
		const threadIndex = threads.data.findIndex((t) => t.id === threadId);

		if (threadIndex !== -1 && threads.data[threadIndex]) {
			threads.data[threadIndex].updatedAt = new Date().toISOString();
			localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
		}
	},

	async createNewThread(): Promise<APIThread> {
		const threads = await this.listThreads();

		const newThread: APIThread = {
			createdAt: new Date().toISOString(),
			id: crypto.randomUUID(),
			name: '',
			updatedAt: new Date().toISOString(),
		};

		threads.data.push(newThread);
		localStorage.setItem(THREADS_KEY, JSON.stringify(threads));

		return newThread;
	},

	getType: () => 'localStorage',

	async listMessagesForThread(threadId: string, from: number | null): Promise<ThreadMessagesResponse> {
		const messagesKey = `${MESSAGES_KEY}_${threadId}`;
		const messages: APIThreadMessage[] = jsonSafeParse(messagesKey, localStorage.getItem(messagesKey), []);

		// for local storage, we don't have real pagination, just return all messages
		return {
			data: messages,
			meta: { nextCursor: null },
		};
	},

	async listThreads(): Promise<API_ThreadsResponse> {
		const data = localStorage.getItem(THREADS_KEY);
		return data
			? jsonSafeParse(THREADS_KEY, data, { data: [], meta: { nextCursor: null, prevCursor: null, total: 0 } })
			: { data: [], meta: { nextCursor: null, prevCursor: null, total: 0 } };
	},

	async sendMessageWithHistory(
		message: CreateMessageSchema,
		history: Array<{ role: 'user' | 'assistant'; content: string }>,
		existingThreadId?: string,
	): Promise<{ threadId: string }> {
		const response = await api<{ threadId: string }>('/chat/local', {
			body: JSON.stringify({
				content: message.content,
				history,
				modelId: message.modelId,
				threadId: existingThreadId,
			}),
			method: 'POST',
		});

		const messagesKey = `${MESSAGES_KEY}_${response.threadId}`;
		const userMessage: APIThreadMessage = {
			attachments: [],
			content: message.content,
			createdAt: new Date().toISOString(),
			id: crypto.randomUUID(),
			model: null,
			type: 'user',
			updatedAt: new Date().toISOString(),
		};

		// store conversation history + new user message
		const allMessages = [
			...history.map(
				(h) =>
					({
						attachments: [],
						content: h.content,
						createdAt: new Date().toISOString(),
						id: crypto.randomUUID(),
						model: h.role === 'assistant' ? message.modelId : null,
						type: h.role === 'user' ? 'user' : 'agent',
						updatedAt: new Date().toISOString(),
					}) as APIThreadMessage,
			),
			userMessage,
		];

		localStorage.setItem(messagesKey, JSON.stringify(allMessages));

		// create if it doesn't exist, otherwise update
		const threads = await this.listThreads();
		const existingThreadIndex = threads.data.findIndex((t) => t.id === response.threadId);

		if (existingThreadIndex === -1) {
			const newThread: APIThread = {
				createdAt: new Date().toISOString(),
				id: response.threadId,
				name: '',
				updatedAt: new Date().toISOString(),
			};
			threads.data.unshift(newThread);
		} else {
			// update existing thread timestamp
			const existingThread = threads.data[existingThreadIndex];
			if (existingThread) {
				existingThread.updatedAt = new Date().toISOString();

				// move to front (most recent thread)
				threads.data.splice(existingThreadIndex, 1);
				threads.data.unshift(existingThread);
			}
		}

		localStorage.setItem(THREADS_KEY, JSON.stringify(threads));

		return response;
	},

	async updateThreadName(threadId: string, name: string): Promise<void> {
		const threads = await this.listThreads();
		const threadIndex = threads.data.findIndex((t) => t.id === threadId);

		if (threadIndex !== -1 && threads.data[threadIndex]) {
			threads.data[threadIndex].name = name;
			threads.data[threadIndex].updatedAt = new Date().toISOString();
			localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
		}
	},
};

export const dbPersistence: ThreadPersistence = {
	async createMessage(threadId: string, message: CreateMessageSchema): Promise<void> {
		await api(`/threads/${threadId}/messages`, {
			body: JSON.stringify(message),
			method: 'POST',
		});
	},

	async createNewThread(): Promise<APIThread> {
		const response = await api<APIThread>('/threads', {
			body: JSON.stringify({}),
			method: 'POST',
		});

		return response;
	},

	getType: () => 'db',

	async listMessagesForThread(threadId: string, from: number | null): Promise<ThreadMessagesResponse> {
		const url = from ? `/threads/${threadId}/messages?from=${from}` : `/threads/${threadId}/messages`;
		const response = await api<{ data: APIThreadMessage[]; meta: { nextCursor: number | null } }>(url);

		const reversedMessages = [...response.data].reverse();

		return {
			data: reversedMessages,
			meta: response.meta,
		};
	},

	async listThreads(): Promise<API_ThreadsResponse> {
		return await getThreadOpts.queryFn();
	},

	async updateThreadName(threadId: string, name: string): Promise<void> {
		await api(`/threads/${threadId}`, {
			body: JSON.stringify({ name }),
			method: 'PATCH',
		});
	},
};
