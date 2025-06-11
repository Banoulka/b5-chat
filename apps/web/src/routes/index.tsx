import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import Markdown from 'react-markdown';

import { api, useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { useStream } from '@/hooks/use-stream';

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
	const { tokens, controls } = useStream('/stream', '1234');

	return (
		<div>
			<Button onClick={controls.start}>Fetch Stream</Button>
			{controls.canStop && <Button onClick={controls.stop}>Abort</Button>}
			<div className="mt-4 min-h-[50vh] min-w-full rounded-md bg-red-200 p-2 text-xs whitespace-pre-wrap">
				<Markdown>{tokens}</Markdown>
			</div>
		</div>
	);
};
