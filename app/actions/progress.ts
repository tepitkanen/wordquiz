"use server";

import { and, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { missedWord, round } from "@/lib/db/schema";
import { nextMissedState, parseRoundInput } from "@/lib/progress";

/**
 * Saves a finished round for the signed-in user and updates their review list.
 * Does nothing for guests or invalid input. The score comes from the answers,
 * not from the client.
 */
export async function saveRound(input: unknown): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  const data = parseRoundInput(input);
  if (!data) return;

  const userId = session.user.id;
  const { direction, level, answers } = data;

  // Current review-list rows for this round's words (matched on en+fi below).
  const rows = await db
    .select()
    .from(missedWord)
    .where(
      and(
        eq(missedWord.userId, userId),
        eq(missedWord.direction, direction),
        inArray(missedWord.en, answers.map((a) => a.en)),
      ),
    );
  const rowFor = (en: string, fi: string) => rows.find((r) => r.en === en && r.fi === fi) ?? null;

  const writes = answers.flatMap(({ en, fi, correct }): BatchItem<"pg">[] => {
    const update = nextMissedState(rowFor(en, fi), correct);
    const key = and(
      eq(missedWord.userId, userId),
      eq(missedWord.direction, direction),
      eq(missedWord.en, en),
      eq(missedWord.fi, fi),
    );
    if (update.kind === "delete") return [db.delete(missedWord).where(key)];
    if (update.kind === "upsert") {
      const set = {
        level,
        missCount: update.missCount,
        correctStreak: update.correctStreak,
        ...(correct ? {} : { lastMissedAt: new Date() }),
      };
      return [
        db
          .insert(missedWord)
          .values({ userId, direction, en, fi, ...set })
          .onConflictDoUpdate({
            target: [missedWord.userId, missedWord.direction, missedWord.en, missedWord.fi],
            set,
          }),
      ];
    }
    return [];
  });

  // One batch = one transaction on Neon's HTTP driver: all writes or none.
  await db.batch([
    db.insert(round).values({
      userId,
      direction,
      level,
      score: answers.filter((a) => a.correct).length,
      total: answers.length,
    }),
    ...writes,
  ]);
}
