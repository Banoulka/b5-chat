import { Loader2 } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthContext';

export const SyncStatus = () => {
	const { isSyncing } = useAuth();

	if (!isSyncing) return null;

	return (
		<div className="bg-background fixed top-4 left-[50%] z-[9999] flex -translate-x-[50%] items-center gap-2 rounded-lg border px-3 py-2 shadow-lg">
			<Loader2 className="h-4 w-4 animate-spin" />
			<span className="text-sm">Syncing local data...</span>
		</div>
	);
};
