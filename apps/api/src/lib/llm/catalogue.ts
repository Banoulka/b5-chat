import type { ModelCard } from '@b5-chat/common';
import { defaultModels } from './models';

export async function fetchCatalogue(): Promise<ModelCard[]> {
	return defaultModels satisfies ModelCard[];
}

export async function searchCatalogue(query: string): Promise<ModelCard[]> {
	return defaultModels.filter((model) => model.name.toLowerCase().includes(query.toLowerCase()));
}
