import { useLocalStorage } from '@uidotdev/usehooks';

import { Button } from '../ui/button';

type MessageInputProps = {
	threadId?: string;
	ref?: React.RefObject<HTMLDivElement>;
	onSendNewMessage?: (content: string) => void;
};

const MessageInput = ({ threadId, onSendNewMessage }: MessageInputProps) => {
	const [content, setContent] = useLocalStorage(`last-input-${threadId}`, '');

	const handleSend = () => {
		if (content.trim() === '') return;

		onSendNewMessage?.(content);
		setContent('');
	};

	return (
		<>
			<p>MessageInput - {threadId ?? 'no thread id'}</p>
			<input
				className="w-full border-2 border-gray-300"
				value={content}
				onChange={(e) => setContent(e.target.value)}
			/>
			<Button onClick={handleSend}>Send</Button>
		</>
	);
};

export default MessageInput;
