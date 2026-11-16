---
title: 'Prefill'
summary: 'The parallel forward pass over the prompt that populates the KV cache before token-by-token decoding begins.'
tags: ['inference', 'systems']
created: 2026-11-16
updated: 2026-11-16
order: 30
draft: false
---

Inference for an autoregressive model splits into two phases with very different performance
characteristics. **Prefill** processes the entire prompt in one forward pass; **decode** then
generates one token at a time, each step attending over everything that came before.

## Why the split matters

During prefill, all prompt tokens are known, so their query, key, and value projections can be
computed in parallel as a single matrix multiplication. The work is large, dense, and
**compute-bound**: GPUs stay busy and arithmetic units are the bottleneck.

During decode, only one new token is processed per step. The matrices are the same size, but the
batch dimension is effectively one, so the operation becomes **memory-bandwidth-bound** — the GPU
spends most of its time streaming weights and the KV cache rather than doing arithmetic.

This is why time-to-first-token is dominated by prefill, while inter-token latency is dominated by
decode. Optimising one does not optimise the other; the standard knobs are different.

## The KV cache

Prefill's main side effect is the KV cache: for every layer, the keys and values of every prompt
token are stored so decode does not have to recompute them. Its size grows linearly with context
length:

$$
\text{bytes} \approx 2 \times n_{\text{layers}} \times n_{\text{kv-heads}} \times d_{\text{head}} \times L \times \text{bytes per element}
$$

At long context this cache, not the model weights, becomes the limiting factor on batch size.
Techniques that reduce it — grouped-query attention, quantised caches, paged allocation — are what
make long prompts affordable.

## Practical consequences

- A long system prompt is paid for once per request, not once per token, but it still costs
  prefill compute and cache memory.
- Prefix caching reuses a prefill across requests that share a prefix, which is why stable prompt
  prefixes are cheaper than shuffled ones.
- Prefill and decode can be scheduled on separate workers, since their bottlenecks differ.

## Related

- [Sequence packing](/notes/sequence-packing/)
- [Pre-training](/notes/pretraining/)
