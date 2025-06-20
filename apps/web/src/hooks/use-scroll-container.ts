import { useEffect, useRef } from 'react';

export interface UseScrollContainerProps {
	threshold?: number;
	isLoading?: boolean;
	anchorBottomDeps?: unknown[];
	onReachTop?: () => void;
	onReachBottom?: () => void;
	onScroll?: (top: number, height: number) => void;
}

export const useScrollContainer = ({
	threshold = 70,
	isLoading = false,
	anchorBottomDeps = [],
	onReachTop,
	onReachBottom,
	onScroll,
}: UseScrollContainerProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const isAtBottomRef = useRef(true);
	const isAtTopRef = useRef(true);

	const scrollToBottom = () => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	};

	useEffect(() => {
		// keep anchored to bottom while streaming / when deps change
		if (isLoading) return;
		if (isAtBottomRef.current) scrollToBottom();
	}, [isLoading, containerRef.current?.scrollHeight, ...anchorBottomDeps]);

	// scroll to bottom on load
	useEffect(() => {
		if (isLoading) return;
		scrollToBottom();
	}, [isLoading]);

	// scroll listener
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const handleScroll = (e: Event) => {
			const target = e.target as HTMLDivElement;
			const scrollTop = target.scrollTop;

			const nearTop = scrollTop < threshold;
			if (nearTop) onReachTop?.();

			const nearBottom = scrollTop + threshold + target.clientHeight >= target.scrollHeight;
			if (nearBottom) onReachBottom?.();

			onScroll?.(scrollTop, target.scrollHeight);

			// track bottom status
			isAtBottomRef.current = nearBottom;
			isAtTopRef.current = nearTop;
		};

		el.addEventListener('scroll', handleScroll);
		return () => el.removeEventListener('scroll', handleScroll);
	}, [threshold, onReachTop, onReachBottom]);

	return { containerRef, isAtBottomRef, isAtTopRef, scrollToBottom } as const;
};
