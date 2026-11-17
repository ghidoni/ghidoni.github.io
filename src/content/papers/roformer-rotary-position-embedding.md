---
title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding'
authors:
  [
    'Jianlin Su',
    'Yu Lu',
    'Shengfeng Pan',
    'Ahmed Murtadha',
    'Bo Wen',
    'Yunfeng Liu',
  ]
year: 2021
venue: 'arXiv'
link: 'https://arxiv.org/abs/2104.09864'
kind: preprint
date: 2026-11-17
summary: 'Position is injected by rotating queries and keys, so attention depends only on the offset between tokens — and costs nothing extra at inference.'
status: studied
tags: ['architecture', 'position-encoding']
draft: false
---

The claim is narrow and, in hindsight, obviously right: you do not need a learned position
embedding, and you do not need to add anything to the token embeddings at all. You can encode
position by rotating the query and key vectors, which makes the attention score a function of the
*relative* offset between two positions.

That property is what makes the paper worth reading even now. Most position schemes give you
absolute position and hope the model learns to subtract; RoPE builds the subtraction into the
geometry.

## How it works

For a pair of dimensions, position $m$ is encoded as a rotation by angle $m\theta$:

$$
R_{\theta, m} =
\begin{pmatrix}
\cos m\theta & -\sin m\theta \\
\sin m\theta & \cos m\theta
\end{pmatrix}
$$

The query and key at positions $m$ and $n$ are rotated before the dot product:

$$
q_m = R_{\theta,m} W_q x_m, \qquad k_n = R_{\theta,n} W_k x_n
$$

Because rotations compose, the score becomes

$$
q_m^\top k_n = x_m^\top W_q^\top R_{\theta,\,n-m} W_k x_n
$$

Only the difference $n - m$ survives. Nothing in the score depends on where the pair sits in the
sequence, which is exactly the invariance you want from a relative scheme — and it comes with no
learned parameters.

In practice the $d$ dimensions are split into $d/2$ pairs, each rotating at its own frequency:

$$
\theta_i = 10000^{-2(i-1)/d}, \qquad i = 1, \dots, d/2
$$

Fast pairs encode local order; slow pairs carry coarse position.

## Why it held up

- **No parameters, no extra memory.** The rotation is applied to $q$ and $k$ on the fly; the KV
  cache stores the same number of bytes as before.
- **Relative by construction.** The model gets offset information without a separate relative
  bias table.
- **Long-term decay.** The dot product of two rotated vectors tends to shrink as the offset grows,
  which is a useful inductive bias for language: nearby tokens usually matter more.
- **Composability.** Rotation is a linear operation, which is why RoPE survives in linear-attention
  variants where additive position encodings do not.

The last point explains the adoption more than the benchmark numbers do. RoPE is now the default in
most open decoder-only models, and it is the reason "just extend the context" is a configuration
change rather than an architectural one.

## What to be careful about

The decay property is a tendency, not a guarantee, and it does not automatically give you a longer
usable context. Extending a model trained at 4k to 32k requires changing the frequencies —
interpolation, NTK-aware scaling, YaRN, and friends — and each of those is a different trade-off
between local precision and long-range recall. Treat "RoPE supports long context" as a starting
point for measurement, not a result.

There is also an implementation trap: the rotation can be applied to adjacent dimension pairs
(interleaved) or to the first and second halves of the vector (split-half). The two are equivalent
only if the weights are permuted consistently. Loading a checkpoint trained with one convention into
code that assumes the other produces a model that runs, trains, and quietly underperforms.

## Related

- [Prefill](/notes/prefill/) — where the position-dependent KV cache actually gets built.
- [Sequence packing](/notes/sequence-packing/) — position ids must be handled per document when
  several sequences share a block.

## My take

What convinced me is not the benchmark table but the shape of the argument: if position is a
relative quantity, encoding it as an absolute vector forces the network to learn subtraction. RoPE
removes that burden, and doing it with no extra parameters makes the improvement almost free. That
combination is rare.

What I do not trust is the leap from "relative by construction" to "handles long context". The decay
property is a statement about the dot product, not about what the model learned to attend to. For
transaction sequences, where the useful horizon is set by customer behaviour rather than by token
distance, I would expect the effective context to be shorter than the nominal one — and I would want
to measure it rather than assume it.

Practically: copy the convention, not the paper. Whichever rotation layout the base checkpoint was
trained with is the one to use, and that is an empirical detail the paper does not settle for me.

