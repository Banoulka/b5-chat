import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { eq } from 'drizzle-orm';
import { threads } from '../../db/schema';
import { env } from '../../env';
import { db } from '../../service/db';

const nameAgent = new ChatOpenAI({
	model: 'google/gemma-3-4b-it:free',
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

export const generateThreadName = async (threadId: string, firstMessage: string) => {
	try {
		const response = await chain.invoke({ chat: firstMessage });

		console.log(`[agent]: Name generated for thread ${threadId}: '${response}'`);

		if (!response) return;

		await db.update(threads).set({ name: response }).where(eq(threads.id, threadId));
	} catch (error) {
		console.error(`Failed to set thread name for ${threadId}:`, error);
		await db
			.update(threads)
			.set({ name: `New thread ${threadId}` })
			.where(eq(threads.id, threadId));
	}
};
