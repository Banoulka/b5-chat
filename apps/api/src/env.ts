import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	server: {
		PORT: z.coerce.number().default(3000),
		DATABASE_URL: z.string().min(1),
		GITHUB_CLIENT_ID: z.string().min(1),
		GITHUB_CLIENT_SECRET: z.string().min(1),
		AUTH_SECRET: z.string().min(1),
	},
	runtimeEnv: process.env,
});
