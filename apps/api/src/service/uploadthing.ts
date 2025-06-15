import type { BunRequest, Server } from 'bun';
import { createBuilder } from 'uploadthing/server';

export type AdapterArgs = {
	req: BunRequest;
	server: Server;
};

export const f = createBuilder<AdapterArgs>();
