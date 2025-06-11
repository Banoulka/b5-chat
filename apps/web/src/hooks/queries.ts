import type { API_Agent, API_ThreadsResponse } from '@b5-chat/common';

import { api } from '@/components/auth/AuthContext';

export const getThreadOpts = {
	queryFn: () => api<API_ThreadsResponse>('/threads'),
	queryKey: ['threads'],
};

export const getAgentOpts = {
	queryFn: () => api<API_Agent[]>('/agents'),
	queryKey: ['agents'],
};
