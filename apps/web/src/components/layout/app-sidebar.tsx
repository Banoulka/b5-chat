import type { API_Agent, API_ThreadsResponse } from '@b5-chat/common';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
} from '@/components/ui/sidebar';

import { api } from '../auth/AuthContext';

export function AppSidebar() {
	const { data: agents } = useQuery({
		queryFn: () => api<API_Agent[]>('/agents'),
		queryKey: ['agents'],
	});

	const { data: threads } = useQuery({
		queryFn: () => api<API_ThreadsResponse>('/threads'),
		queryKey: ['threads'],
	});

	return (
		<Sidebar>
			<SidebarHeader />
			<SidebarContent>
				<Link to="/">Test test test</Link>
				<Link to="/about">About page</Link>

				<SidebarGroup>
					<SidebarGroupLabel>Threads</SidebarGroupLabel>
					<SidebarGroupContent>
						{threads?.data.map((thread) => (
							<Link
								className="my-2 block w-full text-sm"
								to={'/threads/$threadId'}
								params={{ threadId: thread.id }}
								key={thread.id}
							>
								{thread.name}
							</Link>
						))}
					</SidebarGroupContent>
				</SidebarGroup>

				<pre>{JSON.stringify(threads?.data, null, 2)}</pre>

				{agents?.map((agent) => <p key={agent.id}>{agent.name}</p>)}
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
