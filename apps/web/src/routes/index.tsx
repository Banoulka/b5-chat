import { createFileRoute, Link } from '@tanstack/react-router';

import { useAuth } from '@/components/auth/AuthContext';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	const { session, isSignedIn } = useAuth();

	console.log('session', session);

	return (
		<div className="p-2">
			{isSignedIn ? <h3>Welcome Home {session.user.name}!</h3> : <h3>You are not logged in.</h3>}

			{isSignedIn ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}
		</div>
	);
}
