import type { BunRequest, Server } from 'bun';
import { Effect } from 'effect';
import { makeAdapterHandler } from 'uploadthing/server';
import type { FileRouter } from 'uploadthing/types';
import { getSession } from '../../service/auth';
import { f, type AdapterArgs } from '../../service/uploadthing';

const router = {
	fileUploader: f({
		pdf: { maxFileSize: '4MB', maxFileCount: 4 },
		image: { maxFileSize: '4MB', maxFileCount: 4 },
		text: { maxFileCount: 4 },
	})
		.middleware(async (opts) => {
			// TODO: JWT from header
			const session = await getSession(opts.req);

			// if (!session?.user) throw new UnauthorizedError('Unauthorized');

			return { session };
		})
		.onUploadError((opts) => {
			console.log('onUploadError', opts.error);
			opts.req;
			//   ^? BunRequest
			opts.server;
			//   ^? Server
		})
		.onUploadComplete(async (opts) => {
			console.log('onUploadComplete', opts.file);
			// await db.insert(messages).values({
			// 	content: '',
			// });
			opts.req;
			//   ^? BunRequest
			opts.server;
			//   ^? Server
		}),
	imageUploader: f({
		image: { maxFileSize: '8MB', maxFileCount: 5 },
	})
		.middleware(async (opts) => {
			// TODO: JWT from header
			const session = await getSession(opts.req);

			// if (!session?.user) throw new UnauthorizedError('Unauthorized');

			return { session };
		})
		.onUploadError((opts) => {
			console.log('onUploadError', opts.error);
			opts.req;
			//   ^? BunRequest
			opts.server;
			//   ^? Server
		})
		.onUploadComplete(async (opts) => {
			console.log('onUploadComplete', opts.file);
			// await db.insert(messages).values({
			// 	content: '',
			// });
			opts.req;
			//   ^? BunRequest
			opts.server;
			//   ^? Server
		}),
} satisfies FileRouter;

export type UploadThingRouter = typeof router;

export const requestHandler = makeAdapterHandler<[BunRequest, Server], AdapterArgs>(
	(req, server) => Effect.succeed({ req, server }),
	(req) => Effect.succeed(req),
	{
		router,
	},
);
