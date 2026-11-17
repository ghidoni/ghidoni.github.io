---
title: '<source title, verbatim>'
authors: ['First Last', 'First Last']
year: 2025
venue: 'NeurIPS'
link: 'https://example.com/paper'
kind: paper
date: 2026-11-17
summary: '<the technical takeaway in one sentence, under 30 words>'
status: read
tags: ['tag-a', 'tag-b']
draft: false
---

<The claim and why it is non-obvious. 2–4 sentences, no preamble, no background.>

## Method

<What was actually changed, where it enters the computation, and what it costs. Define symbols
once. One display equation is usually enough:

$$
\mathcal{L}(\theta) = -\frac{1}{N}\sum_{i=1}^{N}\log p_\theta(x_i \mid x_{<i})
$$

State the setup that matters for interpreting the results: data, model size, compute — or write
"not reported".

## Evidence

<Datasets, baselines (compute-matched? tuned?), ablations, and the numbers that matter. Attribute
results: "the paper reports…". Separate what was measured from what it is claimed to mean. Flag
missing seeds, error bars, or significance tests.>

## Limits and failure modes

<Assumptions the result depends on, regimes not tested, reproduction gaps (code, data,
hyperparameters), and anything the abstract oversells. "Not reported" is a valid and useful entry.>

## What this changes

<If the paper is right, what shifts for foundation models or deep learning generally — training,
serving, evaluation, tooling. At most three points. No tie-in to a specific project; if nothing
generalises, say so in a sentence and stop.>

## My take

<!-- take:pending -->

> _Not written yet. Replace this block with your own opinion — what convinced you, what you doubt,
> and whether it changes how you build._
