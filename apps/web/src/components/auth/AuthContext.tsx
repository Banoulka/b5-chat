import type { Session } from '@b5-chat/common';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { env } from '@/env';
import { syncToServer } from '@/lib/threads/persistence';

const API = env.VITE_API_URL;
export const api = <T,>(path: string, init: RequestInit = {}) =>
	fetch(`${API}${path}`, { credentials: 'include', ...init }).then((res) => {
		if (300 > res.status && res.status >= 200) {
			return res.json() as Promise<T>;
		}

		throw new Error('Network request error!!!!' + res.status);
	});

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

	const isSignedIn = useMemo(() => !!session, [session]);

	const lastSignedInRef = useRef<boolean>(isSignedIn);

	useEffect(() => {
		if (isSignedIn !== lastSignedInRef.current) {
			lastSignedInRef.current = isSignedIn;
			console.log('unauthenticated to authenticated, we should try and sync to the server');
			syncToServer();
		}
	}, [isSignedIn]);

	useEffect(() => {
		api<Session>('/me')
			.then(setSession)
			.catch(() => setSession(null))
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
			value={{ isLoading, isSignedIn, session, signIn, signOut } as AuthenticatedContext | UnauthenticatedContext}
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
