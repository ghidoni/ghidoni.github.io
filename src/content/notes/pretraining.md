---
title: 'Pre-training'
summary: 'The self-supervised stage where a model learns general structure from raw data, before any task-specific tuning.'
tags: ['training', 'foundations']
created: 2026-11-16
updated: 2026-11-16
order: 10
draft: false
---

Pre-training is the first and most expensive stage of building a foundation model. The model is
trained on a large, unlabelled corpus with a self-supervised objective: the labels are generated
from the data itself, so no human annotation is required. Everything that comes later — instruction
tuning, preference optimisation, task-specific heads — starts from the representations learned here.

## The objective

For a decoder-only language model the objective is next-token prediction, minimising the
cross-entropy between the model distribution and the data:

$$
\mathcal{L}(\theta) = -\frac{1}{N} \sum_{i=1}^{N} \log p_\theta\left(x_i \mid x_{<i}\right)
$$

Every token in the corpus contributes a training signal, which is why pre-training scales with raw
data volume rather than with curated labels. The model is never asked to predict a "task"; it is
asked to predict what comes next, and downstream capabilities emerge from that pressure.

## What pre-training buys you

- **General representations.** Token and sequence embeddings that transfer to tasks with far less
  data than training from scratch would need.
- **A prior over the domain.** For a domain-specific model, pre-training on in-domain sequences
  teaches the vocabulary, regularities, and long-range structure of that domain.
- **A starting point.** Fine-tuning from a pre-trained checkpoint converges faster and generalises
  better than fine-tuning from random initialisation.

## What it does not give you

A pre-trained model is a next-token predictor, not an assistant. It has no notion of following
instructions, refusing requests, or producing calibrated outputs. It also inherits the biases and
gaps of its corpus, and it is expensive to re-run: compute, data pipeline, and evaluation all have
to be budgeted before the first token is seen.

## Related

- [Fine-tuning](/notes/fine-tuning/) — what happens after pre-training.
- [Sequence packing](/notes/sequence-packing/) — how batches are built for this stage.
- [Prefill](/notes/prefill/) — how a trained model is actually run.
