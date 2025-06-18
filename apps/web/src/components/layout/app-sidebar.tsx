import type { APIThread } from '@b5-chat/common';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import dayjs from 'dayjs';
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
import { usePersistence } from '@/hooks/use-persistence';

import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/button';

export function AppSidebar({ children }: { children: React.ReactNode }) {
	const params = useParams({ from: '/threads/$threadId', shouldThrow: false });

	const persistence = usePersistence();

	const { data: threads } = useQuery({
		queryFn: persistence.listThreads,
		queryKey: ['threads'],
	});

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

	const today = dayjs().startOf('day');
	const yesterday = dayjs().subtract(1, 'day');
	const sevenDaysAgo = dayjs().subtract(7, 'day');
	const thirtyDaysAgo = dayjs().subtract(30, 'day');

	const groupedThreads: Record<string, APIThread[]> = {
		Today: [],
		Yesterday: [],
		// eslint-disable-next-line sort-keys-fix/sort-keys-fix
		'Last 7 days': [],
		// eslint-disable-next-line sort-keys-fix/sort-keys-fix
		'Last 30 days': [],
		Older: [],
	};

	if (threads?.data) {
		threads?.data.forEach((thread) => {
			const threadDate = dayjs(thread.updatedAt);

			if (threadDate.isSame(today, 'day')) {
				groupedThreads.Today?.push(thread);
			} else if (threadDate.isSame(yesterday, 'day')) {
				groupedThreads.Yesterday?.push(thread);
			} else if (threadDate.isAfter(sevenDaysAgo) && threadDate.isBefore(yesterday)) {
				groupedThreads['Last 7 days']?.push(thread);
			} else if (threadDate.isAfter(thirtyDaysAgo) && threadDate.isBefore(sevenDaysAgo)) {
				groupedThreads['Last 30 days']?.push(thread);
			} else {
				groupedThreads.Older?.push(thread);
			}
		});
	}

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
						<Link to="/" className="bg-primary text-primary-foreground block w-full rounded p-2 text-sm">
							New Chat
						</Link>
					</SidebarGroup>
					<SidebarGroup>
						<SidebarGroupContent>
							{threads?.data &&
								Object.entries(groupedThreads).map(([label, items]) => {
									if (items.length === 0) return null;

									return (
										<div key={label}>
											<SidebarGroupLabel className="text-muted-foreground text-xs">
												{label}
											</SidebarGroupLabel>
											{items
												.sort((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
												.map((thread) => (
													<Link
														key={thread.id}
														to="/threads/$threadId"
														params={{ threadId: thread.id }}
														className={`my-0.5 block w-full rounded p-2 text-sm ${
															params?.threadId === thread.id
																? 'bg-accent text-accent-foreground'
																: ''
														}`}
													>
														{thread.name}
													</Link>
												))}
										</div>
									);
								})}
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

	if (!isSignedIn) return <Button onClick={signIn}>Sign in</Button>;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton asChild>
					<Button>
						<img src={session?.user.image ?? ''} alt="User Avatar" className="h-4 w-4 rounded-full" />
						{session?.user.name}
					</Button>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem>
					<Link to="/settings">Settings</Link>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
