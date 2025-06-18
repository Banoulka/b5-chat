import { useEffect, useRef, useState } from 'react';

export function useScrollToBottom() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showScrollToBottom, setShowScrollToBottom] = useState(false);

	const scrollToBottom = () => {
		const el = containerRef.current;
		if (el) {
			el.scrollTop = el.scrollHeight;
		}
	};

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const onScroll = () => {
			const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
			setShowScrollToBottom(!atBottom);
		};

		el.addEventListener('scroll', onScroll);
		return () => el.removeEventListener('scroll', onScroll);
	}, []);

	return { containerRef, scrollToBottom, showScrollToBottom };
}
