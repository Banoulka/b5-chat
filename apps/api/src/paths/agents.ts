import { ClientResponse } from '../lib/ClientResponse';
import { agentsData } from '../llm/config';
import { route } from '../router';

export const GET = route('/agents', async () => {
	// TODO: Add user preferences?
	return ClientResponse.json(agentsData);
});
