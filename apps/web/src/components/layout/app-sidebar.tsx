import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { getAgentOpts, getThreadOpts } from '@/hooks/queries';

export function AppSidebar({ children }: { children: React.ReactNode }) {
	const { data: agents } = useQuery(getAgentOpts);
	const { data: threads } = useQuery(getThreadOpts);

	// Load default state from localStorage
	const [defaultOpen, setDefaultOpen] = useState(true);
	const [defaultWidth, setDefaultWidth] = useState('16rem');

	useEffect(() => {
		const savedState = localStorage.getItem('sidebar:state');
		const savedWidth = localStorage.getItem('sidebar:width');

		if (savedState !== null) {
			setDefaultOpen(savedState === 'true');
		}
		if (savedWidth) {
			setDefaultWidth(savedWidth);
		}
	}, []);

	return (
		<SidebarProvider defaultOpen={defaultOpen} defaultWidth={defaultWidth}>
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

					{agents?.map((agent) => <p key={agent.id}>{agent.name}</p>)}
				</SidebarContent>
				<SidebarFooter>
					<p>something in the footer</p>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
			{children}
		</SidebarProvider>
	);
}
