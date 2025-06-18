import { ClientResponse } from '../lib/ClientResponse';
import { fetchCatalogue } from '../lib/llm/catalogue';
import { defaultFreeModel, defaultModel } from '../lib/llm/models';
import { route } from '../lib/router/route';
import { getSession } from '../service/auth';

// TODO: User preferences?
export const GET = route('/agents', async (req) => {
	const session = await getSession(req);
	const catalogue = await fetchCatalogue();

	// TODO: Add user preferences?
	return ClientResponse.json({
		models: catalogue,
		defaultModel: session?.user ? defaultModel : defaultFreeModel,
	});
});
