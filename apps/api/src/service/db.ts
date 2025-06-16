import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import { env } from '../env';

const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema, logger: import.meta.env.DEV ? true : false });

const result = await db.execute('select 1');
console.log('db working', !!result.rows);
