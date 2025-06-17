import type { ModelCard } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '@uidotdev/usehooks';
import { LucideBrain, LucideGlobe, LucideImage, LucideInfo, LucidePaperclip, SendHorizontal } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getModelCatalogueOpts } from '@/hooks/queries';
import type { useStream } from '@/hooks/use-stream';

import OpenAILogo from '../../assets/logos/chatgpt-icon.svg';
import ClaudeLogoSymbol from '../../assets/logos/claude-ai-icon.svg';
import DeepSeekLogo from '../../assets/logos/deepseek-logo-icon.svg';
import GeminiStar from '../../assets/logos/google-gemini-icon.svg';
import FacebookMetaLogo from '../../assets/logos/meta-icon.svg';
import { LocalFileDisplay } from '../files/LocalFileDisplay';
import UploaderButton from '../files/UploaderButton';
import { useUploaderContext } from '../files/UploaderContext';
import { Badge as ShadBadge } from '../ui/badge';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Textarea } from '../ui/textarea';

type MessageInputProps = {
	threadId?: string;
	ref?: React.RefObject<HTMLDivElement>;
	onSendNewMessage?: (data: CreateMessageSchema) => void;
	stream: ReturnType<typeof useStream>;
};

const InputArea = ({ stream, threadId, onSendNewMessage }: MessageInputProps) => {
	const { data: modelCatalogue } = useQuery(getModelCatalogueOpts);
	const { readyFiles, clearFiles } = useUploaderContext();
	const [model, setModel] = useLocalStorage(
		`last-model-${threadId}`,
		modelCatalogue?.defaultModel ?? 'openai/gpt-4.1',
	);
	const [content, setContent] = useLocalStorage(`last-input-${threadId}`, '');

	const handleSend = () => {
		if (content.trim() === '') return;

		onSendNewMessage?.({
			attachments: readyFiles.map((file) => ({ key: file.key, name: file.name, url: file.url })),
			content,
			modelId: model,
		});
		setContent('');
		clearFiles();
	};

	return (
		<div className="bg-secondary mx-auto mt-auto mb-2 flex w-[80%] flex-col rounded-2xl p-2">
			<LocalFileDisplay />

			<Textarea
				className="max-h-90 resize-none overflow-y-auto border-none bg-transparent shadow-none focus-visible:border-none focus-visible:ring-0 dark:bg-transparent dark:text-white"
				placeholder="Type your message here."
				value={content}
				onChange={(e) => setContent(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						handleSend();
					}
				}}
			/>
			<div className="flex items-center">
				<Combobox
					options={
						modelCatalogue?.models
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((model) => ({
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

				<UploaderButton />

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
	const logoDict = {
		anthropic: ClaudeLogoSymbol,
		deepseek: DeepSeekLogo,
		google: GeminiStar,
		'meta-llama': FacebookMetaLogo,
		openai: OpenAILogo,
	};

	const match = model.id.split('/')[0];

	const logoSvg = logoDict[match as keyof typeof logoDict];

	const capabilities = {
		file: (
			<Tooltip key="file">
				<TooltipTrigger>
					<ShadBadge variant={'secondary'} size={'icon'}>
						<LucidePaperclip />
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Supports file upload</TooltipContent>
			</Tooltip>
		),
		image: (
			<Tooltip key="image">
				<TooltipTrigger>
					<ShadBadge variant={'secondary'} size={'icon'}>
						<LucideImage />
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Supports image upload</TooltipContent>
			</Tooltip>
		),
		reasoning: (
			<Tooltip key="reasoning">
				<TooltipTrigger>
					<ShadBadge variant={'secondary'} size={'icon'}>
						<LucideBrain />
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Reasoning model</TooltipContent>
			</Tooltip>
		),
		web_search_options: (
			<Tooltip key="web_search">
				<TooltipTrigger>
					<ShadBadge variant={'secondary'} size={'icon'}>
						<LucideGlobe />
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Supports internet searching</TooltipContent>
			</Tooltip>
		),
	};

	return (
		<div key={model.id} className="flex w-full items-center gap-2 p-2">
			<img src={logoSvg} alt={model.name} className="mr-2 h-6 w-6" />

			<p>{model.name}</p>

			<Tooltip>
				<TooltipTrigger asChild className="mr-6">
					<ShadBadge variant="ghost" size="icon">
						<LucideInfo />
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>
					<span className="max-w-[80ch] whitespace-pre-wrap">{model.description}</span>
				</TooltipContent>
			</Tooltip>

			<div className="ml-auto flex items-center gap-2">
				{model.supported_parameters.map((param) => capabilities[param as keyof typeof capabilities])}

				{model.architecture.input_modalities.map((param) => capabilities[param as keyof typeof capabilities])}
			</div>
		</div>
	);
};

export default InputArea;
