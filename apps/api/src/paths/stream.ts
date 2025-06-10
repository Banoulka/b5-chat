import { resolve } from 'path';
import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../router';

const file = Bun.file(resolve(import.meta.dirname, 'test-text.txt'));

export const GET = route('/stream', async (req) => {
	const fileText = await file.text();

	const testReadableStream = new ReadableStream({
		async start(controller) {
			for (let i = 0; i < fileText.length; i++) {
				const delay = Math.random() * 100;
				await new Promise((resolve) => setTimeout(resolve, delay));
				controller.enqueue(fileText[i]);
			}
			controller.close();
		},
	});

	return new ClientResponse(testReadableStream, {
		headers: {
			'Content-Type': 'text/plain',
			'Transfer-Encoding': 'chunked',
		},
	});
});
