import { route } from '../lib/router/route';
import { streamSession } from '../lib/stream';

export const testId = '1234';

export const GET = route('/stream', async (req) => {
	const url = new URL(req.url);

	const clampedFrom = Math.max(0, Number(url.searchParams.get('from') ?? 0));

	return streamSession(testId, clampedFrom);
});
