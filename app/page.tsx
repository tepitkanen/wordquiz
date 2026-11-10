import Quiz from "./Quiz";

export default function Home() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
      <div className="w-full max-w-xl">
        <Quiz />
      </div>
    </main>
  );
}
