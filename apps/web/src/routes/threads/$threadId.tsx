import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { getThreadOpts } from '@/hooks/queries';

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

	if (error) return <div>Error: {error.message}</div>;
	if (isLoading) return <div>Loading...</div>;
	if (!thread) return <div>Not found</div>;

	return (
		<div className="flex h-full w-full flex-col bg-green-200">
			{new Array(100).fill(0).map((_, i) => (
				<div key={i} className="m-2 bg-red-200">
					message {i}
				</div>
			))}
		</div>
	);
}
