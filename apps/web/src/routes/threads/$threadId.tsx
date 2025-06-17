import { type CreateMessageSchema } from '@b5-chat/common/schemas';
import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';

import { UploaderContextProvider } from '@/components/files/UploaderContext';
import FullScreenSpinner from '@/components/layout/full-screen-spinner';
import NotFound from '@/components/layout/not-found';
import InputArea from '@/components/threads/InputArea';
import MessageList from '@/components/threads/MessageList';
import { useSize } from '@/hooks/use-size';
import { useThreadMessaging } from '@/hooks/use-thread-messaging';

export const Route = createFileRoute('/threads/$threadId')({
	component: RouteComponent,
});

function RouteComponent() {
	const { threadId } = Route.useParams();
	const { thread, threadLoading, threadErr, sendMessage, stream } = useThreadMessaging(threadId);
	console.log('thread', thread?.id, thread?.name);

	const bottomRef = useRef<HTMLDivElement>(null);

	const { size, sizeRef } = useSize(bottomRef, { defaultSize: { height: 100, width: 0 } });
	const messageListRef = useRef<HTMLDivElement>(null);

	if (threadErr) return <div>Error: {threadErr.message}</div>;
	if (threadLoading) return <FullScreenSpinner />;
	if (!thread) return <NotFound />;

	const handleSendNewMessage = async (data: CreateMessageSchema) => {
		await sendMessage(data);

		stream.controls.start();

		// scroll to bottom
		if (messageListRef.current) {
			messageListRef.current.scrollTo({
				behavior: 'smooth',
				top: messageListRef.current.scrollHeight,
			});
		}
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
				<InputArea key={threadId} inputKey={threadId} onSendNewMessage={handleSendNewMessage} stream={stream} />
			</div>
		</UploaderContextProvider>
	);
}
