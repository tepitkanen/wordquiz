import Link from "next/link";
import { DIRECTIONS, DIRECTION_LABELS } from "@/lib/quiz";
import { Logo } from "./Logo";
import { choiceLink } from "./styles";

export default function Home() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <header className="mb-4 flex flex-col items-center gap-3">
          <Logo className="h-48 w-auto" />
          <h1 lang="fi" className="text-4xl font-bold tracking-tight">
            Sanavisa
          </h1>
        </header>
        <nav aria-label="Suunta / Direction" className="flex flex-col gap-3">
          {DIRECTIONS.map((d) => (
            <Link key={d} href={`/quiz/${d}`} prefetch={true} className={choiceLink}>
              {DIRECTION_LABELS[d]}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
