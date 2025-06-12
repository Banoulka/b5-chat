import OpenAI from 'openai';

export const orClient = new OpenAI({
	baseURL: 'https://openrouter.ai/api/v1',
	apiKey: process.env.OPENROUTER_API_KEY!,
	defaultHeaders: {
		'HTTP-Referer': 'https://b5.chat',
		'X-Title': 'B5-Chat',
	},
});
