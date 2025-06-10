import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

const queryClient = new QueryClient();

export const Route = createRootRoute({
	component: () => (
		<>
			<QueryClientProvider client={queryClient}>
				<SidebarProvider>
					<AppSidebar />
					<main>
						<SidebarTrigger />
						<Outlet />
					</main>
				</SidebarProvider>
			</QueryClientProvider>
			<TanStackRouterDevtools />
		</>
	),
});
