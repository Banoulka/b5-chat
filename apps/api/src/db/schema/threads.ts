import { relations, sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const threads = pgTable(
	'thread',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		name: text('name').notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
	},
	(table) => ({
		createdAtIdx: index('threads_created_at_idx').on(table.createdAt),
		nameIdx: index('threads_name_idx').on(table.name),
	}),
);

export const messageTypeEnum = pgEnum('type', ['agent', 'user']);

export const messages = pgTable(
	'message',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		content: text('content').notNull(),
		type: messageTypeEnum('type').notNull(),
		threadId: uuid('threadId')
			.notNull()
			.references(() => threads.id, { onDelete: 'cascade' }),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
	},
	(table) => ({
		threadIdIdx: index('messages_thread_id_idx').on(table.threadId),
		createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
		typeIdx: index('messages_type_idx').on(table.type),
		threadCreatedIdx: index('messages_thread_created_idx').on(table.threadId, table.createdAt),
	}),
);

export const threadsRelations = relations(threads, ({ many }) => ({
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	thread: one(threads, {
		fields: [messages.threadId],
		references: [threads.id],
	}),
}));
