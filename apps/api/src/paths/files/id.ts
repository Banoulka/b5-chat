import { NotFoundError } from '../../lib/ClientError';
import { ClientResponse } from '../../lib/ClientResponse';
import { auth } from '../../lib/middleware/auth';
import { route } from '../../lib/router/route';
import { utApi } from '../../service/uploadthing';

export const DELETE = route(
	'/files/:key',
	async (req) => {
		const { key } = req.params;
		console.log('delete file', key);

		const file = await utApi.deleteFiles([key]);

		if (!file) throw new NotFoundError('File not found');

		return ClientResponse.json({ success: true });
	},
	[auth],
);

export const OPTIONS = route('/files/:key', async () => new Response(null, { status: 200 }));
