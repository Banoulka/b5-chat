CREATE TABLE "threadShareLink" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thread" ADD COLUMN "userId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "threadShareLink" ADD CONSTRAINT "threadShareLink_threadId_thread_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "threadShareLinks_thread_id_idx" ON "threadShareLink" USING btree ("threadId");--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "threads_user_id_idx" ON "thread" USING btree ("userId");