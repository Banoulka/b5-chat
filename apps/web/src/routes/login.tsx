import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth/AuthContext';

export const Route = createFileRoute('/login')({
	component: Login,
});

function Login() {
	const { signIn } = useAuth();

	useEffect(() => {
		signIn();
	}, []);

	return null;
}
