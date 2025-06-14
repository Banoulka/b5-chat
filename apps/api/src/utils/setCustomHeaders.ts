import { env } from '../env';

export const setCustomHeaders = (headers: Headers) => {
	headers.set('Access-Control-Allow-Origin', env.WEB_URL);
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	headers.set('Access-Control-Allow-Credentials', 'true');
};
