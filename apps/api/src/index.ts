import { env } from './env';
import { printRoutes, router } from './router';
import './service/db';

const routes = await router();
printRoutes(routes);

const server = Bun.serve({
	port: env.PORT,
	hostname: '0.0.0.0',
	development: true,
	websocket: {
		open: (ws) => {
			console.log('WebSocket opened');
		},
		message: (ws, message) => {
			console.log('WebSocket message', message);
			ws.send('Hello World');
		},
	},
	routes,
});

console.log(`Server is running on port ${server.hostname}:${server.port}`);
