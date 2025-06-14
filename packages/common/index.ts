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
	content: string;
	createdAt: string;
	updatedAt: string;
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
export type ModelCard = { id: string; name: string; desc: string; supported: Capability[] };

export const END_OF_TEXT_TOKEN = '<|endoftext|>';
