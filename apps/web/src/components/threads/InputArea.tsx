import type { ModelCard } from '@b5-chat/common';
import type { CreateMessageSchema } from '@b5-chat/common/schemas';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '@uidotdev/usehooks';
import {
	LucideBrain,
	LucideGlobe,
	LucideImage,
	LucideInfo,
	LucidePaperclip,
	LucideSquare,
	SendHorizontal,
} from 'lucide-react';
import { useMemo } from 'react';

import { useAuth } from '@/components/auth/AuthContext';
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
import { Toggle } from '../ui/toggle';

type MessageInputProps = {
	inputKey?: string;
	ref?: React.RefObject<HTMLDivElement>;
	onSendNewMessage?: (data: CreateMessageSchema) => void;
	stream: ReturnType<typeof useStream>;
};

const InputArea = ({ stream, inputKey, onSendNewMessage }: MessageInputProps) => {
	const { data: modelCatalogue } = useQuery(getModelCatalogueOpts);
	const { isSignedIn } = useAuth();
	const { readyFiles, clearFiles } = useUploaderContext();
	const [model, setModel] = useLocalStorage(`last-model-${inputKey}`, modelCatalogue?.defaultModel);
	const [content, setContent] = useLocalStorage(`last-input-${inputKey}`, '');
	const [reasoning, setReasoning] = useLocalStorage(`last-reasoning-${inputKey}`, false);
	const [webSearch, setWebSearch] = useLocalStorage(`last-web-search-${inputKey}`, false);

	const selectedModel = useMemo(() => modelCatalogue?.models.find((m) => m.id === model), [model, modelCatalogue]);

	const supportedCapabilities = useMemo(
		() => ({
			file: isSignedIn && (selectedModel?.architecture.input_modalities.includes('file') ?? false),
			image: isSignedIn && (selectedModel?.architecture.input_modalities.includes('image') ?? false),
			reasoning: selectedModel?.supported_parameters.includes('reasoning') ?? false,
			webSearch: isSignedIn && (selectedModel?.supported_parameters.includes('web_search_options') ?? false),
		}),
		[selectedModel, isSignedIn],
	);

	const handleSend = () => {
		console.log('handleSend', content);
		if (content.trim() === '') return;

		onSendNewMessage?.({
			attachments: isSignedIn
				? readyFiles.map((file) => ({ key: file.key, name: file.name, url: file.url }))
				: [],
			content,
			modelId: model,
			reasoning: supportedCapabilities.reasoning ? reasoning : undefined,
			webSearch: supportedCapabilities.webSearch ? webSearch : undefined,
		});
		setContent('');
		if (isSignedIn) {
			clearFiles();
		}
	};

	return (
		<div className="jitter-bg mx-auto mt-auto mb-2 flex w-[80%] flex-col rounded-2xl p-2 shadow-lg">
			{isSignedIn && <LocalFileDisplay />}

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
			<div className="flex items-center gap-2">
				<Combobox
					options={
						modelCatalogue?.models
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((model) => ({
								disabled: !isSignedIn && !model.free,
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

				{supportedCapabilities.file ? (
					<UploaderButton type="file" />
				) : supportedCapabilities.image ? (
					<UploaderButton type="image" />
				) : null}

				{supportedCapabilities.webSearch && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Toggle
								className="h-[32px]"
								pressed={webSearch}
								variant="default"
								onPressedChange={setWebSearch}
							>
								<span className="hidden md:block">Search</span>
								<LucideGlobe />
							</Toggle>
						</TooltipTrigger>
						<TooltipContent>{webSearch ? 'Disable' : 'Enable'} web search</TooltipContent>
					</Tooltip>
				)}

				{supportedCapabilities.reasoning && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Toggle
								className="h-[32px]"
								pressed={reasoning}
								variant="default"
								onPressedChange={setReasoning}
							>
								<span className="hidden md:block">Reasoning</span>
								<LucideBrain />
							</Toggle>
						</TooltipTrigger>
						<TooltipContent>{reasoning ? 'Disable' : 'Enable'} reasoning</TooltipContent>
					</Tooltip>
				)}

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="ml-auto"
							size="icon"
							onClick={() => {
								if (stream.isStreaming) stream.controls.cancel();
								else handleSend();
							}}
						>
							{stream.isStreaming ? <LucideSquare /> : <SendHorizontal />}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{stream.isStreaming ? 'Cancel' : 'Send message'}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};

const ModelSelectItem = ({ model, isSelected }: { model: ModelCard & { disabled?: boolean }; isSelected: boolean }) => {
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
				<TooltipContent>Supports web searching</TooltipContent>
			</Tooltip>
		),
	};

	return (
		<div key={model.id} className={`flex w-full items-center gap-2 p-2 ${model.disabled ? 'opacity-50' : ''}`}>
			<img src={logoSvg} alt={model.name} className="mr-2 h-6 w-6" />

			<p className={model.disabled ? 'text-muted-foreground' : ''}>{model.name}</p>

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
