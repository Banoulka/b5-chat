import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../env';
import { applyMiddlewareToRequest, type Middleware } from '../../middleware';
import { logging } from '../../middleware/logging';
import { authHandler, getSession } from '../../service/auth';
import { ClientResponse } from '../ClientResponse';

console.log('Web URL', env.WEB_URL);

const paths = path.join(import.meta.dirname, '../../paths');

console.log('Paths', paths);

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type RouteModule = {
	path: string;
	middleware?: Middleware[];
	handler: (req: Bun.BunRequest<string>) => Promise<Response>;
};
type ImportedModule = {
	GET?: RouteModule;
	POST?: RouteModule;
	PUT?: RouteModule;
	DELETE?: RouteModule;
	PATCH?: RouteModule;
};

export type Routes = Record<string, Partial<Record<Method, (req: Bun.BunRequest<string>) => Promise<Response>>>>;

const globalMiddleware: Middleware[] = [logging];

export const router = async () => {
	// load all files in the paths folder
	const loadedPaths = await readdir(paths, { recursive: true });

	const routeObj: Routes = {};

	await Promise.all(
		loadedPaths.map(async (filePath) => {
			if (!filePath.endsWith('.ts')) return;

			const fullPath = path.join(paths, filePath);
			const module = (await import(fullPath)) as ImportedModule; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

			const addHandler = (method: Method, handler: RouteModule) => {
				if (!routeObj[handler.path]) routeObj[handler.path] = {};
				routeObj[handler.path]![method] = (req) =>
					applyMiddlewareToRequest(
						req,
						[...globalMiddleware, ...(handler.middleware ?? [])],
						handler.handler,
					);
			};

			if (module.GET) addHandler('GET', module.GET);
			if (module.POST) addHandler('POST', module.POST);
			if (module.PUT) addHandler('PUT', module.PUT);
			if (module.DELETE) addHandler('DELETE', module.DELETE);
			if (module.PATCH) addHandler('PATCH', module.PATCH);
		}),
	);

	const authRoutes = {
		'/auth/*': (req: Bun.BunRequest<'/auth/*'>) =>
			applyMiddlewareToRequest(req, [...globalMiddleware], async (req: Bun.BunRequest<'/auth/*'>) => {
				const response = await authHandler(req);
				response.headers.set('Access-Control-Allow-Origin', env.WEB_URL);
				response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
				response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
				response.headers.set('Access-Control-Allow-Credentials', 'true');
				return response;
			}),
	};

	const redirectHomeUrl = {
		'/': (req: Bun.BunRequest<'/'>) =>
			applyMiddlewareToRequest(req, [...globalMiddleware], async (req) => {
				const session = await getSession(req);
				console.log('test session?', session);

				return ClientResponse.redirect(env.WEB_URL);
			}),
	};

	const notFoundRoute = {
		'/**': (req: Bun.BunRequest<string>) =>
			applyMiddlewareToRequest(req, [...globalMiddleware], async () =>
				ClientResponse.json({ error: 'Not Found' }, { status: 404 }),
			),
	};

	return { ...routeObj, ...authRoutes, ...notFoundRoute, ...redirectHomeUrl } as Routes;
};

export const printRoutes = (routes: Routes) => {
	console.log('\n\x1b[36m=== Available Routes ===\x1b[0m');
	Object.entries(routes).forEach(([path, methods]) => {
		console.log(`\n\x1b[33m${path}\x1b[0m`);
		Object.keys(methods).forEach((method) => {
			console.log(`  \x1b[32m${method}\x1b[0m`);
		});
	});
	console.log('\n');
};
