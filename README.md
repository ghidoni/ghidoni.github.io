# Personal site

A static personal site built with [Astro](https://astro.build), designed to hold three kinds of
content:

- **`/writing`** — dated, chronological devlogs and essays. Never rewritten after publication.
- **`/papers`** — close readings of papers and articles. Each entry carries citation metadata and a
  one-line takeaway, so the section doubles as an annotated bibliography.
- **`/notes`** — an evergreen library. One page per concept (pre-training, fine-tuning, prefill,
  sequence packing, …), revised over time, each showing a "last reviewed" date.

Search is built at deploy time with [Pagefind](https://pagefind.app), math is rendered with KaTeX,
and the whole thing deploys to GitHub Pages as plain HTML/CSS with almost no JavaScript.

## Requirements

Node **22.23.4 or newer** (Astro 7 needs it). A `.nvmrc` is included:

```sh
nvm use          # picks up .nvmrc
npm install
npm run dev      # http://localhost:4321
```

| Command           | Does                                            |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                      |
| `npm run build`   | Static build to `dist/` + Pagefind search index |
| `npm run preview` | Serve the built site (search works here)        |
| `npm run check`   | Type-check Astro + content schemas              |

Search only exists after a build, so use `npm run build && npm run preview` to test it locally.

## Make it yours

1. **Identity** — edit `src/consts.ts`: name, description, email, social links, and the "currently"
   line on the homepage.
2. **Domain** — set `site` in `astro.config.mjs` (used for canonical URLs, RSS and the sitemap) and
   update `public/robots.txt`.
3. **Colours and type** — every token lives at the top of `src/styles/global.css`. The dark theme is
   electric cyan on near-black; the light theme is burnt amber on warm paper (the "Clu" half of the
   Tron palette). Both are driven by `--accent` / `--accent-hi` / `--rule`, and the dark theme also
   has `--glow` for the neon text shadows. To make both themes share one accent, copy the `--accent`
   values from one block into the other.

## Writing content

Posts live in `src/content/writing/`, paper analyses in `src/content/papers/`, notes in
`src/content/notes/`. The filename becomes the URL: `src/content/notes/prefill.md` →
`/notes/prefill/`.

**Treat note slugs as permanent.** You will link to them from papers, CVs and conversations. If a
page needs a new name, add a redirect rather than renaming the file.

Writing frontmatter:

```yaml
---
title: 'Starting a log for the transaction foundation model'
date: 2026-11-16
summary: 'One or two sentences used in lists, RSS and search results.'
tags: ['meta', 'tfm']
draft: false
---
```

Notes frontmatter:

```yaml
---
title: 'Prefill'
summary: 'One or two sentences used in lists and search results.'
tags: ['inference', 'systems']
created: 2026-11-16
updated: 2026-11-16 # renders as "last reviewed"
order: 30 # lower sorts first on /notes
draft: false
---
```

Papers frontmatter (the `title` is the *source's* title, not your headline):

```yaml
---
title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding'
authors: ['Jianlin Su', 'Yu Lu', 'Shengfeng Pan']
year: 2021
venue: 'arXiv'
link: 'https://arxiv.org/abs/2104.09864' # rendered as a clickable source row
kind: preprint # paper | preprint | article | book | talk
date: 2026-11-17 # when you wrote the analysis
summary: 'The one-line takeaway shown in lists, RSS and search.'
status: studied # skimmed | read | studied
tags: ['architecture', 'position-encoding']
draft: false
---
```

`draft: true` keeps an entry out of every page, feed and the search index.

### Generating a paper analysis with an agent

The repo ships a skill and a command for this. From OpenCode, pass a URL, an arXiv id, or a local
PDF:

```
/paper https://arxiv.org/abs/2104.09864
/paper ~/Downloads/some-paper.pdf
```

The `paper-analysis` skill (`.opencode/skills/paper-analysis/`) fetches the source, extracts
metadata and evidence, and writes exactly one file under `src/content/papers/`. It follows the
fixed section order used by the existing pages, reuses your tags, and stops before the last
section.

**The last section is yours.** Generated pages end with:

```md
## My take

<!-- take:pending -->

> _Not written yet. Replace this block with your own opinion…_
```

Two guardrails make this hard to get wrong:

- `npm run build` warns if a non-draft paper still contains `take:pending`.
- The GitHub Actions build sets `STRICT_TAKES=1`, so the same check **fails the deploy** instead of
  warning. A generated analysis cannot go live without your take.

Write the opinion, delete the marker (and the blockquote), then commit. If you ever want to publish
an analysis without an opinion, delete the whole `## My take` section — the check only looks for the
marker.

You can also skip the command and ask for the skill directly (`@paper-analysis`) or write the page
by hand; nothing about the site depends on the agent.

### Which section does a page belong in?

- Did **you** build or decide something? → `writing`.
- Is the subject **someone else's** paper or article? → `papers`.
- Is it a **definition** you will revise forever, with no external subject? → `notes`.

A paper analysis and a concept note often pair up. Write the analysis in `papers`, and if the
concept deserves a permanent definition, write that in `notes` and link the two.

### Markdown extras

- Inline math with `$...$`, display math with `$$...$$` (KaTeX).
- Fenced code blocks are syntax-highlighted by Shiki.
- Internal links are plain absolute paths: `[fine-tuning](/notes/fine-tuning/)`.
- Tables, footnotes and GFM are enabled.

### Adding a note, end to end

```sh
$EDITOR src/content/notes/prefill.md
npm run dev            # check it at /notes/prefill/
```

It automatically appears in `/notes`, in its tag pages, in search, and in the sitemap. The same is
true for anything you add under `src/content/papers/` or `src/content/writing/`.

## Deploy to GitHub Pages

1. Create a repository named **`<your-username>.github.io`** — this serves the site at the domain
   root. Any other repository name would serve it under `/<repo>/` and require an extra `base` in
   the Astro config.
2. Push this project to it:

   ```sh
   git init
   git add -A
   git commit -m "initial commit"
   git branch -M main
   git remote add origin git@github.com:<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```

3. In the repository: **Settings → Pages → Source → GitHub Actions**. The workflow in
   `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

The build job uses Node 24; keep `.nvmrc`, `engines` in `package.json`, and the workflow's
`node-version` in agreement if you change it.

### Custom domain

1. In your DNS provider, add `CNAME` → `<your-username>.github.io` for `www`, and `A` records to
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` for the apex.
2. Put the bare domain in `public/CNAME` (e.g. `yourdomain.com`).
3. Set the same domain as `site` in `astro.config.mjs`, and in **Settings → Pages → Custom domain**.
4. Wait for the certificate, then enable **Enforce HTTPS**.

### What GitHub Pages does not do

No server-side code, no database. Limits are roughly 1 GB published site and 100 GB/month of
bandwidth, and free accounts can only publish from public repositories. None of that matters for a
personal site. If a post ever goes viral, moving to Cloudflare Pages is a 20-minute change — the
build output is identical.

## Structure

```
src/
  consts.ts              site identity (name, socials, description)
  content.config.ts      schemas for the two collections
  content/
    writing/*.md         dated posts
    papers/*.md          cited paper analyses
    notes/*.md           evergreen reference pages
  layouts/Base.astro     <head>, header, footer, theme bootstrap
  components/            Header, Footer, Entry
  lib/utils.ts           date formatting, sorting, tag slugs
  pages/
    index.astro          homepage
    writing/             index + [slug]
    papers/              index + [slug]
    notes/                index + [slug]
    tags/                 index + [tag]
    search.astro         Pagefind UI
    rss.xml.ts           feed
    404.astro
  styles/global.css      design tokens + all styling
public/                   favicon, robots.txt, CNAME
scripts/
  check-papers.mjs       blocks deploys with an unwritten "My take"
.opencode/
  skills/paper-analysis/ agent workflow for generating /papers entries
  commands/paper.md      /paper <url-or-pdf>
```

## Included

- Dark/light theme with no flash on load, remembered in `localStorage`
- Per-year archives for writing and papers, tag pages, RSS, sitemap
- KaTeX, Shiki, Pagefind search with section filters
- SEO tags, canonical URLs, reduced-motion support, skip link

## Not included (deliberately)

Analytics, comments, and a CMS. Add them only when you miss them:

- Analytics: Plausible, Umami, or GoatCounter — a single script tag.
- Comments: Giscus (GitHub Discussions) — a single script tag.
- Newsletter: Buttondown or a plain `mailto:` link.

## Sample content to delete

`src/content/writing/starting-the-tfm-log.md`, `src/content/papers/roformer-rotary-position-embedding.md`
and the four files in `src/content/notes/` are seeds written to demonstrate the format. Replace them
with your own.
