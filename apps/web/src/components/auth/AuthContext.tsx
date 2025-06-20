import type { Session } from '@b5-chat/common';
import { useQueryClient } from '@tanstack/react-query';
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
	isSyncing: boolean;
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
	const queryClient = useQueryClient();
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);

	const isSignedIn = useMemo(() => !!session, [session]);

	const lastSignedInRef = useRef<boolean>(isSignedIn);

	useEffect(() => {
		const handleSync = async () => {
			const wasSignedIn = lastSignedInRef.current;
			const isNowSignedIn = isSignedIn;

			if (!wasSignedIn && isNowSignedIn) {
				console.log('User signed in - syncing local data to server...');
				setIsSyncing(true);

				try {
					await syncToServer();
					console.log('Successfully synced local data to server');

					queryClient.invalidateQueries({ queryKey: ['threads'] });
				} catch (error) {
					console.error('Failed to sync local data to server:', error);
				} finally {
					setIsSyncing(false);
				}
			}

			lastSignedInRef.current = isNowSignedIn;
		};

		handleSync();
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
			value={
				{ isLoading, isSignedIn, isSyncing, session, signIn, signOut } as
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
