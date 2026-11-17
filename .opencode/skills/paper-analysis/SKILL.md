---
name: Paper Analysis
description: Turn a paper or article (URL, arXiv id, or local PDF) into a cited /papers entry for this site — summary, analysis, and a reserved "My take" section left for the author to write.
---

# Paper analysis

Use this when the user supplies a link, arXiv id, or PDF and wants a page under `/papers`.

You produce **one new markdown file** and nothing else. The site derives the page, index row, tag
pages, RSS item and search record from that file.

## Hard rules

1. **Never invent metadata.** Title, authors, year, venue and link must come from the source. All
   fields except `title`, `date` and `summary` are optional — omit what you cannot confirm.
2. **Never write the "My take" section.** That section belongs to the site's author. Create the
   heading and the placeholder marker exactly as templated, then stop.
3. **Never fabricate results.** Quote a number only if it appears in the source. When repeating a
   claim you did not verify, attribute it: "the paper reports…".
4. **One file per run.** Do not edit notes, tags, navigation, config, or other papers unless the
   user explicitly asks.
5. If the source is paywalled, unreadable, or extraction fails, stop and say so. Do not summarise
   from the abstract alone and present it as a full analysis.
6. **Do not reproduce the paper.** Quote at most a single sentence, and only when the exact wording
   matters. The page is your analysis, not an excerpt — this also keeps the repo free of
   copyrighted text.

## 1. Get the source

| Input | What to do |
| --- | --- |
| arXiv URL or bare id (`2104.09864`) | Metadata from `https://arxiv.org/abs/<id>`; PDF from `https://arxiv.org/pdf/<id>` |
| Local `.pdf` path | Read it directly with the `read` tool |
| Other URL | Fetch the page. If it is a PDF, download it first with `curl -L -o` |
| Title only | Search for it and confirm the match with the user **before** writing |

Download PDFs to `/tmp/opencode/papers/` (create the directory). Read the first 12–15 pages:
abstract, introduction, method, results, limitations. Skip related work and the appendix unless a
claim depends on them. For long papers, read in chunks rather than all at once.

## 2. Extract before writing

Write down, separately:

- **What they claim** — the contribution, in one sentence.
- **What they show** — datasets, baselines, the specific numbers, and what those numbers can and
  cannot support.
- **What they assume** — the conditions under which the result holds.
- **What they admit** — limitations the authors state themselves.

Keep claim and evidence distinct. Most bad analyses collapse the two.

## 3. Write the page

Copy `references/template.md` from this skill and fill it in. The section order is fixed:

1. **Opening paragraph** (no heading) — the claim, 2–4 sentences, no preamble.
2. **How it works** — the mechanism. Use display math where it earns its place; avoid long inline
   formulas (they wrap badly on mobile).
3. **Evidence** — what was measured and what it supports. Attribute numbers.
4. **What to be careful about** — limits, assumptions, failure modes, anything the abstract
   oversells.
5. **Why it matters for my work** — optional. Keep only if there is a real connection to
   transaction foundation models; delete the section rather than pad it.
6. **Related** — links to existing `/notes/…` or `/papers/…` pages. Verify each path exists.
7. **My take** — heading plus the `<!-- take:pending -->` marker and placeholder blockquote,
   always last.

Target 500–900 words. Match the voice of `src/content/papers/roformer-rotary-position-embedding.md`:
first person, terse, willing to disagree with the paper. No marketing adjectives ("powerful",
"revolutionary", "groundbreaking") and no filler openings ("In this paper, the authors…").

## 4. Name the file

`src/content/papers/<slug>.md`, where the slug is lowercase, hyphenated, 4–8 words, and drops the
subtitle after a colon unless the subtitle is the recognisable name:

- "RoFormer: Enhanced Transformer with Rotary Position Embedding" →
  `roformer-rotary-position-embedding`
- "TabFormer: Tabular Transformers for Modeling Multivariate Time-Series" →
  `tabformer-tabular-transformers`

Check `ls src/content/papers/` first and never reuse a slug.

## 5. Choose tags

Prefer tags already in use. Collect them with:

```sh
grep -h '^tags:' src/content/papers/*.md src/content/notes/*.md
```

Use 2–4 tags. A new tag is fine when nothing existing fits, but do not invent near-duplicates
(`inference` vs `inferencing`).

## 6. Validate

```sh
npm run check
npm run build
```

`npm run build` prints a warning when a non-draft paper still contains `take:pending`. That warning
is **expected** for a freshly generated page — it means the guard is doing its job. In CI the same
check fails the deploy, so a page cannot go live without the author's take.

Then confirm the route exists:

```sh
ls dist/papers/<slug>/index.html
```

## 7. Report back

Tell the user, briefly:

- the file you created;
- the URL it will live at (`/papers/<slug>/`);
- which metadata was confirmed from the source and which was omitted or inferred;
- that the "My take" section is theirs to write, and that `take:pending` must be removed before
  the page can deploy.
