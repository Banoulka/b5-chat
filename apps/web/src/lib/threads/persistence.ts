import type { APIThread, APIThreadMessage } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';

import { api } from '@/components/auth/AuthContext';

export interface ThreadPersistence {
	listThreads(): Promise<APIThread[]>;
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

		// Update the thread's last message timestamp
		const threads = await this.listThreads();
		const threadIndex = threads.findIndex((t) => t.id === threadId);

		if (threadIndex !== -1 && threads[threadIndex]) {
			threads[threadIndex].updatedAt = new Date().toISOString();
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

		threads.push(newThread);
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

	async listThreads(): Promise<APIThread[]> {
		const data = localStorage.getItem(THREADS_KEY);
		return data ? JSON.parse(data) : [];
	},
};

export const dbPersistence: ThreadPersistence = {
	async addThread(thread) {
		await api<APIThread>('/threads', { method: 'POST' });
	},
	async createNewThread() {
		const thread = await api<APIThread>('/threads', { method: 'POST' });
		return thread;
	},
	async listThreads() {
		const res = await fetch('/api/threads');
		return res.json();
	},
};
