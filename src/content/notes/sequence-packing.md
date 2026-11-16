---
title: 'Sequence packing'
summary: 'Concatenating many short examples into fixed-length blocks so training batches contain no padding and no wasted compute.'
tags: ['training', 'systems']
created: 2026-11-16
updated: 2026-11-16
order: 40
draft: false
---

Training data rarely arrives in uniform lengths. The naive fix is to pad every batch to the longest
sequence in it and mask the padding out of the loss. That is simple, correct, and wasteful: the
padded positions still occupy compute and memory while contributing nothing.

Sequence packing removes the waste. Many examples are concatenated into a single fixed-length
block, so every position in the batch carries a real token.

## The mechanics

Given a target block length $L$ and examples $x^{(1)}, \dots, x^{(k)}$ with lengths $\ell_j$, pack
them greedily (or bin-pack them) into blocks of length $L$, inserting separator tokens only if the
task needs explicit boundaries.

Two things must then be handled explicitly:

- **Attention isolation.** A token must not attend to tokens from a previous example in the same
  block. This is enforced with a block-diagonal attention mask, or with document-aware attention
  kernels.
- **Position ids.** Positions usually restart at each document boundary, otherwise the model sees
  artificial long-range offsets between unrelated examples.

Loss masking matters too. If each example contributes a different number of supervised tokens,
weighting every token equally lets long examples dominate the gradient.

## Trade-offs

- Gained throughput scales with how much padding the naive batching wasted; with highly variable
  lengths the gain is large, with uniform lengths it is near zero.
- Incorrect masking silently leaks information across documents. The model still trains, and the
  loss still falls — the contamination shows up as degraded quality, not as an error.
- Packing interacts with curriculum and shuffling: examples can no longer be reordered freely
  without repacking.

## Related

- [Pre-training](/notes/pretraining/)
- [Fine-tuning](/notes/fine-tuning/)
- [Prefill](/notes/prefill/)
