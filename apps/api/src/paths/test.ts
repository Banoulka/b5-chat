import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../router';

export const GET = route('/test/:id', async (req) => {
	return ClientResponse.json({
		message: 'Hello World test!',
		id: req.params.id,
	});
});
