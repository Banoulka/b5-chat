import { deepEqual } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';

export const useDeepState = <T>(initialValue: T) => {
	const [value, setValue] = useState(initialValue);
	const oldValue = useRef(initialValue);

	const setDeepValue = useCallback((newValue: T) => {
		if (!deepEqual(oldValue.current, newValue)) {
			setValue(newValue);
			oldValue.current = newValue;
		}
	}, []);

	return [value, setDeepValue];
};
