---
title: 'TREASURE: The Visa Payment Foundation Model for High-Volume Transaction Understanding'
authors:
  [
    'Chin-Chia Michael Yeh',
    'Uday Singh Saini',
    'Xin Dai',
    'Xiran Fan',
    'Shubham Jain',
    'Yujie Fan',
    'Jiarui Sun',
    'Junpeng Wang',
    'Menghai Pan',
    'Yingtong Dou',
    'Yuzhong Chen',
    'Vineeth Rakesh',
    'Liang Wang',
    'Yan Zheng',
    'Mahashweta Das',
  ]
year: 2026
venue: 'KDD'
link: 'https://arxiv.org/abs/2511.19693'
kind: paper
date: 2026-11-17
summary: 'A 3-layer, 256-wide decoder over 6B Visa transactions; shared in-batch negatives make 100M-way categorical prediction affordable, with a 2.1× detection ratio claimed.'
status: read
tags: ['transactions', 'architecture', 'training']
draft: false
---

The surprising thing about TREASURE is how small it is. A payment network with over 300B annual
transactions trains a 3-layer, 256-wide causal decoder — no positional encodings, a 512-transaction
window — and reports that it beats production abnormal-behaviour models by 111% while its embeddings
lift a merchant recommender by 104%. The contribution is not depth. It is the interface: separating
static from dynamic attributes, and predicting categorical fields with cardinality up to 100M using a
shared pool of in-batch negatives instead of a full softmax.

## Method

A sample is one card's history: a static attribute vector and $t$ dynamic vectors, each mixing
log-scaled numerics with categorical indices. Two identical input modules (three layers each) encode
them, with weights shared across time steps for the dynamic path. The static representation is placed
first in the causal decoder, so every transaction representation can attend to it.

The decoder is three layers, four heads, width 256, with no positional encoding — order comes from
causal masking, and time gaps enter as a numerical attribute. Two heads read each hidden state: one
predicts the sixteen dynamic attributes of the *next* transaction, the other predicts two payment
network signals (response codes, system flags) of the *current* one. Network signals never appear as
inputs, which is correct: they are outcomes.

Numerical outputs are log-normal, trained on negative log-likelihood with both $\mu$ and $\sigma$
predicted. Low-cardinality categoricals (below 1,024) use cross-entropy. For the rest, the output
layer is one attribute-specific linear projection followed by a dot product with that attribute's own
embedding matrix. The loss is InfoNCE over a pool of negatives shared across every sample and time
step in the batch:

$$
\mathcal{L}_{\text{hcat}} = -\log \frac{e^{H_a \cdot E[y]}}{\sum_{i \in I} e^{H_a \cdot E[i]}},
\qquad I = \{y\} \cup \mathcal{N}_{\text{shared}}
$$

The point is memory, not modelling: with 1,024 negatives the authors keep the forward pass under 3GB
and the backward pass under 6GB, while independent sampling runs out of memory above 64 negatives per
positive. Losses are aggregated around the abnormal-behaviour flag, the primary task. Auxiliary terms
enter unweighted when their detached loss is already at or below the flag's, and are scaled down by
$\hat{\mathcal{L}}_{\text{abnormal}} / \hat{\mathcal{L}}_i$ when they lag:

$$
\mathcal{L} = \mathcal{L}_{\text{abnormal}} + \frac{1}{|\mathbf{L}|} \sum_{\mathcal{L}_i \in \mathbf{L}} \min\left(\mathcal{L}_i,\; \mathcal{L}_i \frac{\hat{\mathcal{L}}_{\text{abnormal}}}{\hat{\mathcal{L}}_i}\right)
$$

Training uses ~6B transactions from 30M cards spanning September 2020 to November 2022. The first 24
months are training, month 25 validation, month 26 test. AdamW at $10^{-4}$, batch 256, 20 epochs,
best checkpoint by validation. Sequences are capped at 512 transactions. Parameter count and compute
are not reported.

## Evidence

The headline comparison is against single-purpose models and alternative loss aggregations (Table 1).
TREASURE reaches RI 2.1171, about 111% above the deployed system; a detection-only model reaches
1.9606. Summing losses gives 1.8768 and equal weighting collapses to 0.1768 — far worse than the
incumbent. On next-transaction prediction the multi-purpose model also wins on absolute metrics:
sMAPE 0.5786 against 0.5850 for summation and 0.5893 for equal weighting, and merchant Prec@1 0.1421
against 0.1248 for the merchant-only baseline, 0.1306 for summation and 0.1235 for equal weighting.

Architecture comparison (Table 2) is consistent: GRU RI 1.3979, LSTM 1.4427, transformer 2.1171, with
merchant Prec@1 of 0.1172, 0.1103 and 0.1421. The transformer is better on every reported measure,
though this is one run per architecture.

The negative-sampling table is the one that admits an alternative reading (Table 3). With five
independent negatives per positive, merchant Prec@1 is 0.0600, city 0.1370, category 0.4324, country
0.5607. With 1,024 shared negatives, those become 0.1421, 0.1892, 0.4335 and 0.5634. Low-cardinality
attributes barely move, as expected; the merchant gain is 2.4×.

In the embedding case study, a two-tower recommender is built for next-merchant prediction, with one
tower from TREASURE user embeddings and one from merchant embeddings, against embeddings trained
supervised on the task. The reported average gain is 104% across HR@K and NDCG@K, shown only as a
figure. Scaling is also figures: data scaling trends up with an extrapolated point at one trillion
transactions, model scaling saturates, and both are run in 16-bit precision.

## Limits and failure modes

Almost nothing in the headline is checkable. RI is a ratio to an unnamed deployed system, and the
abnormal-behaviour metric is in-house and undisclosed, so a reader cannot recover an effect size, a
base rate, or even the direction of the comparison if the baseline were retrained. The equal-weighting
row shows RI at 0.1768: a ratio that low is possible only because the metric is proprietary, and it is
not evidence about model quality in any absolute sense. The same caution applies to the 104% figure,
which appears as 90% in the introduction and never as an absolute HR@K.

There is no variance anywhere: no seeds, no error bars, no repeated runs, one test month. Parameter
count, FLOPs, GPU hours and latency are not reported, despite a claim that inference is operationally
feasible in real time. Data construction is described in one sentence: how the 6B transactions were
sampled from the 30M cards, what was filtered, and how duplicates or reversals were handled are all
absent. Attribute names are withheld, so the sixteen dynamic fields and two network signals cannot be
identified.

The first claimed capability — the static/dynamic input split — is never ablated. Neither is the
absence of positional encoding, the log-normal head, the 512 cap, nor the tied output embeddings. The
paper's three ablation tables vary loss aggregation, RNN versus transformer, and negative sampling.
The negative-sampling comparison also confounds pool size with sharing: 5 negatives against 1,024,
where the sharing mechanism only becomes necessary at the larger pool, so the merchant gain is mostly
"more negatives", as the authors' own memory figure implies.

The recommender case study is not holdout-clean. Its data comes from after September 2022, but
pretraining runs through November 2022, so users and merchants from the test period were in the
pretraining stream; only the specific user-merchant pairs are claimed to be new. The supervised
baseline is also trained on the case-study split alone, which is a data and compute mismatch, not just
a representation comparison. And despite the abstract's phrasing, the model is not in production: the
text says offline results are a milestone on the way to full deployment.

Scope: one payment network, cards rather than customers, no graph or cross-card modelling (left to
future work), no released code or weights.

## What this changes

Predicting a 100M-way categorical is a retrieval problem, not a softmax problem. One attribute-specific
projection plus a tied embedding matrix, with negatives shared across the batch, turns an intractable
output layer into a 6GB backward pass; that recipe transfers to any high-cardinality field.

Auxiliary losses should be scaled against the primary task rather than summed. The rule here — a
detached ratio that only ever downweights lagging tasks — is one line of code and beat both summation
and equal weighting on every reported metric, including a collapse to 0.18 under equal weights.

Ratio-only reporting is the bottleneck. The most useful numbers in this paper are the absolute ones —
merchant Prec@1 of 0.06 versus 0.14 — because another team can compare against them. A 2.1× ratio
against an invisible incumbent, with no seed variance, cannot be acted on or contested.

## My take
