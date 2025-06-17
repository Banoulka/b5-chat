import { Auth, createActionURL, setEnvDefaults, type AuthConfig } from '@auth/core';
import GitHub from '@auth/core/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Session } from '@b5-chat/common';
import { env } from '../env';
import { db } from './db';

const authConfig: AuthConfig = {
	providers: [
		GitHub({
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		}),
	],
	adapter: DrizzleAdapter(db),
	trustHost: true,
	secret: env.AUTH_SECRET,
	session: {
		strategy: 'jwt',
	},
	basePath: '/auth',
	debug: true,
	callbacks: {
		async session({ session, token }) {
			session.user.id = token.sub!;
			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
	},
};

export const authHandler = (req: Request) => Auth(req, authConfig);

export async function getSession(req: Request) {
	setEnvDefaults(process.env, authConfig);
	const url = createActionURL('session', req.url, req.headers, process.env, authConfig);
	const response = await Auth(new Request(url, { headers: { cookie: req.headers.get('cookie') ?? '' } }), authConfig);

	const { status = 200 } = response;

	const data = await response.json();

	if (!data || !Object.keys(data).length) return null;
	if (status === 200) return data as Session;
	return null;
}
