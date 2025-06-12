import type { Capability, ModelCard } from '@b5-chat/common';

export async function fetchCatalogue(): Promise<ModelCard[]> {
	const res = await fetch('https://openrouter.ai/api/v1/models');
	const { data } = await res.json();

	console.log('catalogue', data);
	return data.map((m: any) => ({
		id: m.id,
		name: m.name,
		desc: m.description,
		supported: m.supported_parameters as Capability[],
	}));
}
