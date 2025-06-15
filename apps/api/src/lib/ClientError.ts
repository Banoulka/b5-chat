export class ClientError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
	}
}

export class BadRequestError extends ClientError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class NotFoundError extends ClientError {
	constructor(message: string) {
		super(message, 404);
	}
}

export class UnauthorizedError extends ClientError {
	constructor(message: string) {
		super(message, 401);
	}
}

export class ForbiddenError extends ClientError {
	constructor(message: string) {
		super(message, 403);
	}
}

export class InternalServerError extends ClientError {
	constructor(message: string) {
		super(message, 500);
	}
}
