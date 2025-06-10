import type { Middleware } from '.';
import { ClientResponse } from '../lib/ClientResponse';
import { getSession } from '../service/auth';

export const auth: Middleware = async (req, next) => {
	// get the auth token from authorization header
	try {
		const session = await getSession(req);

		if (!session) return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });

		req.session = session;

		return await next(req);
	} catch (err) {
		return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
};
