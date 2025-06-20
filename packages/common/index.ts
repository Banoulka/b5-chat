export type Session = {
	user: {
		id: string;
		email: string;
		name: string;
		image: string | null;
	};
};

export type APIThreadMessage = {
	id: string;
	type: 'agent' | 'user';
	model: string | null;
	content: string;
	createdAt: string;
	updatedAt: string;
	attachments: {
		key: string;
		name: string;
		url: string;
	}[];
};

export type APIThread = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type API_ThreadsResponse = {
	data: APIThread[];
	meta: {
		nextCursor: number | null;
		prevCursor: number | null;
		total: number;
	};
};

export type API_ThreadMessagesResponse = {
	data: APIThreadMessage[];
	meta: {
		// prevCursor: number | null;
		nextCursor: number | null;
	};
};

// LLM
export type Capability = 'tools' | 'web_search_options' | 'reasoning' | 'include_reasoning';

export type Modality = 'text' | 'image' | 'file';

export interface ModelCard {
	id: string;
	description: string;
	canonical_slug: string;
	name: string;
	context_length: number;
	supported_parameters: Capability[];
	free: boolean;
	architecture: {
		modality: string;
		input_modalities: Modality[];
		output_modalities: Modality[];
	};
}

export type API_ModelCatalogueResponse = {
	models: ModelCard[];
	defaultModel: string;
};

export const eventTypes = {
	on_chat_model_stream: 'on_chat_model_stream',
	done: 'done',
} as const;

export const END_OF_TEXT_TOKEN = '<|endoftext|>';
