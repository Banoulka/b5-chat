import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../lib/router/route';
import { auth } from '../middleware/auth';
import { getSession } from '../service/auth';

export const GET = route(
	'/me',
	async (req) => {
		const session = await getSession(req);

		return ClientResponse.json(session);
	},
	[auth],
);
