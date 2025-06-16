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
export type Capability = 'tools' | 'web' | 'image' | 'file';

export type ModelModality = 'text->text' | 'text+image->text';

export interface ModelCard {
	id: string;
	canonical_slug: string;
	name: string;
	context_length: number;
	supported_parameters: string[];
	architecture: {
		modality: ModelModality;
	};
}

export type API_ModelCatalogueResponse = {
	models: ModelCard[];
	defaultModel: string;
};

export const END_OF_TEXT_TOKEN = '<|endoftext|>';
