import { END_OF_TEXT_TOKEN } from '@b5-chat/common';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { env } from '@/env';

const useStreamVersion = 1;

type UseStreamOptions = {
	url: string;
	id: string;
	onComplete?: () => void;
};

export const useStream = ({ url, id, onComplete }: UseStreamOptions) => {
	const key = useMemo(() => `stream-${useStreamVersion}:${id}`, [id, useStreamVersion]);

	const [tokens, setTokens] = useState<string>('');
	const eventSourceRef = useRef<EventSource | null>(null);
	const [isStreaming, setIsStreaming] = useState(false);

	// On key changes we need to:
	// - stop any existing event source
	// - swap out local tokens
	useEffect(() => {
		return () => {
			stop();
			setTokens('');
		};
	}, [key]);

	const stop = useCallback(() => {
		console.log('use-stream: stop');
		eventSourceRef.current?.close();
		eventSourceRef.current = null;
		setIsStreaming(false);
		setTokens('');
	}, [key]);

	const cancel = useCallback(async () => {
		console.log('use-stream: cancel');

		stop();

		// fire network request to tell the server to stop streaming the response.
		await fetch(`${env.VITE_API_URL}${url}`, {
			method: 'DELETE',
		});
	}, [key]);

	const start = useCallback(() => {
		console.log('use-stream: start', eventSourceRef.current, tokens.length);
		if (eventSourceRef.current) return;

		setIsStreaming(true);
		const newSource = new EventSource(`${env.VITE_API_URL}${url}?from=${tokens.length}`);
		eventSourceRef.current = newSource;
		newSource.onmessage = (e) =>
			setTokens((prev) => {
				// console.log('got stuff', e);
				// console.log(`got message "${e.data}"`, e.data.length);

				console.log('end of text?', e.data === END_OF_TEXT_TOKEN || e.data.includes(END_OF_TEXT_TOKEN));
				if (e.data === END_OF_TEXT_TOKEN || e.data.includes(END_OF_TEXT_TOKEN)) {
					stop();
					localStorage.removeItem(key); // we are done we no more need
					onComplete?.();
					return prev;
				}

				const next = prev + e.data;
				localStorage.setItem(key, next);
				return next;
			});
	}, [url, tokens.length, stop]);

	const tryResume = useCallback(async () => {
		if (eventSourceRef.current) return;

		const headRequest = await fetch(`${env.VITE_API_URL}${url}`, {
			method: 'HEAD',
		}).catch((e) => {
			console.log('Error trying to resume stream', e);
			return null;
		});

		if (headRequest?.status === 200) {
			// try load previous tokens and start
			const localTokens = localStorage.getItem(key);
			if (localTokens) setTokens(localTokens);
			start();
		} else {
			console.log('Session not found, must be ended');
			localStorage.removeItem(key); // we are done so no more remove
		}
	}, [url, tokens.length, stop]);

	const canStop = eventSourceRef.current !== null;

	// Auto-resume when the key (thread id) changes or on mount
	useEffect(() => {
		tryResume();
	}, [key]);

	useEffect(() => {
		return () => {
			console.log('cleanup stream');
		};
	}, [id]);

	return { controls: { canStop, cancel, start, tryResume }, isStreaming, tokens };
};
