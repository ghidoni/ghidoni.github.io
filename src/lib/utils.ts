/** ISO date for <time datetime> and display, in UTC so builds are stable. */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Newest first. */
export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T): number {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

/** Lower `order` first, then title. */
export function byOrder<T extends { data: { order: number; title: string } }>(a: T, b: T): number {
  return a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);
}

/** Collect tag -> count across a set of entries. */
export function tagCounts(entries: { data: { tags: string[] } }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return new Map([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "Vaswani et al." / "A & B" / "Solo". */
export function shortAuthors(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

/** One-line citation: authors · venue · year. */
export function citationLine(data: {
  authors: string[];
  venue?: string;
  year?: number;
}): string {
  return [shortAuthors(data.authors), data.venue, data.year?.toString()]
    .filter(Boolean)
    .join(' · ');
}

/** "https://www.arxiv.org/abs/2104.09864/" → "arxiv.org/abs/2104.09864" for display. */
export function prettyUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}
