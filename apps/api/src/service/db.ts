import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { env } from '../env';

export const db = drizzle(env.DATABASE_URL, { schema, logger: import.meta.env.DEV ? true : false });

const result = await db.execute('select 1');
console.log('db working', !!result.rows);
