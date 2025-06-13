CREATE TYPE "public"."type" AS ENUM('agent', 'user');--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "type" SET DATA TYPE "public"."type" USING "type"::"public"."type";