import { type RefObject, useLayoutEffect, useState } from 'react';

interface Options {
	defaultSize?: Size;
}

interface Size {
	width: number;
	height: number;
}

export function useSize(ref: RefObject<HTMLDivElement | null>, options: Options = {}): Size {
	const { defaultSize = { height: 0, width: 0 } } = options;

	const [size, setSize] = useState<Size>(() => {
		const el = ref.current;
		if (el) return { height: el.offsetHeight, width: el.offsetWidth };
		return defaultSize;
	});

	useLayoutEffect(() => {
		console.log('useLayoutEffect useSize', ref.current);
		const el = ref.current;
		if (!el) return;

		const update = () => {
			setSize({ height: el.offsetHeight, width: el.offsetWidth });
		};

		update();

		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(el);

		return () => resizeObserver.disconnect();
	}, [ref, ref?.current]);

	return size;
}
