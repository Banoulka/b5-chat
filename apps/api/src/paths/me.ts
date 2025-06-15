import { ClientResponse } from '../lib/ClientResponse';
import { auth } from '../lib/middleware/auth';
import { route } from '../lib/router/route';
import { getSession } from '../service/auth';

export const GET = route(
	'/me',
	async (req) => {
		const session = await getSession(req);

		return ClientResponse.json(session);
	},
	[auth],
);
