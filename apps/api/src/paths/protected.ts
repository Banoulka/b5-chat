import { ClientResponse } from '../lib/ClientResponse';
import { auth } from '../middleware/auth';
import { route } from '../router';

export const GET = route('/protected', async () => ClientResponse.json({ message: 'This is a protected route' }), [
	auth,
]);
