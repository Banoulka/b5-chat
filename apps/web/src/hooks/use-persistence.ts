import { useAuth } from '@/components/auth/AuthContext';
import { dbPersistence, localStoragePersistence } from '@/lib/threads/persistence';

export const usePersistence = () => {
	const session = useAuth();

	return session.isSignedIn ? dbPersistence : localStoragePersistence;
};
