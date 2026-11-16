import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// TODO: replace with your real domain. Used for canonical URLs, sitemap and RSS.
export default defineConfig({
  site: 'https://yourdomain.com',
  integrations: [sitemap()],
  markdown: {
    // Astro 7 defaults to the Sätteri processor; KaTeX needs the unified pipeline.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
