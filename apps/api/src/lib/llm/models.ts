import type { ModelCard } from '@b5-chat/common';

export const defaultModel = 'openai/gpt-4.1';

export const defaultModels = [
	{
		id: 'openai/o3-pro',
		canonical_slug: 'openai/o3-pro-2025-06-10',
		name: 'OpenAI: o3 Pro',
		context_length: 200000,
		supported_parameters: [],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['text', 'file', 'image'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'google/gemini-2.5-pro-preview',
		canonical_slug: 'google/gemini-2.5-pro-preview-06-05',
		name: 'Google: Gemini 2.5 Pro Preview',
		context_length: 1048576,
		supported_parameters: ['reasoning', 'include_reasoning'],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['file', 'image', 'text'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'anthropic/claude-opus-4',
		canonical_slug: 'anthropic/claude-4-opus-20250522',
		name: 'Anthropic: Claude Opus 4',
		context_length: 200000,
		supported_parameters: ['reasoning', 'include_reasoning'],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['image', 'text'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'google/gemma-3n-e4b-it:free',
		canonical_slug: 'google/gemma-3n-e4b-it',
		name: 'Google: Gemma 3n 4B (free)',
		context_length: 8192,
		supported_parameters: [],
		architecture: {
			modality: 'text->text',
			input_modalities: ['text'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'meta-llama/llama-3.3-8b-instruct:free',
		canonical_slug: 'meta-llama/llama-3.3-8b-instruct',
		name: 'Meta: Llama 3.3 8B Instruct (free)',
		context_length: 128000,
		supported_parameters: [],
		architecture: {
			modality: 'text->text',
			input_modalities: ['text'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'openai/gpt-4.1',
		canonical_slug: 'openai/gpt-4.1-2025-04-14',
		name: 'OpenAI: GPT-4.1',
		context_length: 1047576,
		supported_parameters: ['web_search_options'],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['image', 'text', 'file'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'meta-llama/llama-4-maverick',
		canonical_slug: 'meta-llama/llama-4-maverick-17b-128e-instruct',
		name: 'Meta: Llama 4 Maverick',
		context_length: 1048576,
		supported_parameters: [],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['text', 'image'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'deepseek/deepseek-v3-base:free',
		canonical_slug: 'deepseek/deepseek-v3-base',
		name: 'DeepSeek: DeepSeek V3 Base (free)',
		context_length: 163840,
		supported_parameters: [],
		architecture: {
			modality: 'text->text',
			input_modalities: ['text'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'anthropic/claude-3.7-sonnet',
		canonical_slug: 'anthropic/claude-3-7-sonnet-20250219',
		name: 'Anthropic: Claude 3.7 Sonnet',
		context_length: 200000,
		supported_parameters: ['reasoning', 'include_reasoning'],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['text', 'image'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'google/gemini-2.0-flash-001',
		canonical_slug: 'google/gemini-2.0-flash-001',
		name: 'Google: Gemini 2.0 Flash',
		context_length: 1048576,
		supported_parameters: [],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['text', 'image', 'file'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'openai/gpt-4o',
		canonical_slug: 'openai/gpt-4o',
		name: 'OpenAI: GPT-4o',
		context_length: 128000,
		supported_parameters: ['web_search_options'],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['text', 'image', 'file'],
			output_modalities: ['text'],
		},
	},
	{
		id: 'google/gemini-pro-1.5',
		canonical_slug: 'google/gemini-pro-1.5',
		name: 'Google: Gemini 1.5 Pro',
		context_length: 2000000,
		supported_parameters: [],
		architecture: {
			modality: 'text+image->text',
			input_modalities: ['text', 'image'],
			output_modalities: ['text'],
		},
	},
] as const satisfies ModelCard[];

export type ModelId = (typeof defaultModels)[number]['id'];

const defaultModelIds = defaultModels.map((m) => m.id);

export const isSupportedModel = (model: unknown): model is ModelId => defaultModelIds.includes(model as any);

export const isAttachmentSupported = (modelId: ModelId) => {
	const model = defaultModels.find((m) => m.id === modelId);
	if (!model) return false;

	return model.architecture.modality === 'text+image->text';
};
