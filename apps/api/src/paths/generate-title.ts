import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { env } from '../env';
import { ClientResponse } from '../lib/ClientResponse';
import { route } from '../lib/router/route';

const generateTitleSchema = z.object({
	message: z.string().min(1, 'Message is required'),
});

const nameAgent = new ChatOpenAI({
	model: 'openai/gpt-4.1-nano',
	temperature: 0.2,
	openAIApiKey: env.OPENROUTER_API_KEY!,
	configuration: {
		baseURL: 'https://openrouter.ai/api/v1',
		defaultHeaders: {
			'HTTP-Referer': env.WEB_URL,
			'X-Title': 'B5-Chat',
		},
	},
	maxTokens: 100,
});

const titlePrompt = ChatPromptTemplate.fromMessages([
	{
		role: 'system',
		content: `You are an assistant that writes short, descriptive thread titles.
  
       • 3-12 words
       • Title Case
       • No quotation marks
       • No trailing punctuation
       • Capture the core topic
  
       Return ONLY the title text.
       
       Here is the conversation, delimited by triple back-ticks.`,
	},
	{
		role: 'user',
		content: `
  \`\`\`
  {chat}
  \`\`\`
  Generate the title now.`,
	},
]);

const chain = titlePrompt.pipe(nameAgent).pipe(new StringOutputParser());

export const POST = route('/generate-title', async (req) => {
	const json = await req.json();
	const parsed = generateTitleSchema.safeParse(json);

	if (!parsed.success) {
		return ClientResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
	}

	try {
		const title = await chain.invoke({ chat: parsed.data.message });

		if (!title) {
			return ClientResponse.json({ error: 'Failed to generate title' }, { status: 500 });
		}

		return ClientResponse.json({ title });
	} catch (error) {
		console.error('Failed to generate title:', error);
		return ClientResponse.json({ error: 'Failed to generate title' }, { status: 500 });
	}
});
