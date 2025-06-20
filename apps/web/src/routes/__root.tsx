import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type React from 'react';

import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppSidebarInset } from '@/components/layout/app-sidebar-inset';
import { LoadingSpinner } from '@/components/ui/spinner';
import { SyncStatus } from '@/components/ui/sync-status';
import { env } from '@/env';

const queryClient = new QueryClient();
console.log('env url', env.VITE_API_URL);

export const Route = createRootRoute({
	component: () => (
		<>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<AuthLoader>
						<AppSidebar>
							<AppSidebarInset>
								<SyncStatus />
								<Outlet />
							</AppSidebarInset>
						</AppSidebar>
					</AuthLoader>
					<ReactQueryDevtools buttonPosition="top-right" />
					<TanStackRouterDevtools position="top-right" />
				</AuthProvider>
			</QueryClientProvider>
		</>
	),
});

const AuthLoader = ({ children }: { children: React.ReactNode | React.ReactNode[] }) => {
	const { isLoading } = useAuth();

	if (isLoading) return <LoadingSpinner size="lg" className="min-h-screen" />;

	return children;
};
