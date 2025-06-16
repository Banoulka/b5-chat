CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "sortId" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "userId" uuid DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_message_id_idx" ON "attachment" USING btree ("messageId");--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_thread_id_idx" ON "message" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "message" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "messages_type_idx" ON "message" USING btree ("type");--> statement-breakpoint
CREATE INDEX "messages_thread_created_idx" ON "message" USING btree ("threadId","createdAt");--> statement-breakpoint
CREATE INDEX "threads_created_at_idx" ON "thread" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "threads_name_idx" ON "thread" USING btree ("name");