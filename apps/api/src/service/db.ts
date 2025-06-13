import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from '../db/schema';
import { env } from '../env';

const client = new SQL(env.DATABASE_URL);

export const db = drizzle(client, { schema, logger: import.meta.env.DEV ? true : false });

const result = await db.execute('select 1');
console.log('db working', !!result[0]);
