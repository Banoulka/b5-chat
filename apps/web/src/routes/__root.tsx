import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type React from 'react';

import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppSidebarInset } from '@/components/layout/app-sidebar-inset';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LoadingSpinner } from '@/components/ui/spinner';
import { env } from '@/env';

const queryClient = new QueryClient();
console.log('env url', env.VITE_API_URL);

export const Route = createRootRoute({
	component: () => (
		<>
			<AuthProvider>
				<QueryClientProvider client={queryClient}>
					<AuthLoader>
						<SidebarProvider>
							<AppSidebar>
								<AppSidebarInset>
									<p>test outlet</p>
								</AppSidebarInset>
							</AppSidebar>
						</SidebarProvider>
					</AuthLoader>
				</QueryClientProvider>
				<TanStackRouterDevtools />
			</AuthProvider>
		</>
	),
});

const AuthLoader = ({ children }: { children: React.ReactNode | React.ReactNode[] }) => {
	const { isLoading } = useAuth();

	if (isLoading) return <LoadingSpinner size="lg" className="min-h-screen" />;

	return children;
};
