import type { Server } from 'bun';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../env';
import { requestHandler } from '../../paths/api/uploadthing';
import { authHandler, getSession } from '../../service/auth';
import { setCustomHeaders } from '../../utils/setCustomHeaders';
import { NotFoundError } from '../ClientError';
import { ClientResponse } from '../ClientResponse';
import { applyMiddlewareToRequest, type Middleware } from '../middleware/core';
import { errorHandler } from '../middleware/errors';
import { logging } from '../middleware/logging';

console.log('Web URL', env.WEB_URL);

const paths = path.join(import.meta.dirname, '../../paths');

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

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
	HEAD?: RouteModule;
	OPTIONS?: RouteModule;
};

export type Routes = Record<string, Partial<Record<Method, (req: Bun.BunRequest<string>) => Promise<Response>>>>;

const globalMiddleware: Middleware[] = [logging, errorHandler];

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
			if (module.HEAD) addHandler('HEAD', module.HEAD);
			if (module.OPTIONS) addHandler('OPTIONS', module.OPTIONS);
		}),
	);

	const authRoutes = {
		'/auth/*': (req: Bun.BunRequest<'/auth/*'>) =>
			applyMiddlewareToRequest(req, [...globalMiddleware], async (req: Bun.BunRequest<'/auth/*'>) => {
				const response = await authHandler(req);
				setCustomHeaders(response.headers);
				return response;
			}),
	};

	const uploadThingRoutes = {
		'/api/uploadthing': (req: Bun.BunRequest<'/'>, server: Server) =>
			applyMiddlewareToRequest(req, [...globalMiddleware], async (req) => {
				console.log(`UPLOADTHING: ${req.method} ${req.url}`);

				if (req.method === 'OPTIONS') {
					const response = new Response(null, { status: 200 });
					setCustomHeaders(response.headers);
					return response;
				}

				const response = await requestHandler(req, server);
				setCustomHeaders(response.headers);
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
			applyMiddlewareToRequest(req, [...globalMiddleware], async () => {
				console.log(`NOT FOUND: ${req.method} ${req.url}`);
				throw new NotFoundError('Not Found');
			}),
	};

	return { ...routeObj, ...authRoutes, ...notFoundRoute, ...redirectHomeUrl, ...uploadThingRoutes } as Routes;
};

export const printRoutes = (routes: Routes) => {
	console.log('\n\x1b[36m=== Available Routes ===\x1b[0m');
	Object.entries(routes).forEach(([path, methods]) => {
		if (!Object.keys(methods).length) {
			console.log(`  \x1b[32mALL\x1b[0m\t\x1b[33m${path}\x1b[0m`);
			return;
		}

		Object.keys(methods).forEach((method) => {
			console.log(`  \x1b[32m${method}\x1b[0m\t\x1b[33m${path}\x1b[0m`);
		});
	});
};
