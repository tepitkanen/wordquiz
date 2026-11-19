import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DIRECTIONS, isDirection } from "@/lib/quiz";
import Quiz from "../../Quiz";

// Prerender both directions. (`dynamicParams` isn't allowed with cacheComponents;
// unknown directions are rejected by notFound() below instead.)
export function generateStaticParams() {
  return DIRECTIONS.map((direction) => ({ direction }));
}

export default function QuizPage({ params }: PageProps<"/quiz/[direction]">) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
      <div className="w-full max-w-xl">
        {/* Reading params inside Suspense keeps the page shell instant on navigation. */}
        <Suspense fallback={null}>
          <QuizForDirection params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function QuizForDirection({ params }: Pick<PageProps<"/quiz/[direction]">, "params">) {
  const { direction } = await params;
  if (!isDirection(direction)) notFound();
  return <Quiz direction={direction} />;
}
