import { ClientResponse } from '../../lib/ClientResponse';
import { route } from '../../lib/router/route';
import { deleteStreamSession, hasSession, streamSession } from '../../lib/stream';

export const HEAD = route('/threads/:threadId/stream', async (req) => {
	const sessionId = `thread-${req.params.threadId}`;
	const session = hasSession(sessionId);

	if (session) {
		return ClientResponse.json({ message: 'Session found' }, { status: 200 });
	}

	return ClientResponse.json({ message: 'Session not found' }, { status: 404 });
});

export const GET = route('/threads/:threadId/stream', async (req) => {
	const url = new URL(req.url);

	const sessionId = `thread-${req.params.threadId}`;

	const clampedFrom = Math.max(0, Number(url.searchParams.get('from') ?? 0));

	return streamSession(sessionId, clampedFrom);
});

export const DELETE = route('/threads/:threadId/stream', async (req) => {
	const sessionId = `thread-${req.params.threadId}`;

	// TODO: Somehow cancel the stream etc.
	deleteStreamSession(sessionId);

	return ClientResponse.json({ message: 'Session deleted' }, { status: 200 });
});

export const OPTIONS = route('/threads/:threadId/stream', async () => {
	return new ClientResponse(null, { status: 200 });
});
