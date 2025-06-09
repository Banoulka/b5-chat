import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { env } from '../env';

console.log('db starting', env.DATABASE_URL);
const client = new SQL(env.DATABASE_URL);

export const db = drizzle(client);

const result = await db.execute('select 1');
console.log('result', result);
