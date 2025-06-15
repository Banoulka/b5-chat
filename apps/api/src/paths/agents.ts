import { ClientResponse } from '../lib/ClientResponse';
import { fetchCatalogue } from '../lib/llm/catalogue';
import { route } from '../lib/router/route';

// TODO: User preferences?
const defaultModels = [];

export const GET = route('/agents', async () => {
	const catalogue = await fetchCatalogue();

	console.log(
		'models',
		catalogue.map((c) => c.name),
	);

	// TODO: Add user preferences?
	return ClientResponse.json(catalogue);
});
