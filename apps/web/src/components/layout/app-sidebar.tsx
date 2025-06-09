import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader />
			<SidebarContent>
				<Link to="/">Test test test</Link>
				<Link to="/about">About page</Link>

				<SidebarGroup />
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
