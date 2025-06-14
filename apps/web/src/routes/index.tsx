import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { api, useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/')({
	component: Index,
});

const fakeMessage = {
	// random UUID
	content: 'Hello! How can I assist you today?',
	// another UUID from your threads table
	createdAt: new Date('2025-06-10T12:00:00Z'),
	id: 'b1c0e2fc-4a5b-4d7e-b5c4-3f92a8a7b901',
	// assuming 'user' is a valid value from your `messageTypeEnum`
	threadId: '3d0e7e92-bf51-4f0e-ae3c-949aef8d5c9d',
	type: 'user',
	updatedAt: new Date('2025-06-10T12:00:00Z'),
};

function Index() {
	const { session, isSignedIn } = useAuth();

	const { data } = useQuery({
		queryFn: () => api('/protected'),
		queryKey: ['protected'],
	});

	console.log('session', session);

	return (
		<div className="p-2">
			<pre>{JSON.stringify(data, null, 2)}</pre>

			{isSignedIn ? <h3>Welcome home {session.user.name}!</h3> : <h3>You are not logged in.</h3>}

			<Textarea className="fixed bottom-2 p-2" placeholder="Type your message here." />
			<Button className="bg-primary hover:bg-primary/90 absolute right-4 bottom-4 rounded-md px-4 py-4 text-white transition">
				Submit
			</Button>
		</div>
	);
}
