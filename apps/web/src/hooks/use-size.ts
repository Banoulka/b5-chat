import { type RefObject, useCallback, useRef, useState } from 'react';

interface Options {
	defaultSize?: Size;
}

interface Size {
	width: number;
	height: number;
}

export function useSize(ref: RefObject<HTMLDivElement | null>, options: Options = {}) {
	const { defaultSize = { height: 0, width: 0 } } = options;

	const resizeRef = useRef<ResizeObserver | null>(null);

	const [size, setSize] = useState<Size>(() => {
		const el = ref.current;
		if (el) return { height: el.offsetHeight, width: el.offsetWidth };
		return defaultSize;
	});

	const sizeRef = useCallback((node: HTMLDivElement) => {
		if (!node) return;

		if (resizeRef.current) resizeRef.current.disconnect();

		const update = () => {
			setSize({ height: node.offsetHeight, width: node.offsetWidth });
		};

		update();

		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(node);
		resizeRef.current = resizeObserver;
	}, []);

	return { size, sizeRef };
}
