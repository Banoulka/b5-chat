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
		userId: uuid('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
	},
	(table) => ({
		createdAtIdx: index('threads_created_at_idx').on(table.createdAt),
		nameIdx: index('threads_name_idx').on(table.name),
		userIdIdx: index('threads_user_id_idx').on(table.userId),
	}),
);

export const messageTypeEnum = pgEnum('type', ['agent', 'user']);

export const messages = pgTable(
	'message',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		sortId: serial().notNull(),
		content: text('content').notNull(),
		type: messageTypeEnum('type').notNull(),
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

export const attachments = pgTable(
	'attachment',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		messageId: uuid('messageId')
			.notNull()
			.references(() => messages.id, { onDelete: 'cascade' }),
		key: text('key').notNull(),
		name: text('name').notNull(),
	},
	(table) => ({
		messageIdIdx: index('attachments_message_id_idx').on(table.messageId),
	}),
);

export const threadShareLinks = pgTable(
	'threadShareLink',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		threadId: uuid('threadId')
			.notNull()
			.references(() => threads.id, { onDelete: 'cascade' }),
		url: text('url').notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
	},
	(table) => ({
		threadIdIdx: index('threadShareLinks_thread_id_idx').on(table.threadId),
	}),
);

export const attachmentRelations = relations(attachments, ({ one }) => ({
	message: one(messages, {
		fields: [attachments.messageId],
		references: [messages.id],
	}),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
	user: one(users, {
		fields: [threads.userId],
		references: [users.id],
	}),
	messages: many(messages),
	shareLinks: many(threadShareLinks),
}));

export const threadShareLinksRelations = relations(threadShareLinks, ({ one }) => ({
	thread: one(threads, {
		fields: [threadShareLinks.threadId],
		references: [threads.id],
	}),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
	thread: one(threads, {
		fields: [messages.threadId],
		references: [threads.id],
	}),
	user: one(users, {
		fields: [messages.userId],
		references: [users.id],
	}),
	attachments: many(attachments),
}));
