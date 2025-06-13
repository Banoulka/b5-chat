import { useMemo, useState } from 'react';

import { env } from '@/env';

const useStreamVersion = 1;

export const useStream = (url: string, id: string) => {
	const key = useMemo(() => `stream-${useStreamVersion}:${id}`, [id, useStreamVersion]);

	const [tokens, setTokens] = useState<string>(() => localStorage.getItem(key) ?? '');
	const [eventSource, setEventSource] = useState<EventSource | null>(null);

	const controls = {
		canStop: eventSource !== null,
		start: () => {
			if (eventSource) return;

			const newSource = new EventSource(`${env.VITE_API_URL}${url}?from=${tokens.length}`);
			setEventSource(newSource);
			newSource.onmessage = (e) =>
				setTokens((prev) => {
					console.log(`got message "${e.data}"`, e.data.length);
					const next = prev + e.data;
					localStorage.setItem(key, next);
					return next;
				});
		},
		stop: () => {
			eventSource?.close();
			setEventSource(null);
		},
	};

	// Start on mount?
	// useEffect(() => {
	// 	controls.start();
	// 	return () => controls.stop();
	// }, [id, url]);

	return { controls, tokens };
};
