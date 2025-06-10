import type { Session } from '@b5-chat/common';
import { createContext, useContext, useEffect, useState } from 'react';

import { env } from '@/env';

const API = env.VITE_API_URL;
export const api = <T,>(path: string, init: RequestInit = {}) =>
	fetch(`${API}${path}`, { credentials: 'include', ...init }).then((res) => res.json() as Promise<T>);

interface BaseContext {
	signIn: () => Promise<void>;
	signOut: () => Promise<void>;
	isLoading: boolean;
}

interface AuthenticatedContext extends BaseContext {
	isSignedIn: true;
	session: Session;
}

interface UnauthenticatedContext extends BaseContext {
	isSignedIn: false;
	session: null;
}

const AuthCtx = createContext<AuthenticatedContext | UnauthenticatedContext | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		api<Session>('/auth/session')
			.then(setSession)
			.finally(() => setIsLoading(false));
	}, []);

	const signIn = async () => {
		const url = new URL(env.VITE_API_URL + '/auth/signin');
		window.location.href = url.toString();
	};

	const signOut = async () => {
		const url = new URL(env.VITE_API_URL + '/auth/signout');
		window.location.href = url.toString();
	};

	return (
		<AuthCtx.Provider
			value={
				{ isLoading, isSignedIn: !!session, session, signIn, signOut } as
					| AuthenticatedContext
					| UnauthenticatedContext
			}
		>
			{children}
		</AuthCtx.Provider>
	);
};

export const useAuth = () => {
	const ctx = useContext(AuthCtx);
	if (!ctx) throw new Error('useAuth must be used within an AuthProvider');

	return ctx;
};
