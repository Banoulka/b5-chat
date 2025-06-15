import { ClientResponse } from '../lib/ClientResponse';
import { fetchCatalogue } from '../lib/llm/catalogue';
import { defaultModel } from '../lib/llm/models';
import { route } from '../lib/router/route';

// TODO: User preferences?
export const GET = route('/agents', async () => {
	const catalogue = await fetchCatalogue();

	console.log(
		'models',
		catalogue.map((c) => c.name),
	);

	// TODO: Add user preferences?
	return ClientResponse.json({
		models: catalogue,
		defaultModel: defaultModel,
	});
});
