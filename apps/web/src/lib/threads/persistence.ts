import type { API_ThreadsResponse, APIThread, APIThreadMessage } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';

import { api } from '@/components/auth/AuthContext';
import { getThreadOpts } from '@/hooks/queries';

type APIThreadMessageWithId = APIThreadMessage & { threadId: string };

export interface ThreadPersistence {
	getType: () => 'localStorage' | 'db';
	listThreads(): Promise<API_ThreadsResponse>;
	createMessage(threadId: string, message: CreateMessageSchema): Promise<void>;
	listMessagesForThread(threadId: string, from: number | null): Promise<APIThreadMessage[]>;
	createNewThread(): Promise<APIThread>;
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
	const threads = jsonSafeParse(THREADS_KEY, localStorage.getItem(THREADS_KEY), {}) as API_ThreadsResponse;
	const messages = jsonSafeParse(MESSAGES_KEY, localStorage.getItem(MESSAGES_KEY), {}) as APIThreadMessageWithId[];

	if (threads.data?.length === 0 && messages.length === 0) return;

	await api('/threads/sync', {
		body: JSON.stringify({
			messages,
			threads,
		}),
		method: 'POST',
	});

	// delete the local data
	localStorage.removeItem(THREADS_KEY);
	localStorage.removeItem(MESSAGES_KEY);
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
			name: 'New Thread',
			updatedAt: new Date().toISOString(),
		};

		threads.data.push(newThread);
		localStorage.setItem(THREADS_KEY, JSON.stringify(threads));

		return newThread;
	},

	getType: () => 'localStorage',

	async listMessagesForThread(threadId: string, from: number | null): Promise<APIThreadMessage[]> {
		const messagesKey = `${MESSAGES_KEY}_${threadId}`;
		const messages: APIThreadMessageWithId[] = jsonSafeParse(messagesKey, localStorage.getItem(messagesKey), []);

		if (from === null) {
			return messages;
		}

		return messages.slice(from);
	},

	async listThreads(): Promise<API_ThreadsResponse> {
		const data = localStorage.getItem(THREADS_KEY);
		return data
			? jsonSafeParse(THREADS_KEY, data, { data: [], meta: { nextCursor: null, prevCursor: null, total: 0 } })
			: { data: [], meta: { nextCursor: null, prevCursor: null, total: 0 } };
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

	async listMessagesForThread(threadId: string, from: number | null): Promise<APIThreadMessage[]> {
		const url = from !== null ? `/threads/${threadId}/messages?from=${from}` : `/threads/${threadId}/messages`;

		const response = await api<{ messages: APIThreadMessage[] }>(url);
		return response.messages;
	},

	async listThreads(): Promise<API_ThreadsResponse> {
		return await getThreadOpts.queryFn();
	},
};
