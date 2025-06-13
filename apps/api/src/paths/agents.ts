import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../lib/router/route';
import { fetchCatalogue } from '../llm/catalogue';

export const GET = route('/agents', async () => {
	const catalogue = await fetchCatalogue();
	// TODO: Add user preferences?
	return ClientResponse.json(catalogue);
});
