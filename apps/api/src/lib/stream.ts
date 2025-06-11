import { ClientResponse } from './ClientResponse';

type TokenData = {
	token: string;
	idx: number;
};

type Session = {
	tokens: TokenData[];
	emitter: EventTarget;
	done: boolean;
};

const sessions = new Map<string, Session>();

export const getEmitter = (id: string) => {
	const existingSession = sessions.get(id);
	if (existingSession) return existingSession.emitter;

	const emitter = new EventTarget();
	const session: Session = { tokens: [], emitter, done: false };
	sessions.set(id, session);

	emitter.addEventListener('token', (e: any) => {
		const { token, idx } = e.detail;
		if (token) {
			session.tokens.push({ token, idx });
		}
	});

	return emitter;
};

export const streamSession = (id: string, from: number) => {
	const session = sessions.get(id);
	if (!session) return ClientResponse.json({ error: 'Session not found' }, { status: 404 });

	let eventHandler: ((e: any) => void) | null = null;

	const stream = new ReadableStream({
		start(ctrl) {
			// backlog - find tokens starting from the 'from' character position
			for (const tokenData of session.tokens) {
				if (tokenData.idx >= from) {
					ctrl.enqueue(frameEncode(tokenData.token, tokenData.idx));
				}
			}

			// live follow
			const h = (e: any) => {
				const { token, idx, done } = e.detail;
				if (token && idx >= from) {
					ctrl.enqueue(frameEncode(token, idx));
				}
				if (done) ctrl.close();
			};
			eventHandler = h;
			session.emitter.addEventListener('token', h);

			if (session.done) ctrl.close();
		},
		cancel() {
			if (eventHandler) {
				session.emitter.removeEventListener('token', eventHandler);
			}
		},
	});

	return new ClientResponse(stream, {
		headers: { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' },
	});
};

const frameEncode = (token: string, id: number) => {
	// preserve leading space
	if (token.startsWith(' ')) token = ' ' + token;

	// preserve new line
	if (token === '\n') return `id:${id}\ndata:\n\n`;

	// preserve new lines inside token (by sending multiple data lines)
	return `id:${id}\ndata:${token.replace(/\r?\n/g, '\ndata:')}\n\n`;
};
