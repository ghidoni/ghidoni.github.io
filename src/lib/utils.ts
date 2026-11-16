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
