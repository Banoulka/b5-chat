import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import { env } from '../../env';

export const orClient = new OpenAI({
	apiKey: process.env.OPENROUTER_API_KEY!,
	defaultHeaders: {
		'HTTP-Referer': 'https://b5.chat',
		'X-Title': 'B5-Chat',
	},
});

const modelCache = new Map<string, ChatOpenAI>();

export const getAgent = (model: string, reasoning: boolean) => {
	const cacheKey = `${model}-${reasoning ? 'r' : 'nr'}`;
	const cachedModel = modelCache.get(cacheKey);
	if (cachedModel) return cachedModel;

	const newModel = new ChatOpenAI({
		model,
		temperature: 0.5,
		streaming: true,
		openAIApiKey: env.OPENROUTER_API_KEY!,
		configuration: {
			baseURL: 'https://openrouter.ai/api/v1',
			defaultHeaders: {
				'HTTP-Referer': env.WEB_URL,
				'X-Title': 'B5-Chat',
			},
		},
		reasoning: reasoning ? { effort: 'medium', summary: 'concise' } : undefined,
		// TODO: Options like max tokens? etc
	});

	modelCache.set(cacheKey, newModel);

	return newModel;
};
