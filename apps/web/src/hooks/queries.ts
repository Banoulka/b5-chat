import type { API_ThreadsResponse, ModelCard } from '@b5-chat/common';

import { api } from '@/components/auth/AuthContext';

export const getThreadOpts = {
	queryFn: () => api<API_ThreadsResponse>('/threads'),
	queryKey: ['threads'],
};

export const getAgentOpts = {
	queryFn: () => api<ModelCard[]>('/agents'),
	queryKey: ['agents'],
};

export const getMessageOpts = (threadId: string) => {
	return {
		queryKey: ['messages', threadId],
	};
};
