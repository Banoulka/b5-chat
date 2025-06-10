import type { Session } from '@b5-chat/common';

declare global {
	namespace Bun {
		interface BunRequest<Path extends string = string> {
			session?: Session;
		}
	}
}

export {};
