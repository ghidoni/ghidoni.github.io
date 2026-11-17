---
title: 'EventGPT: Next-Event Pretraining on Banking Customer Histories'
authors: ['Denis Burakov']
year: 2026
venue: 'arXiv'
link: 'https://arxiv.org/abs/2611.03302'
kind: preprint
date: 2026-11-17
summary: 'A 23M-parameter hierarchical causal decoder trained on public MBD-mini scores event targets zero-shot, but frozen embeddings stay below a token-count table and only help as an extra ranker.'
status: read
tags: ['transactions', 'architecture', 'training']
draft: false
---

Next-event pretraining promises two things: scores for future events without labels, and one customer
embedding that many supervised tasks can share. EventGPT is a 22.9M-parameter hierarchical decoder
trained on public MBD-mini, and the paper tests both promises against the same baselines on the same
rows. The negative results matter as much as the positive ones: the zero-shot scorer works, the frozen
embedding loses to a schema-free count of the 200 most frequent tokens.

## Method

An event is a short token run — `[EVT]`, name, time-gap bucket, fields as key/value tokens — about
eight tokens on MBD-mini. Four fields that never change within a client are hoisted into one profile
event, shrinking transactions from 13 to 9 tokens and the stream from 454M to 332M. Gaps become `floor(8 ln(1 + Δs/8))` capped at 140 buckets, amounts 21 quantile bins, and the
vocabulary has 12,828 tokens.

Three stages, all pre-norm transformer blocks:

- **Event encoder**, two layers, bidirectional inside one event, mean-pooling its tokens into $e_i$.
- **History decoder**, six causal layers over event vectors only, one state $h_i$ per event.
- **Token decoder**, two layers predicting event $i$'s tokens from their embeddings, an in-event
  position and $h_{i-1}$; output weights tied to the input embedding.

Only the history decoder needs a position, and it takes one from elapsed time rather than event order:

$$
p_i = 64 \ln\!\left(1 + \frac{\Delta t_i}{60}\right)
$$

The rotary distance between two events is a log ratio of elapsed times, so a year-long silence stays
visible with no events in between. The customer embedding is the last history state, after a synthetic
*now* event whose gap runs to the as-of date.

Cost is the argument: four of ten layers touch tokens, so a token passes about 4.75 layers instead of
10, and event attention runs over roughly $n/8$ states. Training is 20,000 steps of 16 × 2,048 tokens
— 655M tokens, 1.5 hours on one L4 at 118k tokens/s, against 3.9 hours for a flat decoder of the same
size. The final configuration adds aligned windows and query-key normalisation (2.0 hours); results are
two-seed means unless stated.

## Evidence

MBD-mini holds 100,224 clients in five folds, fold 0 held out from pretraining and vocabulary
fitting. Rows are client-months, February 2022 to January 2023, twelve per client, leaving 242,604
scored rows; the four product targets have prevalence 0.44%, 0.05%, 0.38% and 0.26%. ROC-AUC and
PR-AUC use DeLong standard errors clustered by client, with paired comparisons on the same rows.

The frozen embedding reaches an official mean of 0.787 on aligned windows. CatBoost on 114 engineered
features scores 0.816; a schema-free count of the 200 most frequent tokens over the full history scores
0.803, the same counts inside a 2,048-token window 0.777, and a same-size flat decoder 0.774 with its
last token, 0.777 with recency pooling. Late fusion of four profile fields lifts the embedding to
0.800; adding full-history token counts brings the gap to 0.006 and 0.009 on the two seeds, neither
significant.

The zero-shot results are stronger. Read straight from the next-event distribution, five hand-picked
transaction kinds reach ROC-AUC 0.79–0.92 with no labels. A Markov chain over event kinds multiplied
by the client's 30-day transaction count reaches 0.79–0.88, so EventGPT wins by more than two standard
errors on two of five targets and ties on three. The larger test is more convincing: over all 74 kinds
with at least 50 test positives it is higher on 48, lower on 7, level on 19, median gap 0.042, median
ROC-AUC 0.825.

Against labels, CatBoost needs 10,000 to 300,000 randomly drawn client-months to match the zero-shot
score on four kinds and stays below it at 300,000 on the fifth (0.902 against 0.918). With 50–400
labelled positives it can match on all five. That is the paper's best result: a few hundred labels of
head start.

Rank-averaging the embedding with the engineered features adds 0.014 on each seed and 0.014–0.018
across five folds (0.824 against 0.808). The control matters: the same ensemble built from profile
fields and token counts without EventGPT adds 0.001–0.008, mean 0.004, so EventGPT's own contribution
is about 0.012. Rollouts of 16 sampled months beat the one-step score by 0.010–0.036, but as a forecast
the model is ordinary — 0.459 overlap with the real month against 0.545 for repeating the previous one.

Ablations are flat. Transactions only raises the official mean from 0.774 to 0.793 and churn from
0.934 to 0.950. Temporal RoPE scores 0.781 against 0.778 for ordinal positions, less than seed
variation. Dropping the loss on gap, amount and geohash tokens changes nothing, 4,096- and 8,192-token
windows do not help (0.780 against 0.788), and fine-tuning leaves the mean at 0.788.

## Limits and failure modes

The zero-shot score is entangled with activity: its log correlates 0.39–0.49 with the log of recent
transactions, scores fall to 0.72–0.89 without geolocation events, and multiplying by the 30-day
transaction count raises every target. The model mostly learns which clients are active and what they
tend to do next, not when a specific kind begins.

The five targets were hand-picked and the selection script is lost, so the choice cannot be
reconstructed; two kinds that outrank two selected ones were not used. The 74-kind sweep is
the evidence that survives, and it is the number to quote.

The embedding result contradicts the framing. If 605 token-count features with no schema score 0.803
where the pretrained state scores 0.787, this dataset does not show that representation learning
replaces feature engineering. It shows a second ranker with a small, repeatable ensemble gain.
Fine-tuning does not fix it, and the embedding as a CatBoost feature scores 0.700.

Power is thin where it matters. Standard errors are test-fold only, excluding training and
initialisation variance. Two seeds differ by up to 0.018–0.022 across folds, larger than the claimed
effects of temporal RoPE (+0.003) and of query-key normalisation or the per-kind event encoder (+0.005
each, one seed).

Two artifacts are worth flagging. January 2023 has no transactions, so 99.1% of its rows are
churn and a model can read the month from tenure; the paper excludes the month after finding this.
Aligned windows also encode tenure through the first gap token, and hence the calendar time of the
as-of date, which the author notes may not hold in production. The overlap between pretraining and
test months is tested directly: pretraining before February 2022 with 54% of tokens costs 0.004–0.006
on the official mean.

Scope is one public dataset with mostly one transaction layout, no dialogues, one fine-tuning seed, no
model above 140M parameters, and no full-MBD run. The shared-vocabulary schemes proposed for
cross-bank transfer are untested, and token ids remain schema-specific.

## What this changes

Cheap baselines should be mandatory in this literature. A flat decoder and a token-count table cost
hours to fit and both erase most of the claimed gain here. That is why this paper is more informative
than the vendor reports it cites.

"Label-free" needs an activity-matched null: a scorer whose log correlates 0.4–0.5 with recent
transaction counts will look good on any monthly-occurrence label, so the Markov-times-activity
baseline should travel with the claim.

Open weights on public data change what a banking foundation model paper has to prove: vocabularies
are per-institution, so the reusable artifact is the recipe and evaluation protocol, not the
checkpoint. Both are now checkable by anyone.

## My take

<!-- take:pending -->

> _Not written yet. Replace this block with your own opinion — what convinced you, what you doubt,
> and whether it changes how you build._
