import type { APIThread, APIThreadMessage } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';
import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { api } from '@/components/auth/AuthContext';
import type { LocalMessage, QueryTypeMessageData } from '@/components/threads/MessageList';

import { getMessageOpts, getThreadOpts } from './queries';
import { useStream } from './use-stream';

export const useThreadMessaging = (initialThreadId?: string) => {
	const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);

	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const {
		data: threads,
		isLoading: threadLoading,
		error: threadErr,
	} = useQuery({
		...getThreadOpts,
		enabled: !!threadId,
	});

	useEffect(() => {
		// keep the threadId in sync with the initialThreadId
		if (initialThreadId) setThreadId(initialThreadId);
	}, [initialThreadId]);

	const thread = useMemo(() => threads?.data.find((t) => t.id === threadId), [threads, threadId]);

	const createThread = useMutation<{ id: string }, unknown, void>({
		mutationFn: () => api<APIThread>('/threads', { method: 'POST' }),
		onSuccess: (data) => {
			setThreadId(data.id);
			queryClient.invalidateQueries(getThreadOpts);
		},
	});

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
			let id = threadId;

			if (!id) {
				const created = await createThread.mutateAsync();
				id = created.id;
				setThreadId(id);
			}

			await sendMessage({ ...data, threadId: id });

			if (!threadId) {
				console.log('had no thread id, navigate to new thread', id);
				await queryClient.invalidateQueries(getThreadOpts);
				navigate({ replace: true, to: `/threads/${id}` });
			}
		},
		[threadId, createThread, navigate, queryClient],
	);

	const streamUrl = useMemo(() => (threadId ? `/threads/${threadId}/stream` : ''), [threadId]);

	const stream = useStream({
		id: threadId,
		onComplete: () => threadId && queryClient.invalidateQueries(getMessageOpts(threadId)),
		url: streamUrl,
	});

	return { sendMessage: handleSendMessage, stream, thread, threadErr, threadId, threadLoading };
};
