import type { ModelCard } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '@uidotdev/usehooks';
import { SendHorizontal } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getModelCatalogueOpts } from '@/hooks/queries';
import type { useStream } from '@/hooks/use-stream';

import { LocalFileDisplay } from '../files/LocalFileDisplay';
import UploaderButton from '../files/UploaderButton';
import { useUploaderContext } from '../files/UploaderContext';
import ClaudeLogoSymbol from '../logos/Claude';
import DeepSeekLogo from '../logos/DeepSeek';
import GeminiStar from '../logos/Gemini';
import FacebookMetaLogo from '../logos/Meta';
import OpenAILogo from '../logos/OpenAI';
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

			<div className="mb-2 flex flex-wrap gap-2">
				{readyFiles
					.filter((file) => file.url.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i))
					.map((file) => (
						<img
							key={file.key}
							src={file.url}
							alt={file.name}
							className="h-24 rounded object-cover shadow"
						/>
					))}
			</div>
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
							.sort((a, b) => {
								return a.name.localeCompare(b.name);
							})
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
		anthropic: <ClaudeLogoSymbol />,
		deepseek: <DeepSeekLogo />,
		google: <GeminiStar />,
		'meta-llama': <FacebookMetaLogo />,
		openai: <OpenAILogo />,
	};

	const match = model.id.split('/')[0];

	const logoSvg = logoDict[match as keyof typeof logoDict];

	const capabilities = {
		file: (
			<Tooltip>
				<TooltipTrigger>
					<ShadBadge variant={'outline'}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-file-text-icon lucide-file-text"
						>
							<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
							<path d="M14 2v4a2 2 0 0 0 2 2h4" />
							<path d="M10 9H8" />
							<path d="M16 13H8" />
							<path d="M16 17H8" />
						</svg>
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Supports file upload</TooltipContent>
			</Tooltip>
		),
		image: (
			<Tooltip>
				<TooltipTrigger>
					<ShadBadge variant={'outline'}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-image-icon lucide-image"
						>
							<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
							<circle cx="9" cy="9" r="2" />
							<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
						</svg>
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Supports image upload</TooltipContent>
			</Tooltip>
		),
		reasoning: (
			<Tooltip>
				<TooltipTrigger>
					<ShadBadge variant={'outline'}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-brain-circuit-icon lucide-brain-circuit"
						>
							<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
							<path d="M9 13a4.5 4.5 0 0 0 3-4" />
							<path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
							<path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
							<path d="M6 18a4 4 0 0 1-1.967-.516" />
							<path d="M12 13h4" />
							<path d="M12 18h6a2 2 0 0 1 2 2v1" />
							<path d="M12 8h8" />
							<path d="M16 8V5a2 2 0 0 1 2-2" />
							<circle cx="16" cy="13" r=".5" />
							<circle cx="18" cy="3" r=".5" />
							<circle cx="20" cy="21" r=".5" />
							<circle cx="20" cy="8" r=".5" />
						</svg>
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Reasoning model</TooltipContent>
			</Tooltip>
		),
		web_search_options: (
			<Tooltip>
				<TooltipTrigger>
					<ShadBadge variant={'outline'}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-search-icon lucide-search"
						>
							<path d="m21 21-4.34-4.34" />
							<circle cx="11" cy="11" r="8" />
						</svg>
					</ShadBadge>
				</TooltipTrigger>
				<TooltipContent>Supports internet searching</TooltipContent>
			</Tooltip>
		),
	};

	return (
		<div key={model.id} className="flex items-center gap-2 p-2">
			{logoSvg}
			<p>{model.name}</p>

			{model.supported_parameters.map((param) => {
				const capability = capabilities[param as keyof typeof capabilities];

				return capability;
			})}

			{model.architecture.input_modalities.map((param) => {
				const input = capabilities[param as keyof typeof capabilities];

				return input;
			})}
		</div>
	);
};

export default InputArea;
