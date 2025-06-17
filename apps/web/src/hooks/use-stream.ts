import { END_OF_TEXT_TOKEN } from '@b5-chat/common';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { env } from '@/env';

const useStreamVersion = 1;

type UseStreamOptions = {
	url: string;
	id?: string;
	onComplete?: () => void;
};

export const useStream = ({ url, id, onComplete }: UseStreamOptions) => {
	const safeId = id ?? 'pending';
	const key = useMemo(() => `stream-${useStreamVersion}:${safeId}`, [safeId]);

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

	const handleToken = useCallback(
		(e: MessageEvent) =>
			setTokens((prev) => {
				console.log('got stuff', e);
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
			}),
		[],
	);

	const stop = useCallback(() => {
		console.log('use-stream: stop');

		if (eventSourceRef.current) {
			eventSourceRef.current.removeEventListener('token', handleToken);
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		setIsStreaming(false);
		setTokens('');
	}, [key]);

	const cancel = useCallback(async () => {
		if (!url || !id) return;
		console.log('use-stream: cancel');

		stop();

		// fire network request to tell the server to stop streaming the response.
		await fetch(`${env.VITE_API_URL}${url}`, {
			method: 'DELETE',
		});
	}, [key, id, url]);

	const start = useCallback(() => {
		if (!url || !id) return; // nothing to stream yet
		if (eventSourceRef.current) return;
		console.log('use-stream: start', eventSourceRef.current, tokens.length);

		setIsStreaming(true);
		const src = new EventSource(`${env.VITE_API_URL}${url}?from=${tokens.length}`);
		eventSourceRef.current = src;
		src.addEventListener('token', handleToken);
	}, [url, id, tokens.length, handleToken]);

	const tryResume = useCallback(async () => {
		if (!url || !id || eventSourceRef.current) return;
		console.log('use-stream: tryResume', url, id, eventSourceRef.current);

		const head = await fetch(`${env.VITE_API_URL}${url}`, { method: 'HEAD' }).catch(() => null);
		if (head?.status === 200) {
			const localTokens = localStorage.getItem(key);
			if (localTokens) setTokens(localTokens);
			start();
		} else {
			localStorage.removeItem(key); // session is gone
		}
	}, [url, tokens.length, stop]);

	const canStop = eventSourceRef.current !== null;

	// Auto-resume when the key (thread id) changes or on mount
	useEffect(() => {
		tryResume();
		return () => stop();
	}, [key]);

	useEffect(() => {
		return () => {
			console.log('cleanup stream');
		};
	}, [id]);

	return { controls: { canStop, cancel, start, tryResume }, isStreaming, tokens };
};
