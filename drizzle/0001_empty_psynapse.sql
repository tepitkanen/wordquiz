CREATE TABLE "missed_word" (
	"user_id" text NOT NULL,
	"direction" text NOT NULL,
	"level" text NOT NULL,
	"en" text NOT NULL,
	"fi" text NOT NULL,
	"miss_count" integer NOT NULL,
	"correct_streak" integer DEFAULT 0 NOT NULL,
	"last_missed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "missed_word_user_id_direction_en_fi_pk" PRIMARY KEY("user_id","direction","en","fi")
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"direction" text NOT NULL,
	"level" text NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "missed_word" ADD CONSTRAINT "missed_word_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "round_userId_playedAt_idx" ON "round" USING btree ("user_id","played_at");