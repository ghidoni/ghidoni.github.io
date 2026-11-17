import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const [posts, papers] = await Promise.all([
    getCollection('writing', ({ data }) => !data.draft),
    getCollection('papers', ({ data }) => !data.draft),
  ]);

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: `/writing/${post.id}/`,
      categories: post.data.tags,
    })),
    ...papers.map((paper) => ({
      title: paper.data.title,
      pubDate: paper.data.date,
      description: paper.data.summary,
      link: `/papers/${paper.id}/`,
      categories: paper.data.tags,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: '<language>en</language>',
  });
}
