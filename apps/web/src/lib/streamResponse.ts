import { env } from '@/env';

const API = env.VITE_API_URL;

type StreamResponseOpts = {
	onData: (data: string) => void;
	onError: (error: Error) => void;
	onEnd: () => void;
	abortController?: AbortController;
};

export const streamResponse = async (path: string, opts: StreamResponseOpts) => {
	try {
		const response = await fetch(`${API}${path}`, {
			headers: {
				Accept: 'text/event-stream',
			},
			signal: opts.abortController?.signal,
		});

		const reader = response.body?.getReader();

		if (!reader) {
			throw new Error('Failed to get reader');
		}

		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const text = decoder.decode(value, { stream: true });
			opts.onData(text);
		}

		opts.onEnd();
	} catch (err) {
		opts.onError(err as Error);
	}
};
