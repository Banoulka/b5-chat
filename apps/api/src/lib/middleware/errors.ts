import type { Middleware } from '.';
import { ClientError } from '../ClientError';
import { ClientResponse } from '../ClientResponse';

export const errorHandler: Middleware = async (c, next) => {
	try {
		return await next(c);
	} catch (error) {
		if (error instanceof ClientError) {
			return ClientResponse.json({
				message: error.message,
				status: error.status,
			});
		}

		console.error(error);
		return ClientResponse.json({
			message: 'Internal server error',
			status: 500,
		});
	}
};
