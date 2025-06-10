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

export type API_ThreadResponse = {
	data: {
		id: string;
		name: string;
		createdAt: string;
		updatedAt: string;
	}[];
	meta: {
		nextCursor: string | null;
		prevCursor: string | null;
		total: number;
	};
};
