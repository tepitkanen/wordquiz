"use server";

import { and, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { missedWord, round } from "@/lib/db/schema";
import {
  levelOfPair,
  nextMissedState,
  parseRoundInput,
  type ReviewPair,
} from "@/lib/progress";
import { isDirection } from "@/lib/quiz";

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
      // parseRoundInput guarantees the word is in a current list.
      const set = {
        level: levelOfPair({ en, fi })!,
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

/**
 * The signed-in user's review list for one direction, oldest miss first.
 * Words no longer in any word list are left out. Guests get an empty list.
 */
export async function getReviewWords(direction: unknown): Promise<ReviewPair[]> {
  if (typeof direction !== "string" || !isDirection(direction)) return [];
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const rows = await db
    .select({ en: missedWord.en, fi: missedWord.fi })
    .from(missedWord)
    .where(and(eq(missedWord.userId, session.user.id), eq(missedWord.direction, direction)))
    .orderBy(missedWord.lastMissedAt);

  return rows.flatMap(({ en, fi }) => {
    const level = levelOfPair({ en, fi });
    return level ? [{ en, fi, level }] : [];
  });
}
