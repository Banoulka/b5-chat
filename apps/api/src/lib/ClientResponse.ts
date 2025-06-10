import { env } from '../env';

export class ClientResponse extends Response {
	constructor(body?: BodyInit, init?: ResponseInit) {
		super(body, init);
		this.headers.set('Access-Control-Allow-Origin', env.WEB_URL);
		this.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
		this.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		this.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	static json(data: unknown, init: ResponseInit = {}) {
		return new ClientResponse(JSON.stringify(data), {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...(init.headers ?? {}),
			},
		});
	}
}
