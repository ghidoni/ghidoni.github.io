---
title: 'PRAGMA: Revolut Foundation Model'
authors:
  [
    'Maxim Ostroukhov',
    'Ruslan Mikhailov',
    'Vladimir Iashin',
    'Artem Sokolov',
    'Andrei Akshonov',
    'Vitaly Protasov',
    'Andrey Goncharov',
    'Dmitrii Beloborodov',
    'Vince Mullin',
    'Roman Y. Enzmann',
    'Georgios Kolovos',
    'Jason Renders',
    'Pavel Nesterov',
    'Anton Repushko',
  ]
year: 2026
venue: 'arXiv'
link: 'https://arxiv.org/abs/2604.08649'
kind: preprint
date: 2026-11-17
summary: 'A BERT-style encoder over key–value–time tokenised banking events, pre-trained on 207B tokens; relative gains across six tasks and a −47% failure on AML.'
status: read
tags: ['transactions', 'architecture', 'training']
draft: false
---

Bank event logs are the largest proprietary corpus most fintechs hold and the hardest to transfer
between tasks, because serialising them as text inflates sequence length and splits amounts into
digit fragments that lose magnitude. PRAGMA is Revolut's move on that problem: a bidirectional
encoder over typed key/value/time tokens, pre-trained with masked modelling on 207B tokens drawn
from 24B events over 26M records, then adapted with a linear probe or LoRA. The novel part is not
the Transformer — it is the tokenisation and the second encoder branch for profile state. Every
result in the paper is relative, which caps how much can be concluded from it.

## Method

A record is an ordered event history plus profile state; both reduce to keys, values, and a temporal
coordinate. Keys cover a vocabulary of roughly 60 tokens; values cover roughly 28k. Numerical values
are mapped into percentile buckets learned on training data, with a dedicated bucket for zero;
categorical values become one token; textual values go through a BPE vocabulary with `[UNK]` for rare
fragments. Keys and values share one embedding table, and positional embeddings index values *within*
a field rather than across fields:

$$
x = \mathrm{PosEmb}\big(E(k) + E(v)\big)
$$

Time is encoded twice. Log-seconds to the reference event, $8\ln(1 + t/8)$, is fed through RoPE —
in the profile encoder relative to life-long events, in the history encoder relative to the most
recent event. Calendar features for hour, weekday and day-of-month use fixed sine/cosine periods
and are projected by two MLP layers, then added to each event embedding.

Three encoders stack: profile state (bidirectional, RoPE on time), event (each event encoded
independently, `[EVT]` prepended, packed events attended with a variable-length kernel), and history
(concatenating `[USR]` with event embeddings, bidirectional, RoPE on time). Sizes are 10M / 100M / 1B
with widths 192 / 512 / 1024 and depth split 1/5/2, 3/16/6, 9/45/18 across the three encoders.
Pre-training is BERT-style MLM: 15% token masking, plus 10% event-level and 10% key-level masking.
The masked-token logits concatenate the event-encoder output, the history `[EVT]` vector and the
history `[USR]` vector, are projected back to width, and are matched against the embedding table.

Adaptation is a linear probe on frozen `[USR]`, last `[EVT]`, or both (standard-scaled, L-BFGS), or
LoRA (rank 8, QKV and MLP projections, 2–4% of weights). Infra: LMDB index, Parquet shards by event
count, dynamic batching to a token budget, packing with a varlen attention kernel. The 10M and 100M models trained on 16 H100s (the small one in about two days), the 1B on 32
H100s for roughly two weeks, bf16, Muon plus AdamW.

## Evidence

Pre-training data is 26M records from 111 countries, 24B events, 207B tokens, restricted to a
25-month window (2023–2025). Truncation keeps the most recent 6,500 events per record, 24 tokens per
event, 200 profile tokens. All downstream numbers are $(x/\text{baseline} - 1)\%$ against unnamed
task-specific baselines; absolute metrics are withheld.

Against those baselines, the 1B model reports +130.2% PR-AUC and +12.4% ROC-AUC on credit scoring,
+79.4% / +20.4% on communication engagement, +16.7% precision and +64.7% recall on external fraud,
+40.5% mAP on product recommendation, +5.6% F1 on recurrent transactions, and +1.8% / +2.6% on
lifetime value. The 10M model is often close: +5.2% F1 on recurrent transactions and negative PR-AUC
and ROC-AUC on lifetime value (−1.2%, −0.8%). Scale helps most on credit scoring and least on tasks
where the baseline already fits the signal.

The cleanest result is the one that holds architecture and data fixed: LoRA on the pre-trained 100M
backbone versus the same model trained from scratch. The gap is +18.6% PR-AUC on communication
engagement, +13.0% on credit scoring, +10.3% mAP on product recommendation, but only +0.6% F1 on
recurrent transactions and +0.4% / +0.3% on lifetime value. Pre-training pays exactly where the
downstream dataset is small.

LoRA also beats frozen embeddings, by +68.1% mAP on product recommendation and +54.1% PR-AUC on
communication engagement at the 1B scale, and barely on recurrent transactions (+2.3% F1). Adding the
profile-state branch to the 10M model buys +46.8% precision and +85.6% recall on fraud and +31.8%
PR-AUC on credit scoring, but costs 3.0% PR-AUC on communication engagement.

Two further numbers are worth keeping: dropping events inside the 99.9th percentile of event-bus
propagation delay moves fraud metrics by at most 0.2% and credit by at most 0.9%; and an optional
frozen text encoder (Nemotron-1B-v2, one projection layer, MSE against its embedding) buys +16.1%
PR-AUC on credit scoring at the cost of −6.4% mAP on product recommendation and 18% more training
time.

## Limits and failure modes

The reporting convention is the binding constraint. With relative-only deltas, a +130% PR-AUC and a
+12.4% ROC-AUC on the same task cannot both describe a dramatic improvement — they describe a
baseline whose positive rate is low and whose PR-AUC is small. Nothing in the paper lets a reader
convert those numbers into a decision-relevant effect size, and no absolute figures appear anywhere,
including for the enclosed uplift experiment (+163.7% AUUC, +10.8% SNIPS).

There are no seeds, confidence intervals, or significance tests, and the tables read as single runs.
The baselines are called "task-specific" without naming the model class, the feature set, the tuning
budget, or the downstream dataset sizes; the task descriptions name metrics but not row counts. The
middle block of the main results table compares LoRA against probes whose own scores are omitted
("–"), so "LoRA beats the probe by 68% mAP" is compatible with the probe being far worse than the
baseline. The best-supported comparisons in the paper are internally referenced ones — scratch versus
pre-trained, full versus event-only — not the headline deltas.

Most notably, the tokenisation is never ablated. Percentile bucketing versus raw log-values, RoPE on
log-seconds versus a learned time embedding, the calendar branch, and the shared key/value table are
the paper's actual contribution, and none of them is isolated. Profile state and the text encoder are
the only architectural variables tested.

The AML result is the useful negative: −47.1% F0.5 against a baseline with cross-record network
features, attributed to the model scoring each record in isolation. That is consistent with the
architecture rather than a tuning failure, and it bounds where this class of model applies. Separately,
the staleness test covers delivery delay, not concept drift over the 25-month window. No code, weights, or hyperparameter appendix is provided, and the claim to the largest
published encoder backbone in consumer banking is not something a reader can check.

## What this changes

Typed-record tokenisation is now the obvious interface for event logs, and PRAGMA shows it scales to
1B parameters without text serialisation: one shared embedding table for keys and values, positions
indexed within a field, time as RoPE on log-seconds, calendar as additive features. The cost is a
~28k value vocabulary, not sequence length.

The second lesson is where pre-training earns its keep. The scratch comparison gains +18.6% PR-AUC on
the task with very few labels and +0.4% on the task with plenty, which argues for building foundation
models against label scarcity rather than against data teams that already have scale.

The third is a reporting norm: a paper that publishes only relative deltas against private baselines
cannot be evaluated, only believed. The AML table is the one result a sceptic can act on, and the one
the authors would rather not have printed.

## My take

<!-- take:pending -->

> _Not written yet. Replace this block with your own opinion — what convinced you, what you doubt,
> and whether it changes how you build._
