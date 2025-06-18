import type { APIThreadMessage } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';
import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { api } from '@/components/auth/AuthContext';
import type { LocalMessage, QueryTypeMessageData } from '@/components/threads/MessageList';

import { getMessageOpts, getThreadOpts } from './queries';
import { usePersistence } from './use-persistence';
import { useStream } from './use-stream';

export const useThreadMessaging = (initialThreadId?: string) => {
	const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
	const latestTokensRef = useRef<string>('');

	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const persistence = usePersistence();

	const {
		data: threads,
		isLoading: threadLoading,
		error: threadErr,
	} = useQuery({
		enabled: !!threadId,
		queryFn: persistence.listThreads,
		queryKey: ['threads'],
	});

	useEffect(() => {
		// keep the threadId in sync with the initialThreadId
		if (initialThreadId) setThreadId(initialThreadId);
	}, [initialThreadId]);

	const thread = useMemo(() => threads?.data.find((t) => t.id === threadId), [threads, threadId]);

	const createThread = useMutation<{ id: string }, unknown, void>({
		mutationFn: () => persistence.createNewThread(),
		onSuccess: (data) => {
			setThreadId(data.id);
			queryClient.invalidateQueries({ queryKey: ['threads'] });
		},
	});

	const generateAndSetTitle = async (threadId: string, message: string) => {
		try {
			const response = await api<{ title: string }>('/generate-title', {
				body: JSON.stringify({ message }),
				method: 'POST',
			});

			if (response.title && persistence.updateThreadName) {
				await persistence.updateThreadName(threadId, response.title);
				queryClient.invalidateQueries({ queryKey: ['threads'] });
			}
		} catch (error) {
			console.error('Failed to generate title:', error);
		}
	};

	const { mutateAsync: sendMessage } = useMutation<
		{ data: APIThreadMessage; changedThread: boolean },
		unknown,
		CreateMessageSchema & { threadId: string },
		{ previousData: InfiniteData<QueryTypeMessageData> | undefined }
	>({
		mutationFn: async ({ threadId, ...data }) => {
			const response = await api(`/threads/${threadId}/messages`, {
				body: JSON.stringify(data),
				method: 'POST',
			});
			console.log('sendMessage response', response);

			return response as { data: APIThreadMessage; changedThread: boolean };
		},
		onError: (_err, _variables, context) => {
			if (!threadId) return;

			// rollback data
			if (context?.previousData)
				queryClient.setQueryData(getMessageOpts(threadId).queryKey, context.previousData);
		},
		onMutate: async ({ content, threadId }) => {
			await queryClient.cancelQueries(getMessageOpts(threadId));

			const previousData = queryClient.getQueryData<InfiniteData<QueryTypeMessageData>>(
				getMessageOpts(threadId).queryKey,
			);

			const localMessage: LocalMessage = {
				content,
				localId: uuidv4(),
				type: 'local',
			};

			queryClient.setQueryData<InfiniteData<QueryTypeMessageData>>(getMessageOpts(threadId).queryKey, (old) => {
				if (!old) {
					return {
						pageParams: [],
						pages: [
							{
								data: [localMessage],
								meta: { nextCursor: null },
							},
						],
					};
				}

				return {
					...old,
					pages: old.pages.map((page, idx) => {
						if (idx !== old.pages.length - 1) return page;
						// prepend the local message to the last page
						return {
							...page,
							data: [localMessage, ...page.data],
						};
					}),
				};
			});

			return { previousData };
		},
		onSettled: (response) => {
			console.log('onSettled response', response, threadId);
			if (threadId) {
				queryClient.invalidateQueries(getMessageOpts(threadId));
				if (response?.changedThread) {
					navigate({ replace: true, to: `/threads/${threadId}` });
					setTimeout(() => {
						// after a brief delay, invalidate the threads query to get the new thread name
						queryClient.invalidateQueries(getThreadOpts);
					}, 4000);
				}
			}
		},
	});

	const handleSendMessage = useCallback(
		async (data: CreateMessageSchema) => {
			if (persistence.sendMessageWithHistory && (!threadId || threadId.startsWith('local-'))) {
				const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

				if (threadId) {
					const response = await persistence.listMessagesForThread(threadId, null);
					for (const msg of response.data) {
						history.push({
							content: msg.content,
							role: msg.type === 'user' ? 'user' : 'assistant',
						});
					}
				}

				const response = await persistence.sendMessageWithHistory(data, history, threadId);
				const isNewLocalThread = !threadId;
				setThreadId(response.threadId);

				// Generate title for new local threads
				if (isNewLocalThread) {
					generateAndSetTitle(response.threadId, data.content);
				}

				// Invalidate queries to refresh the UI
				queryClient.invalidateQueries({ queryKey: ['threads'] });
				if (response.threadId) {
					queryClient.invalidateQueries(getMessageOpts(response.threadId));
				}

				if (!threadId) {
					navigate({ replace: true, to: `/threads/${response.threadId}` });
				}
				return;
			}

			let id = threadId;
			let isNewThread = false;

			if (!id) {
				const created = await createThread.mutateAsync();
				id = created.id;
				setThreadId(id);
				isNewThread = true;
			}

			await sendMessage({ ...data, threadId: id });

			if (isNewThread || thread?.name.trim() === '') {
				generateAndSetTitle(id, data.content);
			}

			if (!threadId) {
				console.log('had no thread id, navigate to new thread', id);
				await queryClient.invalidateQueries(getThreadOpts);
				navigate({ replace: true, to: `/threads/${id}` });
			}
		},
		[threadId, createThread, navigate, queryClient, persistence, sendMessage],
	);

	const streamUrl = useMemo(() => (threadId ? `/threads/${threadId}/stream` : ''), [threadId]);

	const saveStreamedResponseToLocal = useCallback(async (threadId: string, content: string) => {
		const messagesKey = `lbd:thread_messages_${threadId}`;
		const existingMessages = JSON.parse(localStorage.getItem(messagesKey) || '[]');

		const hasExistingResponse = existingMessages.some(
			(msg: APIThreadMessage) => msg.type === 'agent' && msg.content === content,
		);

		if (hasExistingResponse) {
			console.log('Agent response already saved, skipping duplicate');
			return;
		}

		const assistantMessage = {
			attachments: [],
			content,
			createdAt: new Date().toISOString(),
			id: crypto.randomUUID(),
			model: 'assistant',
			type: 'agent',
			updatedAt: new Date().toISOString(),
		};

		existingMessages.push(assistantMessage);
		localStorage.setItem(messagesKey, JSON.stringify(existingMessages));
	}, []);

	const stream = useStream({
		id: threadId,
		onComplete: (tokens) => {
			// for local threads, save the final response when streaming completes
			if (threadId?.startsWith('local-') && persistence.getType() === 'localStorage') {
				saveStreamedResponseToLocal(threadId, tokens);
			}

			if (threadId) queryClient.invalidateQueries(getMessageOpts(threadId));
		},
		url: streamUrl,
	});

	return { sendMessage: handleSendMessage, stream, thread, threadErr, threadId, threadLoading };
};
