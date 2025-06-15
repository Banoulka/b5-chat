import { getSession } from '../../service/auth';
import { UnauthorizedError } from '../ClientError';
import type { Middleware } from './core';

export const auth: Middleware = async (req, next) => {
	const session = await getSession(req);

	if (!session) throw new UnauthorizedError('Unauthorized');

	req.session = session;

	return await next(req);
};
