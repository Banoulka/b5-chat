import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ClientResponse } from './lib/ClientResponse';

const paths = path.join(import.meta.dirname, 'paths');

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type RouteModule = {
	path: string;
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

export const router = async () => {
	// load all files in the paths folder
	const loadedPaths = await readdir(paths, { recursive: true });

	const routeObj: Routes = {};

	await Promise.all(
		loadedPaths.map(async (filePath) => {
			const fullPath = path.join(paths, filePath);
			const module = (await import(fullPath)) as ImportedModule; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

			const addHandler = (method: Method, handler: RouteModule) => {
				if (!routeObj[handler.path]) routeObj[handler.path] = {};
				routeObj[handler.path]![method] = handler.handler;
			};

			if (module.GET) addHandler('GET', module.GET);
			if (module.POST) addHandler('POST', module.POST);
			if (module.PUT) addHandler('PUT', module.PUT);
			if (module.DELETE) addHandler('DELETE', module.DELETE);
			if (module.PATCH) addHandler('PATCH', module.PATCH);
		}),
	);

	const notFoundRoute = {
		'/**': () => ClientResponse.json({ error: 'Not Found' }, { status: 404 }),
	};

	return { ...routeObj, ...notFoundRoute } as Routes;
};

export const route = <TPath extends string>(
	path: TPath,
	handler: (req: Bun.BunRequest<TPath>) => Promise<Response>,
) => {
	return {
		path,
		handler,
	};
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
