import type { API_ThreadsResponse, APIThread, APIThreadMessage } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';

import { api } from '@/components/auth/AuthContext';
import { getThreadOpts } from '@/hooks/queries';

export interface ThreadPersistence {
	listThreads(): Promise<API_ThreadsResponse>;
	createMessage(threadId: string, message: CreateMessageSchema): Promise<void>;
	listMessagesForThread(threadId: string, from: number | null): Promise<APIThreadMessage[]>;
	createNewThread(): Promise<APIThread>;
}

const THREADS_KEY = 'lbd:threads';
const MESSAGES_KEY = 'lbd:thread_messages';

export const localStoragePersistence: ThreadPersistence = {
	async createMessage(threadId: string, message: CreateMessageSchema): Promise<void> {
		const messagesKey = `${MESSAGES_KEY}_${threadId}`;
		const existingMessages: APIThreadMessage[] = JSON.parse(localStorage.getItem(messagesKey) || '[]');

		const newMessage: APIThreadMessage = {
			attachments: [],
			content: message.content,
			createdAt: new Date().toISOString(),
			id: crypto.randomUUID(),
			model: null,
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

	async listMessagesForThread(threadId: string, from: number | null): Promise<APIThreadMessage[]> {
		const messagesKey = `${MESSAGES_KEY}_${threadId}`;
		const messages: APIThreadMessage[] = JSON.parse(localStorage.getItem(messagesKey) || '[]');

		if (from === null) {
			return messages;
		}

		return messages.slice(from);
	},

	async listThreads(): Promise<API_ThreadsResponse> {
		const data = localStorage.getItem(THREADS_KEY);
		return data ? JSON.parse(data) : { data: [], meta: { nextCursor: null, prevCursor: null, total: 0 } };
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
		const response = await api<{ thread: APIThread }>('/threads', {
			body: JSON.stringify({}),
			method: 'POST',
		});

		return response.thread;
	},

	async listMessagesForThread(threadId: string, from: number | null): Promise<APIThreadMessage[]> {
		const url = from !== null ? `/threads/${threadId}/messages?from=${from}` : `/threads/${threadId}/messages`;

		const response = await api<{ messages: APIThreadMessage[] }>(url);
		return response.messages;
	},

	async listThreads(): Promise<API_ThreadsResponse> {
		return await getThreadOpts.queryFn();
	},
};
