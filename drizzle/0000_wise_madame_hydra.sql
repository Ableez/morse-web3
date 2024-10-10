DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('buyer', 'seller');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "morseacad_content_access" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"content_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "morseacad_contents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"creator_id" varchar(255) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"priceUSD" varchar NOT NULL,
	"priceETH" varchar NOT NULL,
	"token_id" varchar NOT NULL,
	"creator_address" varchar,
	"cover_image" varchar(256)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "morseacad_users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"username" varchar(256) NOT NULL,
	"email" varchar(256),
	"profile_image" varchar(256),
	"wallet_address" varchar
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "morseacad_content_access" ADD CONSTRAINT "morseacad_content_access_content_id_morseacad_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."morseacad_contents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "morseacad_content_access" ADD CONSTRAINT "morseacad_content_access_user_id_morseacad_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."morseacad_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "morseacad_contents" ADD CONSTRAINT "morseacad_contents_creator_id_morseacad_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."morseacad_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_id_idx" ON "morseacad_content_access" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "morseacad_content_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_user_idx" ON "morseacad_content_access" USING btree ("content_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_id_idx" ON "morseacad_contents" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "title_idx" ON "morseacad_contents" USING btree ("title");