import type { API_Agent, API_ThreadResponse } from '@b5-chat/common';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '@/components/ui/sidebar';

import { api } from '../auth/AuthContext';

export function AppSidebar() {
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
			<SidebarHeader />
			<SidebarContent>
				<Link to="/">Test test test</Link>
				<Link to="/about">About page</Link>

				<SidebarGroup />
				<SidebarGroup />

				<pre>{JSON.stringify(threads?.data, null, 2)}</pre>

				{agents?.map((agent) => <p key={agent.id}>{agent.name}</p>)}
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
