import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { api, useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { streamResponse } from '@/lib/streamResponse';

export const Route = createFileRoute('/')({
	component: Index,
});

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

			{isSignedIn ? <h3>Welcome Home {session.user.name}!</h3> : <h3>You are not logged in.</h3>}

			{isSignedIn ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}
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
