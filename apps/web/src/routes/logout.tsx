import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth/AuthContext';

export const Route = createFileRoute('/logout')({
	component: RouteComponent,
});

function RouteComponent() {
	const { signOut } = useAuth();

	useEffect(() => {
		signOut();
	}, []);

	return null;
}
