import type { ReactNode } from "react";

export function RelatedLinks({ value }: { value: string | null }) {
  if (!value) return <>—</>;
  const parts: ReactNode[] = [];
  let previous = 0;
  for (const match of value.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    const candidate = match[0].replace(/[.,;:!?]+$/, "");
    parts.push(value.slice(previous, match.index));
    try {
      const url = new URL(candidate);
      parts.push(
        <a
          key={match.index}
          href={url.href}
          target="_blank"
          rel="noreferrer"
          className="break-all text-primary hover:underline"
        >
          {candidate}
        </a>
      );
    } catch {
      parts.push(candidate);
    }
    previous = match.index + candidate.length;
  }
  parts.push(value.slice(previous));
  return <span className="whitespace-pre-wrap">{parts}</span>;
}
