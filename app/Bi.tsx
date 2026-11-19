/** Bilingual label: Finnish part tagged lang="fi" so screen readers pronounce it correctly. */
export function Bi({ fi, en }: { fi: string; en: string }) {
  return (
    <>
      <span lang="fi">{fi}</span> / {en}
    </>
  );
}
