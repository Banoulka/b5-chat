import { setCustomHeaders } from '../utils/setCustomHeaders';

export class ClientResponse extends Response {
	constructor(body?: BodyInit | null, init?: ResponseInit) {
		super(body, init);
		setCustomHeaders(this.headers);
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
