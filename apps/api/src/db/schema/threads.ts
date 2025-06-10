import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const threads = pgTable('thread', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	name: text('name').notNull(),
	createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const messages = pgTable('message', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	content: text('content').notNull(),
	type: text('type').$type<'agent' | 'user'>().notNull(),
	threadId: uuid('threadId')
		.notNull()
		.references(() => threads.id, { onDelete: 'cascade' }),
	createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});
