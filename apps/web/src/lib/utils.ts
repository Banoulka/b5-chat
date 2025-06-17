import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const copyText = async (text: string) => {
	if (navigator.clipboard) await navigator.clipboard.writeText(text);
};
