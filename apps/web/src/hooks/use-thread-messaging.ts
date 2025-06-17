import type { APIThread } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';
import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
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

	const thread = useMemo(() => threads?.data.find((t) => t.id === threadId), [threads, threadId]);

	const createThread = useMutation<{ id: string }, unknown, void>({
		mutationFn: () => api<APIThread>('/threads', { method: 'POST' }),
		onSuccess: (data) => {
			setThreadId(data.id);
			queryClient.invalidateQueries(getThreadOpts);
		},
	});

	const { mutateAsync: sendMessage } = useMutation<
		unknown,
		unknown,
		CreateMessageSchema,
		{ previousData: InfiniteData<QueryTypeMessageData> | undefined }
	>({
		mutationFn: async (data) => {
			let id = threadId;
			// lazily create thread beforehand
			if (!id) {
				const created = await createThread.mutateAsync();
				id = created.id;
			}

			const response = await api(`/threads/${id}/messages`, {
				body: JSON.stringify(data),
				method: 'POST',
			});

			console.log('response', response, threadId, id);

			// navigate to the new thread if we created it
			if (!threadId) {
				navigate({ replace: true, to: `/threads/${id}` });
			}

			return response;
		},
		onError: (_err, _variables, context) => {
			if (!threadId) return;

			// rollback data
			if (context?.previousData)
				queryClient.setQueryData(getMessageOpts(threadId).queryKey, context.previousData);
		},
		onMutate: async ({ content }) => {
			if (!threadId) return;

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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onSettled: (response: any) => {
			console.log('response on settled', response);
			if (threadId) queryClient.invalidateQueries(getMessageOpts(threadId));

			if (response?.changedThread) {
				queryClient.invalidateQueries(getThreadOpts);
				navigate({ replace: true, to: `/threads/${threadId}` });
			}
		},
	});

	const stream = useStream({
		id: threadId,
		onComplete: () => threadId && queryClient.invalidateQueries(getMessageOpts(threadId)),
		url: threadId ? `/threads/${threadId}/stream` : '',
	});

	return { sendMessage, stream, thread, threadErr, threadId, threadLoading };
};
