---
title: 'SOHET: Sequence Of Heterogeneous Events Transformer with Self-Supervised Pre-Training'
authors: ['Kees Jan de Vries', 'Mustafa Radha', 'Mathijs de Jong']
year: 2026
venue: 'arXiv'
link: 'https://arxiv.org/abs/2606.21356'
kind: preprint
date: 2026-11-17
summary: 'Per-event-type tabular encoders feeding one sequence model; beats causal heterogeneous baselines by 5.8% AP, but with 7× their parameters and no architectural ablation.'
status: read
tags: ['transactions', 'architecture', 'training']
draft: false
---

The architecture is the obvious one, which is why the paper's real question is whether it pays.
SOHET encodes each event with a tabular encoder specific to its type, adds time and type embeddings,
and runs a single sequence model over the result — bidirectional for session classification, causal
for per-event fraud scoring. On a Booking.com fraud task with 17 event types it reaches 0.452 AP
supervised and 0.464 after pre-training, against 0.427 for the strongest baseline. The appendix is
where the comparison gets interesting: SOHET has 79M parameters, and the baselines it is matched
against have 5–11M.

## Method

An event is a timestamp $\tau_t$, a type $s_t$, and a feature vector whose schema depends on the type.
Each event becomes the sum of three encodings:

$$
\mathbf{h}_t = \mathbf{h}^{\text{time}}_t + \mathbf{h}^{\text{type}}_t + \mathbf{h}^{\text{features}}_t
$$

Time enters twice — relative to the previous event and cumulative from the sequence start — as
concatenated piecewise linear embeddings with 14 bins whose edges run from one second to 520 weeks. Feature
encoding uses one FT-Transformer per event type, and its `[CLS]` token is what maps heterogeneous
schemas into a shared space. A single sequence model then runs over the encodings: a ModernBERT
encoder when the whole sequence is available, a causal ModernBERT decoder when predictions must be
updated event by event.

The fraud setting is the causal one. Hidden width is 320, with four FT-Transformer blocks and four
ModernBERT layers, 16 heads each, 79M trainable parameters, sequences capped at 1,024 events, batch
128, AdamW at $10^{-4}$ on a constant schedule, early stopping after 20 epochs. Compute, corpus size
and event counts are not reported.

Three pre-training objectives, summed with equal weights, all predicting forward from $\mathbf{h}'_t$:
next event type over $|\mathcal{S}|+1$ classes (the extra class is end-of-sequence); the next time
delta, regressed in log days for both relative and cumulative gaps; and a contrastive objective on
the next event's *latent* tabular encoding rather than its raw fields. A one-layer projection head
maps the current state to a query, and the positives are the feature encodings of the next $M=10$
events:

$$
\mathrm{sim}_{t,k} = \frac{\mathrm{Proj}(\mathbf{h}'_t)^\top \mathbf{h}^{\text{features}}_{t+k}}{\|\mathrm{Proj}(\mathbf{h}'_t)\|\,\|\mathbf{h}^{\text{features}}_{t+k}\|}
$$

Similarities are scaled by a learned log-temperature, softmaxed, and trained with cross-entropy
targeting $k=1$. This is the piece borrowed from JEPA, with contrastive negatives standing in for the
asymmetric architecture that usually prevents collapse.

## Evidence

The fraud dataset is a year of accommodation-supplier timelines, split by time, with the training
portion divided 80/20 into train and validation. Five seeds are reported, with standard deviations in
the main table. SOHET scores 0.452 ± 0.005 AP supervised; FlexTPP 0.414 ± 0.008, NAPPT 0.427 ± 0.003,
CIPPT 0.406 ± 0.004. With pre-training and fine-tuning, SOHET reaches 0.464 ± 0.007, a 2.6% relative
gain, and peak validation AP 2.4× sooner. Pre-trained FlexTPP reaches 0.440.

Table 1 looks like a clean sweep, and with five seeds the ordering is not noise. The budgets are not
comparable, though. SOHET: 79M parameters, batch 128, learning rate $10^{-4}$. FlexTPP: 11M, batch 32,
$3\times10^{-5}$ selected by grid search. NAPPT: 10M, batch 32. CIPPT: 5M, batch 32 and four blocks
against everyone else's eight, which the authors call a known limitation. Depth and width were matched;
capacity was not.

Two details in the same table cut against the story. Pre-training gains SOHET 2.6% but gains FlexTPP
6.3%, so the architecture advantage is not obviously in the pre-training. And the text says
pre-training degrades both NAPPT and CIPPT, while the table shows CIPPT improving from 0.406 to 0.414;
NAPPT is the only model that actually falls (0.427 to 0.417). The stated cause is gradient-norm
divergence in the generative losses, which is a tuning failure on a baseline, not a property of the
method.

The EBES benchmark supports a narrower claim. SOHET matches or exceeds the published best on 6 of 8
datasets, but five of those six are ties inside 0.005: Taobao +0.002, BPI17 +0.005, Retail +0.002, Age
0.000, ElectricDevices +0.003. The real result is Pendulum, +0.061 absolute (0.838 against 0.777) — a
dataset where the EBES authors found time to matter most, consistent with the two time encodings. The
clear loss is PhysioNet2012, 0.818 against 0.846. Baseline numbers were reused from the EBES paper
without variance, while SOHET got 50 Optuna trials per dataset and five seeds; 15% of training was
held out for tuning.

## Limits and failure modes

The authors state it plainly: no ablation studies. The event-type-specific encoders, the dual time
encoding, the type embedding, and the contrastive objective are never isolated, so the 5.8% over
NAPPT could be any of them, or the parameter count. Given the 7× capacity gap, the default hypothesis
should be capacity until an ablation says otherwise — the paper's own case for event-specific encoders
rests on "more expressive", which is the thing to test.

Dataset size is missing where it matters most. There is no count of sequences, suppliers, events or
fraud positives, and AP depends on the positive rate: 0.452 could be strong or mediocre. The label
definition and prediction horizon are also vague — "sequences with labelled transactions" — so the
causal setup cannot be reproduced even in outline. No GPU count, no training hours, no code or weights.

Generalisation is untested in the direction that would matter: the causal heterogeneous claim rests
on one proprietary dataset, and the authors say a public heterogeneous benchmark is future work. The
EBES tasks are homogeneous and bidirectional, so they validate the sequence model and the time
encoding, not the per-type encoders that are the paper's main contribution. MIMIC-III and MBD were
excluded from EBES for access and compute reasons, which removes the two datasets closest to the
setting.

The pre-training recipe has its own fragility. Masked and generative objectives diverged on two
baselines at this scale, SOHET's own gain is small relative to FlexTPP's, and the contrastive term
needs a projection head, a temperature, and $M$ positives, none of which are ablated. The reported
"2.4× faster convergence" is measured from validation AP history with no curve or definition of what
counts as convergence.

## What this changes

Heterogeneous event models need capacity-matched baselines. Matching width and depth is not matching
compute, and per-type encoders are exactly the kind of module that hides parameters. Report parameter
counts in the main table, not the appendix, and train baselines at the same batch size and learning
rate.

Predicting the next event's latent encoding, not its fields, is a useful third objective when a schema
has dozens of heterogeneous fields and field-level reconstruction is unstable. The JEPA framing plus
contrastive negatives over future events is the cheapest version of it I have seen, and it is worth
trying before a generative head.

Benchmark tables should stop counting ties as wins. "Matches or exceeds on 6 of 8" covers five
differences under 0.005; the honest sentence is one clear win, one clear loss, six ties. That is still
a good result for a single architecture across domains.

## My take

