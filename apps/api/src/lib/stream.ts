import { END_OF_TEXT_TOKEN } from '@b5-chat/common';
import { ClientResponse } from './ClientResponse';

type TokenData = {
	token: string;
	idx: number;
};

type Session = {
	tokens: TokenData[];
	emitter: EventTarget;
	done: boolean;
	cancel?: () => void;
};

const sessions = new Map<string, Session>();

export const getEmitter = (id: string) => {
	const existingSession = sessions.get(id);
	if (existingSession) return existingSession.emitter;

	const emitter = new EventTarget();
	const session: Session = { tokens: [], emitter, done: false };
	sessions.set(id, session);

	emitter.addEventListener('token', (e: any) => {
		// console.log('getEmitter token', JSON.stringify(e.detail));
		const { token, idx } = e.detail;
		if (token) session.tokens.push({ token, idx });
	});

	// fires first, notifies everywhere that we are done streaming.
	emitter.addEventListener('done', () => {
		console.log('getEmitter done');
		session.done = true;
	});

	return emitter;
};

export const setEmitterCancelEvent = (id: string, cancel: () => void) => {
	const session = sessions.get(id);
	if (session) session.cancel = cancel;
};

export const getStreamSessionContent = (id: string) => {
	const session = sessions.get(id);

	if (!session) return null;

	return session.tokens
		.map((t) => t.token)
		.join('')
		.replace(END_OF_TEXT_TOKEN, '');
};

export const deleteStreamSession = (id: string) => {
	const session = sessions.get(id);

	if (session) {
		session.emitter.dispatchEvent(new Event('done'));
		session.cancel?.();
	}

	sessions.delete(id);
};

export const hasSession = (id: string) => {
	return sessions.has(id);
};

export const streamSession = (id: string, from: number) => {
	const session = sessions.get(id);
	if (!session) return ClientResponse.json({ error: 'Session not found' }, { status: 404 });

	let tokenHandler: ((e: any) => void) | null = null;
	let doneHandler: ((e: any) => void) | null = null;

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
				// console.log('live follow token', JSON.stringify(e.detail));
				const { token, idx } = e.detail;
				if (token && idx >= from) {
					ctrl.enqueue(frameEncode(token, idx));
				}
			};
			const d = () => {
				// TODO: Change to custom done event
				ctrl.enqueue(`id:null\nevent:token\ndata:${END_OF_TEXT_TOKEN}\n\n`);

				console.log('ReadableStream closed because session is done');
				ctrl.close();

				session.emitter.removeEventListener('token', h);
				session.emitter.removeEventListener('done', d);
			};
			tokenHandler = h;
			doneHandler = d;
			session.emitter.addEventListener('token', h);
			session.emitter.addEventListener('done', d); // fires last, if there is any live listener, cancel and reset
		},
		cancel() {
			console.log('ReadableStream cancelled. Removing handlers');
			if (tokenHandler) session.emitter.removeEventListener('token', tokenHandler);
			if (doneHandler) session.emitter.removeEventListener('done', doneHandler);
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
	// if (token === '\n') return `id:${id}\ndata:\n\n`;

	// preserve new lines inside token (by sending multiple data lines)
	return `id:${id}\nevent:token\ndata:${token.replace(/\r?\n/g, '\ndata:')}\n\n`;
};
