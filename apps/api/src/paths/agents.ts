import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../lib/router/route';
import { agentsData } from '../llm/config';

export const GET = route('/agents', async () => {
	// TODO: Add user preferences?
	return ClientResponse.json(agentsData);
});
