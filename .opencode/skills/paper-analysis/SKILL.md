---
name: Paper Analysis
description: Turn a paper or article (URL, arXiv id, or local PDF) into a cited /papers entry for this site — a technical analysis with a reserved "My take" section left for the author to write.
---

# Paper analysis

Use this when the user supplies a link, arXiv id, or PDF and wants a page under `/papers`.

You produce **one new markdown file** and nothing else. The site derives the page, index row, tag
pages, RSS item and search record from that file.

## Audience and bar

The author is a staff-level data scientist. Write for someone who already knows transformers,
backpropagation, and distributed training. Do not explain fundamentals, do not define
cross-entropy, and do not pad with background the reader already has.

The value you add is precision:

- what exactly was done (architecture, objective, data, compute);
- what exactly was measured (datasets, baselines, ablations, variance);
- what does **not** follow from it.

Every quantitative sentence must be checkable against the source. Every qualitative sentence should
be something a sceptical reviewer would accept.

## Hard rules

1. **Never invent metadata or numbers.** Title, authors, year, venue and link come from the source.
   Quote a result only if it appears in the paper. If a field cannot be confirmed, omit it.
2. **Never write the "My take" section.** That section belongs to the site's author. Create the
   heading and the placeholder marker exactly as templated, then stop.
3. **Say what is missing.** If the paper does not report compute, seeds, data filtering, or an
   ablation, write "not reported" and treat that as a finding — it is often the most useful line on
   the page.
4. **One file per run.** Do not edit notes, tags, navigation, config, or other papers unless the
   user explicitly asks.
5. **Always carry the source URL when one exists.** If the input is a URL or arXiv id, set `link` to
   the canonical landing page (the `abs` page, not the PDF). If a PDF is passed and its arXiv id or
   DOI is legible on the first page, use that. If no canonical page can be confirmed, omit `link`
   and say so in your report — do not invent one.
6. **No Related section.** Keep the page about this paper. Link a concept inline only when the
   sentence needs it; never add a link list at the end.
7. If the source is paywalled, unreadable, or extraction fails, stop and say so. Do not summarise
   from the abstract alone and present it as a full analysis.
8. **Do not reproduce the paper.** Quote at most one sentence, and only when the exact wording
   matters. This keeps the repo free of copyrighted text.

## 1. Get the source

| Input | What to do |
| --- | --- |
| arXiv URL or bare id (`2104.09864`) | Metadata from `https://arxiv.org/abs/<id>`; PDF from `https://arxiv.org/pdf/<id>` |
| Local `.pdf` path | Read it directly with the `read` tool |
| Other URL | Fetch the page. If it is a PDF, download it first with `curl -L -o` |
| Title only | Search for it and confirm the match with the user **before** writing |

Download PDFs to `/tmp/opencode/papers/` (create the directory). Read the first 12–15 pages, then
jump to the results tables, ablations, and limitations. Skip related work. For long papers read in
chunks rather than all at once.

## 2. Extraction protocol

Work through this checklist before writing a single sentence. Take notes on each item; you will not
put all of it in the page.

**Setup**
- Data: source, size, domain, filtering, deduplication, tokenizer, sequence length.
- Model: parameter count, depth/width, attention variant, context length.
- Training: objective, optimizer, LR schedule, batch size, precision, hardware, compute budget.
- Missing anything? Write "not reported" and note it.

**Method**
- The actual change relative to the baseline, and where it enters the computation.
- Equations with symbols defined once. One display equation is usually enough.
- Cost of the change: parameters, FLOPs, memory, latency.

**Evidence**
- Datasets, splits, and whether baselines were compute-matched and tuned.
- Ablations: which component carries the gain, and how much.
- Variance: seeds, error bars, significance. A single-run win is weak evidence.
- Validity: contamination, test-set tuning, metric selection, cherry-picked settings.
- Numbers with units, and the effect size that would matter in practice.

**Limits**
- Regimes not tested, scale not reached, assumptions required for the result to hold.
- Reproduction artifacts: code, data, hyperparameters.
- Gap between what the abstract claims and what the experiments support.

## 3. Write the page

Copy `references/template.md` from this skill and fill it in. The section order is fixed:

1. **Opening paragraph** (no heading) — the claim and why it is non-obvious, 2–4 sentences.
2. **Method** — mechanism, equations, and cost. Assume fluency; skip the tutorial.
3. **Evidence** — experimental design and results. Attribute numbers; separate result from
   interpretation.
4. **Limits and failure modes** — assumptions, untested regimes, reproduction gaps, anything the
   abstract oversells.
5. **What this changes** — consequences if the paper is right, for foundation models and deep
   learning generally: training, serving, evaluation, tooling. Not tied to any one project. At most
   three points; if the paper is narrow enough that nothing generalises, say so and keep it short
   rather than manufacturing relevance.
6. **My take** — heading plus the `<!-- take:pending -->` marker and placeholder blockquote, always
   last.

Target 700–1200 words. Numbers over narrative; conditions over adjectives. Avoid marketing language
("powerful", "revolutionary", "groundbreaking") and filler openings ("In this paper, the authors…").
Match the voice of `src/content/papers/roformer-rotary-position-embedding.md`.

## 4. Name the file

`src/content/papers/<slug>.md`, lowercase, hyphenated, 4–8 words, dropping the subtitle after a
colon unless it is the recognisable name:

- "RoFormer: Enhanced Transformer with Rotary Position Embedding" →
  `roformer-rotary-position-embedding`
- "TabFormer: Tabular Transformers for Modeling Multivariate Time-Series" →
  `tabformer-tabular-transformers`

Check `ls src/content/papers/` first and never reuse a slug.

## 5. Choose tags

Prefer tags already in use:

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
is **expected** for a freshly generated page — the CI build sets `STRICT_TAKES=1` and fails the
deploy instead, so a page cannot go live without the author's take.

Confirm the route exists:

```sh
ls dist/papers/<slug>/index.html
```

## 7. Report back

Tell the user, briefly:

- the file you created and the URL it will live at (`/papers/<slug>/`);
- the source link you recorded, so the user can confirm it points at the right paper;
- which metadata was confirmed and which was omitted or marked "not reported";
- the one or two claims you were least able to verify from the source;
- that the "My take" section is theirs to write, and that `take:pending` must be removed before the
  page can deploy.
