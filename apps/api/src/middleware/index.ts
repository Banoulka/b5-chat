export type Middleware = (req: Bun.BunRequest<string>, next: () => Promise<Response>) => Promise<Response>;

export const applyMiddlewareToRequest = async (
	req: Bun.BunRequest<string>,
	middleware: Middleware[],
	handler: (req: Bun.BunRequest<string>) => Promise<Response>,
) => {
	let index = 0;

	const next = async (): Promise<Response> => {
		if (index >= middleware.length) return handler(req); // if no middleware, return the handler

		const currentMiddleware = middleware[index++];
		if (!currentMiddleware) return handler(req); // if no middleware, return the handler

		return currentMiddleware(req, next);
	};

	return next(); // start middleware chain
};
