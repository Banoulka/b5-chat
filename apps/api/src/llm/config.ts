import type { LanguageModelLike } from '@langchain/core/language_models/base';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearch } from '@langchain/tavily';
import type { API_Agent } from 'packages/common';

// Define the tools for the agent to use
const agentTools = [new TavilySearch({ maxResults: 3 })];
const agentModel = new ChatOpenAI({ temperature: 0.5 });

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver();
const openaiAgent = createReactAgent({
	llm: agentModel,
	tools: agentTools,
	checkpointSaver: agentCheckpointer,
});

const buildReactAgent = (model: LanguageModelLike) => {
	const agentTools = [new TavilySearch({ maxResults: 3 })];
	const agentCheckpointer = new MemorySaver();
	return createReactAgent({
		llm: model,
		tools: agentTools,
		checkpointSaver: agentCheckpointer,
	});
};

const agents = {
	'openai:gpt-4o': {
		agent: buildReactAgent(new ChatOpenAI({ temperature: 0.5, model: 'gpt-4o' })),
		name: 'OpenAI GPT-4o',
		description:
			'OpenAI GPT-4o is a powerful language model that can be used to generate text, answer questions, and more.',
	},
	'openai:gpt-4o-mini': {
		agent: buildReactAgent(new ChatOpenAI({ temperature: 0.5, model: 'gpt-4o-mini' })),
		name: 'OpenAI GPT-4o Mini',
		description:
			'OpenAI GPT-4o Mini is a powerful language model that can be used to generate text, answer questions, and more.',
	},
} as const;

type Agents = typeof agents;
type AgentId = keyof Agents;

export const getAgent = (agentId: AgentId) => {
	return agents[agentId].agent;
};

export const agentsData = Object.entries(agents).map(([id, { name, description }]) => ({
	id,
	name,
	description,
	features: [],
})) satisfies API_Agent[];

// Now it's time to use!
// const agentFinalState = await agent.invoke(
// 	{ messages: [new HumanMessage('what is the current weather in sf')] },
// 	{ configurable: { thread_id: '42' } },
// );

// console.log(agentFinalState.messages[agentFinalState.messages.length - 1].content);

// const agentNextState = await agent.invoke(
// 	{ messages: [new HumanMessage('what about ny')] },
// 	{ configurable: { thread_id: '42' } },
// );

// console.log(agentNextState.messages[agentNextState.messages.length - 1].content);
