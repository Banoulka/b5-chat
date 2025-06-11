import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../lib/router/route';
import { auth } from '../middleware/auth';

export const GET = route('/protected', async () => ClientResponse.json({ message: 'This is a protected route' }), [
	auth,
]);
