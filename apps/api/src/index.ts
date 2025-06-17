import console from 'console';
import { env } from './env';
// import './llm/agent';
import { printRoutes, router } from './lib/router/router';
import './service/db';

const routes = await router();
printRoutes(routes);

const server = Bun.serve({
	port: env.PORT,
	idleTimeout: 60, // wait a minute before timeout
	hostname: '0.0.0.0',
	development: !import.meta.env.NODE_ENV || import.meta.env.NODE_ENV === 'development',
	// websocket: {
	// 	open: (ws) => {
	// 		console.log('WebSocket opened');
	// 	},
	// 	message: (ws, message) => {
	// 		console.log('WebSocket message', message);
	// 		ws.send('Hello World');
	// 	},
	// },
	routes,
});

// test emitter
// const testId = '1234';
// const emitter = getEmitter(testId);
// const file = Bun.file(resolve(import.meta.dirname, 'test-text.txt'));

// const fileText = await file.text();
// const chunkSize = 6;

// const testReadableStream = new ReadableStream({
// 	async start(controller) {
// 		console.log('starting readable stream');
// 		const totalChunks = Math.ceil(fileText.length / chunkSize);

// 		for (let i = 0; i < totalChunks; i++) {
// 			const delay = Math.random() * 450;
// 			await new Promise((resolve) => setTimeout(resolve, delay));

// 			const chunk = fileText.slice(i * chunkSize, (i + 1) * chunkSize);
// 			controller.enqueue(chunk);

// 			console.log(`dispatching event: ${i}`, chunk);
// 			// Emit event for each token
// 			emitter.dispatchEvent(
// 				new CustomEvent('token', {
// 					detail: {
// 						token: chunk,
// 						idx: i * chunkSize,
// 						done: false,
// 					},
// 				}),
// 			);
// 		}

// 		// Emit final done event
// 		emitter.dispatchEvent(
// 			new CustomEvent('token', {
// 				detail: {
// 					token: '',
// 					idx: totalChunks,
// 					done: true,
// 				},
// 			}),
// 		);

// 		controller.close();
// 	},
// 	async cancel() {
// 		console.log('cancel');
// 	},
// });

console.log(`Server is running on port ${server.hostname}:${server.port}`);
console.log(env.DATABASE_URL);
