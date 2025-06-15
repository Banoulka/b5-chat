import type { ModelCard } from '@b5-chat/common';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '@uidotdev/usehooks';
import { SendHorizontal } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getModelCatalogueOpts } from '@/hooks/queries';
import type { useStream } from '@/hooks/use-stream';

import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Textarea } from '../ui/textarea';

type MessageInputProps = {
	threadId?: string;
	ref?: React.RefObject<HTMLDivElement>;
	onSendNewMessage?: (content: string, modelId: string) => void;
	stream: ReturnType<typeof useStream>;
};

const InputArea = ({ stream, threadId, onSendNewMessage }: MessageInputProps) => {
	const { data: modelCatalogue } = useQuery(getModelCatalogueOpts);

	const [model, setModel] = useLocalStorage(
		`last-model-${threadId}`,
		modelCatalogue?.defaultModel ?? 'openai/gpt-4.1',
	);
	const [content, setContent] = useLocalStorage(`last-input-${threadId}`, '');

	const handleSend = () => {
		if (content.trim() === '') return;

		onSendNewMessage?.(content, model);
		setContent('');
	};

	return (
		<div className="bg-secondary mx-auto mt-auto mb-2 flex w-[80%] flex-col rounded-2xl p-2">
			<Textarea
				className="max-h-90 resize-none overflow-y-auto border-none bg-transparent shadow-none focus-visible:border-none focus-visible:ring-0 dark:bg-transparent dark:text-white"
				placeholder="Type your message here."
				value={content}
				onChange={(e) => setContent(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						handleSend();
					}
				}}
			/>
			<div className="flex items-center">
				<Combobox
					options={
						modelCatalogue?.models.map((model) => ({
							label: model.name,
							value: model.id,
							...model,
						})) ?? []
					}
					renderOption={(option, isSelected) => (
						<ModelSelectItem key={option.value} model={option} isSelected={isSelected} />
					)}
					value={model}
					onChange={setModel}
				/>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button disabled={stream.isStreaming} className="mt-2 ml-auto" size="icon" onClick={handleSend}>
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

const ModelSelectItem = ({ model, isSelected }: { model: ModelCard; isSelected: boolean }) => {
	return (
		<div key={model.id} className="flex items-center gap-2">
			<p>{model.name}</p>
		</div>
	);
};

export default InputArea;
