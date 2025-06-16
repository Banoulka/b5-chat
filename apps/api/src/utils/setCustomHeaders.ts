import { env } from '../env';

export const setCustomHeaders = (headers: Headers) => {
	headers.set('Access-Control-Allow-Origin', env.WEB_URL);
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
	headers.set(
		'Access-Control-Allow-Headers',
		'*, x-uploadthing-version, x-uploadthing-signature, x-uploadthing-package, content-type, authorization',
	);
	headers.set('Access-Control-Allow-Credentials', 'true');
};
