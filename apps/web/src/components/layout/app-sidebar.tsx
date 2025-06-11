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
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { getAgentOpts, getThreadOpts } from '@/hooks/queries';

export function AppSidebar() {
	const { data: agents } = useQuery(getAgentOpts);
	const { data: threads } = useQuery(getThreadOpts);

	return (
		<Sidebar>
			<SidebarHeader>
				<h1 className="m-1 w-full text-center text-lg font-light">b5.chat</h1>
			</SidebarHeader>
			<div className="bg-secondary pointer-events-auto fixed top-2 left-2 z-50 m-1 flex flex-row gap-0.5 rounded">
				<SidebarTrigger />
			</div>
			<div className="mt-8"></div>
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
