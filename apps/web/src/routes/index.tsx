import { createFileRoute } from '@tanstack/react-router';
import { SendHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	return (
		<div className="flex h-full flex-col items-center justify-center p-2">
			<div className="bg-secondary mt-auto flex w-full flex-col rounded-2xl p-2">
				<Textarea
					className="max-h-90 resize-none overflow-y-auto border-none bg-transparent focus-visible:border-none dark:bg-transparent dark:text-white"
					placeholder="Type your message here."
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
							<Button className="mt-2 ml-auto" size="icon">
								<SendHorizontal />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Send message</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
