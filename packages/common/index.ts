export type Session = {
	user: {
		id: string;
		email: string;
		name: string;
		image: string | null;
	};
};

export type API_Agent = {
	id: string;
	name: string;
	description: string;
	features: string[];
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
		nextCursor: string | null;
		prevCursor: string | null;
		total: number;
	};
};

export type API_ThreadMessagesResponse = {
	data: APIThreadMessage[];
	meta: {
		prevCursor: string | null;
		nextCursor: string | null;
	};
};
