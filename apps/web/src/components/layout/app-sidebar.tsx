import type { API_Agent, API_ThreadResponse } from '@b5-chat/common';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import { api, useAuth } from '../auth/AuthContext';

export function AppSidebar() {
	const { session, isSignedIn } = useAuth();

	const { data: agents } = useQuery({
		queryFn: () => api<API_Agent[]>('/agents'),
		queryKey: ['agents'],
	});

	const { data: threads } = useQuery({
		queryFn: () => api<API_ThreadResponse>('/threads'),
		queryKey: ['threads'],
	});

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarContent>
					<SidebarMenuItem>
						<SidebarMenuButton>New Chat</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarContent>
			</SidebarHeader>

			<SidebarContent>
				<Link to="/">Test test test</Link>
				<Link to="/about">About page</Link>

				<SidebarGroup />
				<SidebarGroup />

				<pre>{JSON.stringify(threads?.data, null, 2)}</pre>

				{agents?.map((agent) => <p key={agent.id}>{agent.name}</p>)}
			</SidebarContent>

			<SidebarFooter>
				<SidebarContent>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton>Account</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem>
									<span>
										<Link to="/settings">Settings</Link>
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<span>
										{isSignedIn ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}
									</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarContent>
			</SidebarFooter>
		</Sidebar>
	);
}
