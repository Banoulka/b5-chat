import { ClientResponse } from '../lib/ClientResponse';
import { auth } from '../middleware/auth';
import { route } from '../router';

export const GET = route(
	'/threads',
	async () => {
		return ClientResponse.json({
			data: [],
			meta: {
				nextCursor: null,
			},
		});
	},
	[auth],
);
