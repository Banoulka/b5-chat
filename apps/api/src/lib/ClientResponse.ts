export class ClientResponse extends Response {
	constructor(body?: BodyInit, init?: ResponseInit) {
		super(body, init);
		this.headers.set('Access-Control-Allow-Origin', '*');
		this.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET');
		this.headers.set('Access-Control-Allow-Headers', 'Content-Type');
		this.headers.set('X-Test', 'test');
	}

	/** Return *our* subclass so the headers stick. */
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
