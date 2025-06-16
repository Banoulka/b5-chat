import type { BunRequest, Server } from 'bun';
import { createBuilder, UTApi } from 'uploadthing/server';

export type AdapterArgs = {
	req: BunRequest;
	server: Server;
};

export const f = createBuilder<AdapterArgs>();

export const utApi = new UTApi();
