import { Auth } from '@auth/core';
import GitHub from '@auth/core/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { env } from '../env';
import { db } from './db';

export const authHandler = (req: Request) =>
	Auth(req, {
		providers: [
			GitHub({
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			}),
		],
		adapter: DrizzleAdapter(db),
		trustHost: true,
		secret: env.AUTH_SECRET,
	});
