export function mergeRefs<T>(
	refs: Array<React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null>,
): React.RefCallback<T> {
	return (value) => {
		for (const ref of refs) {
			if (typeof ref === 'function') {
				ref(value);
			} else if (ref) {
				(ref as React.MutableRefObject<T | null>).current = value;
			}
		}
	};
}
