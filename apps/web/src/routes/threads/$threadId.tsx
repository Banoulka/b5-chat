import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { api } from '@/components/auth/AuthContext';
import { UploaderContextProvider } from '@/components/files/UploaderContext';
import InputArea from '@/components/threads/InputArea';
import MessageList, { type LocalMessage, type QueryTypeMessageData } from '@/components/threads/MessageList';
import { getMessageOpts, getThreadOpts } from '@/hooks/queries';
import { useSize } from '@/hooks/use-size';
import { useStream } from '@/hooks/use-stream';

export const Route = createFileRoute('/threads/$threadId')({
	component: RouteComponent,
});

function RouteComponent() {
	const { threadId } = Route.useParams();
	const queryClient = useQueryClient();

	const {
		data: thread,
		isLoading,
		error,
	} = useQuery({
		...getThreadOpts,
		select: (data) => data.data.find((thread) => thread.id === threadId),
	});

	const { mutateAsync: sendMessage } = useMutation<
		unknown,
		unknown,
		{ content: string; modelId: string },
		{ previousData: InfiniteData<QueryTypeMessageData> | undefined }
	>({
		mutationFn: ({ content, modelId }) =>
			api(`/threads/${threadId}/messages`, {
				body: JSON.stringify({ content: content, modelId }),
				method: 'POST',
			}),
		onError: (_err, _variables, context) => {
			// rollback data
			if (context?.previousData)
				queryClient.setQueryData(getMessageOpts(threadId).queryKey, context.previousData);
		},
		onMutate: async ({ content }) => {
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
						return {
							...page,
							data: [...page.data, localMessage],
						};
					}),
				};
			});

			return { previousData };
		},
		onSettled: () => {
			queryClient.invalidateQueries(getMessageOpts(threadId));
		},
	});

	const bottomRef = useRef<HTMLDivElement>(null);

	const stream = useStream({
		id: threadId,
		onComplete: () => {
			// TODO: Fix the "Flashing" issue when the agent message is added to the query data
			// and simultaneously removes the streaming message.
			// invalidate the messages query. (should fetch the new agent message properly?)
			queryClient.invalidateQueries(getMessageOpts(threadId));
		},
		url: `/threads/${threadId}/stream`,
	});

	const { size, sizeRef } = useSize(bottomRef, { defaultSize: { height: 100, width: 0 } });
	const messageListRef = useRef<HTMLDivElement>(null);

	if (error) return <div>Error: {error.message}</div>;
	if (isLoading) return <div>Loading...</div>;
	if (!thread) return <div>Not found</div>;

	const handleSendNewMessage = async (content: string, modelId: string) => {
		await sendMessage({ content, modelId });

		stream.controls.start();

		if (messageListRef.current) messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
	};
	return (
		<UploaderContextProvider>
			<MessageList
				ref={messageListRef}
				key={threadId}
				bottomRefHeight={size.height}
				threadId={threadId}
				stream={stream}
			/>
			<div ref={sizeRef}>
				<InputArea threadId={threadId} key={threadId} onSendNewMessage={handleSendNewMessage} stream={stream} />
			</div>
		</UploaderContextProvider>
	);
}
