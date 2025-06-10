import type { Middleware } from '.';
import { ClientResponse } from '../lib/ClientResponse';

export const auth: Middleware = async (req, next) => {
	// get the auth token from authorization header
	const authHeader = req.headers.get('Authorization');

	if (!authHeader) {
		return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const response = await next();
	return response;
};
