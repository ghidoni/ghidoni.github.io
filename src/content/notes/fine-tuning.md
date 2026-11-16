---
title: 'Fine-tuning'
summary: 'Adapting a pre-trained model to a narrower distribution, task, or behaviour with additional supervised training.'
tags: ['training', 'adaptation']
created: 2026-11-16
updated: 2026-11-16
order: 20
draft: false
---

Fine-tuning continues training a pre-trained model on a smaller, more targeted dataset. The
distinction from [pre-training](/notes/pretraining/) is one of purpose and scale: pre-training
learns general structure, fine-tuning reshapes that structure toward a specific behaviour or
distribution.

## Variants worth distinguishing

| Variant | Data | What changes |
| --- | --- | --- |
| Continued pre-training | Large unlabelled in-domain corpus | Domain vocabulary and priors |
| Supervised fine-tuning (SFT) | Input → output pairs | Instruction following, output format |
| Parameter-efficient tuning (LoRA, adapters) | Same as SFT | A small number of added or selected weights |
| Preference optimisation (DPO, RLHF) | Rankings or reward signal | Behavioural alignment |

These are not interchangeable. Continued pre-training on domain data followed by a small SFT stage
is a common recipe; running preference optimisation before SFT is usually a mistake.

## Full fine-tuning vs. parameter-efficient tuning

Full fine-tuning updates every weight, which means optimiser state and gradients for the whole
model — often several times the memory needed for inference. Parameter-efficient methods freeze the
base model and train a low-rank update. For a weight matrix $W \in \mathbb{R}^{d \times k}$, LoRA
learns

$$
W' = W + \frac{\alpha}{r} BA, \qquad B \in \mathbb{R}^{d \times r},\; A \in \mathbb{R}^{r \times k},\; r \ll \min(d, k)
$$

Only $A$ and $B$ receive gradients, so trainable parameters drop by orders of magnitude while the
base model stays untouched and shareable.

## Failure modes

- **Catastrophic forgetting** — narrow tuning erodes general capability. Mixing in a fraction of
  general data mitigates it.
- **Overfitting to surface form** — the model learns the phrasing of the training set rather than
  the task. Held-out evaluation on paraphrases catches this.
- **Distribution mismatch** — tuning data that does not resemble deployment inputs produces a model
  that looks good on the benchmark and fails in production.

## Related

- [Pre-training](/notes/pretraining/)
- [Sequence packing](/notes/sequence-packing/)
- [Prefill](/notes/prefill/)
