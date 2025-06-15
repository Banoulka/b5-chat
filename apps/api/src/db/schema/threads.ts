import { relations, sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';

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

export const contentTypeEnum = pgEnum('contentType', ['text', 'image']);

export const messages = pgTable(
	'message',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		sortId: serial().notNull(),
		content: text('content').notNull(),
		type: messageTypeEnum('type').notNull(),
		contentType: contentTypeEnum('contentType').notNull().default('text'),
		threadId: uuid('threadId')
			.notNull()
			.references(() => threads.id, { onDelete: 'cascade' }),
		userId: uuid('userId')
			.references(() => users.id, { onDelete: 'cascade' })
			.default(sql`NULL`),
		model: text('model'),
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
	user: one(users, {
		fields: [messages.userId],
		references: [users.id],
	}),
}));
