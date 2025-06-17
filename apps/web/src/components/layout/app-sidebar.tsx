import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenuButton,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { getThreadOpts } from '@/hooks/queries';

import { useAuth } from '../auth/AuthContext';

export function AppSidebar({ children }: { children: React.ReactNode }) {
	const params = useParams({ from: '/threads/$threadId', shouldThrow: false });

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
			<div className="bg-secondary pointer-events-auto fixed top-2 left-2 z-[9999] m-1 flex flex-row gap-0.5 rounded">
				<SidebarTrigger />
			</div>
			<Sidebar>
				<SidebarHeader>
					<h1 className="m-1 w-full text-center text-lg font-light">b5.chat</h1>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<Link to="/">New Chat</Link>
					</SidebarGroup>
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
									{params?.threadId === thread.id ? '> ' : ''}
									{thread.name}
								</Link>
							))}
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<SidebarContent>
						<AuthButton />
					</SidebarContent>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
			{children}
		</SidebarProvider>
	);
}

const AuthButton = () => {
	const { isSignedIn, session, signOut, signIn } = useAuth();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton>{isSignedIn ? session.user.name : 'Account'}</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem>
					<Link to="/settings">Settings</Link>
				</DropdownMenuItem>
				{isSignedIn ? (
					<DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
				) : (
					<DropdownMenuItem onClick={signIn}>Login</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
