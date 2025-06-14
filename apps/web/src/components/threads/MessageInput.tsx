import { useLocalStorage } from '@uidotdev/usehooks';

import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SendHorizontal } from 'lucide-react';
import { Textarea } from '../ui/textarea';

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
		// <>
		// 	<p>MessageInput - {threadId ?? 'no thread id'}</p>
		// 	<input
		// 		className="w-full border-2 border-gray-300"
		// 		value={content}
		// 		onChange={(e) => setContent(e.target.value)}
		// 	/>
		// 	<Button onClick={handleSend}>Send</Button>
		// </>

		<div className="bg-secondary mx-auto mt-auto mb-2 flex w-[80%] flex-col rounded-2xl p-2">
			<Textarea
				className="max-h-90 resize-none overflow-y-auto border-none bg-transparent focus-visible:border-none dark:bg-transparent dark:text-white"
				placeholder="Type your message here."
				value={content}
				onChange={(e) => setContent(e.target.value)}
			/>
			<div className="flex">
				<Select>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Model" />
					</SelectTrigger>
					<SelectContent className="dark:bg-secondary">
						<SelectItem value="light">ChatGPT-4o-mini</SelectItem>
						<SelectItem value="dark">Claude 3.5</SelectItem>
						<SelectItem value="system">DeepSeek</SelectItem>
					</SelectContent>
				</Select>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button className="mt-2 ml-auto" size="icon" onClick={handleSend}>
							<SendHorizontal />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Send message</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};

export default MessageInput;
