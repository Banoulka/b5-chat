import type { Middleware } from '../../middleware';

export const route = <TPath extends string>(
	path: TPath,
	handler: (req: Bun.BunRequest<TPath>) => Promise<Response>,
	middleware?: Middleware[],
) => {
	return {
		path,
		handler,
		middleware,
	};
};
