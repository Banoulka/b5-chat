import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';

import MessageInput from '@/components/threads/MessageInput';
import MessageList from '@/components/threads/MessageList';
import { getThreadOpts } from '@/hooks/queries';
import { useSize } from '@/hooks/use-size';

export const Route = createFileRoute('/threads/$threadId')({
	component: RouteComponent,
});

function RouteComponent() {
	const { threadId } = Route.useParams();

	const {
		data: thread,
		isLoading,
		error,
	} = useQuery({
		...getThreadOpts,
		select: (data) => data.data.find((thread) => thread.id === threadId),
	});

	const bottomRef = useRef<HTMLDivElement>(null);

	const size = useSize(bottomRef, { defaultSize: { height: 100, width: 0 } });

	if (error) return <div>Error: {error.message}</div>;
	if (isLoading) return <div>Loading...</div>;
	if (!thread) return <div>Not found</div>;

	return (
		<>
			<MessageList bottomRefHeight={size.height} threadId={threadId} />
			<div ref={bottomRef}>
				<MessageInput />
			</div>
		</>
	);
}
