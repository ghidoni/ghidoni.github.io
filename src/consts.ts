export const SITE = {
  /** Shown in the header, page titles and RSS. */
  title: 'Your Name',
  /** Used as the <meta name="description"> on the homepage. */
  description:
    'Notes on machine learning, transaction foundation models, and the systems that make them run.',
  author: 'Your Name',
  /** Must match `site` in astro.config.mjs. */
  url: 'https://yourdomain.com',
  email: 'you@example.com',
  /** Short line under the homepage intro. */
  now: 'Currently: building a transaction foundation model.',
  socials: [
    { label: 'github', href: 'https://github.com/yourhandle' },
    { label: 'x', href: 'https://x.com/yourhandle' },
    { label: 'linkedin', href: 'https://www.linkedin.com/in/yourhandle/' },
    { label: 'email', href: 'mailto:you@example.com' },
  ],
};
