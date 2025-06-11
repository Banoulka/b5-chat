import type { API_ThreadsResponse } from '@b5-chat/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';

export const Route = createFileRoute('/threads/$threadId')({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const { threadId } = Route.useParams();

	const thread = useMemo(() => {
		const threads = queryClient.getQueryData<API_ThreadsResponse>(['threads']);
		return threads?.data.find((thread) => thread.id === threadId) ?? null;
	}, [queryClient, threadId]);

	if (!thread) {
		throw new Error('TODO: Not found page');
	}

	return <div>Hello "/threads/{threadId}</div>;
}
