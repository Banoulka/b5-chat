import console from 'console';
import { resolve } from 'path';
import { env } from './env';
import { getEmitter } from './lib/stream';
import './llm/agent';
import { testId } from './paths/stream';
import { printRoutes, router } from './router';
import './service/db';

const routes = await router();
printRoutes(routes);

const server = Bun.serve({
	port: env.PORT,
	hostname: '0.0.0.0',
	development: true,
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
const emitter = getEmitter(testId);
const file = Bun.file(resolve(import.meta.dirname, 'paths/test-text.txt'));

const fileText = await file.text();
const chunkSize = 6;

const testReadableStream = new ReadableStream({
	async start(controller) {
		console.log('starting readable stream');
		const totalChunks = Math.ceil(fileText.length / chunkSize);

		for (let i = 0; i < totalChunks; i++) {
			const delay = Math.random() * 1000;
			await new Promise((resolve) => setTimeout(resolve, delay));

			const chunk = fileText.slice(i * chunkSize, (i + 1) * chunkSize);
			controller.enqueue(chunk);

			console.log(`dispatching event: ${i}`, chunk);
			// Emit event for each token
			emitter.dispatchEvent(
				new CustomEvent('token', {
					detail: {
						token: chunk,
						idx: i * chunkSize,
						done: false,
					},
				}),
			);
		}

		// Emit final done event
		emitter.dispatchEvent(
			new CustomEvent('token', {
				detail: {
					token: '',
					idx: totalChunks,
					done: true,
				},
			}),
		);

		controller.close();
	},
	async cancel() {
		console.log('cancel');
	},
});

console.log(`Server is running on port ${server.hostname}:${server.port}`);
