import type { Middleware } from '.';
import { getSession } from '../../service/auth';
import { UnauthorizedError } from '../ClientError';

export const auth: Middleware = async (req, next) => {
	// get the auth token from authorization header
	try {
		const session = await getSession(req);

		if (!session) throw new UnauthorizedError('Unauthorized');

		req.session = session;

		return await next(req);
	} catch (err) {
		throw new UnauthorizedError('Unauthorized');
	}
};
