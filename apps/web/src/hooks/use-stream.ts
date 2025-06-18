import { END_OF_TEXT_TOKEN } from '@b5-chat/common';
import { useEffect, useMemo, useRef, useState } from 'react';

import { env } from '@/env';

const useStreamVersion = 1;

type UseStreamOptions = {
	url: string;
	id?: string;
	onComplete?: (tokens: string) => void;
	onStream?: (tokens: string) => void;
};

export const useStream = ({ url, id, onComplete, onStream }: UseStreamOptions) => {
	const safeId = id ?? 'pending';
	const key = useMemo(() => `stream-${useStreamVersion}:${safeId}`, [safeId]);

	const [tokens, setTokens] = useState<string>('');
	const eventSourceRef = useRef<EventSource | null>(null);
	const [isStreaming, setIsStreaming] = useState(false);

	const stop = () => {
		console.log('use-stream: stop for key', key);

		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		setIsStreaming(false);
		setTokens('');
	};

	const handleToken = (e: MessageEvent) =>
		setTokens((prev) => {
			if (e.data === END_OF_TEXT_TOKEN || e.data.includes(END_OF_TEXT_TOKEN)) {
				stop();
				localStorage.removeItem(key); // we are done we no more need
				onComplete?.(prev);
				return prev;
			}

			const next = prev + e.data;
			localStorage.setItem(key, next);
			onStream?.(next);
			return next;
		});

	const cancel = async () => {
		if (!url || !id) return;
		console.log('use-stream: cancel');

		stop();

		// fire network request to tell the server to stop streaming the response.
		await fetch(`${env.VITE_API_URL}${url}`, {
			method: 'DELETE',
		});

		localStorage.removeItem(key); // remove the key from local storage since we dont want to pick it back up
	};

	const start = () => {
		if (!url || !id) return; // nothing to stream yet
		if (eventSourceRef.current) return;
		console.log('use-stream: start', tokens.length);

		setIsStreaming(true);
		const src = new EventSource(`${env.VITE_API_URL}${url}?from=${tokens.length}`);
		eventSourceRef.current = src;
		src.addEventListener('token', handleToken);
	};

	const tryResume = async () => {
		if (!url || !id || eventSourceRef.current) return;
		console.log('use-stream: tryResume', url);

		const head = await fetch(`${env.VITE_API_URL}${url}`, { method: 'HEAD' }).catch(() => null);
		if (head?.status === 200) {
			const localTokens = localStorage.getItem(key);
			if (localTokens) setTokens(localTokens);
			start();
		} else {
			localStorage.removeItem(key); // session is gone
		}
	};

	// Auto-resume when the key (thread id) changes or on mount
	useEffect(() => {
		console.log('use-stream: useEffect key change', key, url);
		tryResume();
		return () => stop();
	}, [key, url]);

	return { controls: { cancel, start, tryResume }, isStreaming, tokens };
};
