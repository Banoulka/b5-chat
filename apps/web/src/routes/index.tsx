import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { api, useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { streamResponse } from '@/lib/streamResponse';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/')({
	component: Index,
});

const fakeMessage = {
	id: 'b1c0e2fc-4a5b-4d7e-b5c4-3f92a8a7b901', // random UUID
	content: 'Hello! How can I assist you today?',
	type: 'user', // assuming 'user' is a valid value from your `messageTypeEnum`
	threadId: '3d0e7e92-bf51-4f0e-ae3c-949aef8d5c9d', // another UUID from your threads table
	createdAt: new Date('2025-06-10T12:00:00Z'),
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

			<TestStreamer />

			{isSignedIn ? <h3>Welcome home {session.user.name}!</h3> : <h3>You are not logged in.</h3>}

			<Textarea className="fixed bottom-2 p-2" placeholder="Type your message here." />
			<Button className="bg-primary hover:bg-primary/90 absolute right-4 bottom-4 rounded-md px-4 py-4 text-white transition">
				Submit
			</Button>
		</div>
	);
}

const TestStreamer = () => {
	const [data, setData] = useState('');
	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchStream = () => {
		setData('');
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		streamResponse('/stream', {
			abortController,
			onData: (data) => setData((prev) => prev + data),
			onEnd: () => {
				console.log('Stream ended');
				abortControllerRef.current = null;
			},
			onError: (error) => console.error(error),
		});
	};

	useEffect(() => {
		return () => {
			abortControllerRef.current?.abort();
		};
	}, []);

	return (
		<div>
			<Button onClick={fetchStream}>Fetch Stream</Button>
			{abortControllerRef.current && <Button onClick={() => abortControllerRef.current?.abort()}>Abort</Button>}
			<pre className="mt-4 text-xs whitespace-pre-wrap">{data}</pre>
		</div>
	);
};
