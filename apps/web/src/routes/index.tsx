import { createFileRoute } from '@tanstack/react-router';

import { useAuth } from '@/components/auth/AuthContext';
import { UploaderContextProvider } from '@/components/files/UploaderContext';
import InputArea from '@/components/threads/InputArea';
import { useThreadMessaging } from '@/hooks/use-thread-messaging';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	const { session } = useAuth();
	const { sendMessage, stream } = useThreadMessaging();

	return (
		<div className="flex h-full flex-col items-center justify-center">
			<div className="mt-auto text-center">
				<h1 className="text-6xl font-thin">Hello, {session?.user.name?.split(' ')?.[0] ?? 'world'}!</h1>
				<p className="mt-3 text-xl">Let's talk about something together.</p>
			</div>
			<UploaderContextProvider>
				<InputArea onSendNewMessage={sendMessage} stream={stream} />
			</UploaderContextProvider>
		</div>
	);
}
