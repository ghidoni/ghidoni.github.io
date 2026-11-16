---
title: 'Starting a log for the transaction foundation model'
date: 2026-11-16
summary: 'Why this site exists, and why the work is split into a dated log and an evergreen library.'
tags: ['meta', 'tfm']
draft: false
---

I am building a foundation model for transaction data. This is the first entry in what will be a
running log of that work — decisions, dead ends, benchmarks, and the occasional result worth
keeping.

The motivation is straightforward. Transactions are a sequence modality with their own grammar:
event types, amounts, timestamps, counterparties, and an ordering that carries most of the signal.
General-purpose language models have never seen this distribution. A model pre-trained on financial
event sequences should, in principle, learn representations that transfer across institutions,
products, and tasks the same way a text model transfers across domains.

This site has two halves, and the split is deliberate:

- **Writing** (this page) is chronological. It records what I did and what I learned at a point in
  time. Entries are dated and never rewritten.
- **[Notes](/notes/)** is an evergreen library. One page per concept — [pre-training](/notes/pretraining/),
  [fine-tuning](/notes/fine-tuning/), [prefill](/notes/prefill/),
  [sequence packing](/notes/sequence-packing/) — revised as my understanding improves. Each page
  carries a "last reviewed" date so it is clear whether it has kept up.

The reasoning is that a project log and a reference page fail in opposite ways. A log that gets
edited silently becomes untrustworthy about what actually happened. A reference page that never gets
revised becomes a fossil. Keeping them in separate collections, with separate schemas, makes each
one honest.

## What comes next

The immediate work is data: defining the event schema, deciding what a token is, and building a
pipeline that can produce packed, masked training blocks at a useful rate. Notes on those pieces
will land in the library as they stabilise; progress and mistakes will land here.

If you want to follow along, the [RSS feed](/rss.xml) carries the log.
