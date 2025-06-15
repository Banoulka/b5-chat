import type { Middleware } from './core';

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
};

const getMethodColor = (method: string) => {
	switch (method.toUpperCase()) {
		case 'GET':
			return colors.blue;
		case 'POST':
			return colors.green;
		case 'PUT':
			return colors.yellow;
		case 'DELETE':
			return colors.red;
		case 'PATCH':
			return colors.magenta;
		default:
			return colors.white;
	}
};

const getStatusColor = (status: number) => {
	if (status >= 200 && status < 300) return colors.green;
	if (status >= 300 && status < 400) return colors.cyan;
	if (status >= 400 && status < 500) return colors.yellow;
	if (status >= 500) return colors.red;
	return colors.white;
};

const getCurrentTime = () => {
	const now = new Date();
	return now.toTimeString().split(' ')[0] || '00:00:00';
};

export const logging: Middleware = async (req, next) => {
	const timeNow = process.hrtime();
	const response = await next(req);
	const timeDiff = process.hrtime(timeNow);
	const timeDiffInMs = timeDiff[0] * 1000 + timeDiff[1] / 1000000;

	const methodColor = getMethodColor(req.method);
	const statusColor = getStatusColor(response.status);
	const currentTime = getCurrentTime();
	const urlWithoutBase = new URL(req.url).pathname;

	console.log(
		`${colors.bright}[${currentTime}]${colors.reset} ` +
			`${methodColor}${req.method}${colors.reset}: ` +
			`${urlWithoutBase} ${timeDiffInMs.toFixed(2)}ms -- ` +
			`${statusColor}${response.status}${colors.reset}`,
	);

	return response;
};
