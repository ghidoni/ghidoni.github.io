---
title: 'Your Spending Needs Attention: Modeling Financial Habits with Transformers'
authors:
  [
    'D. T. Braithwaite',
    'Misael Cavalcanti',
    'R. Austin McEver',
    'Hiroto Udagawa',
    'Daniel Silva',
    'Rohan Ramanath',
    'Felipe Meneses',
    'Arissa Yoshida',
    'Evan Wingert',
    'Matheus Ramos',
    'Brian Zanfelice',
    'Aman Gupta',
  ]
year: 2026
venue: 'KDD Workshop on Machine Learning in Finance'
link: 'https://arxiv.org/abs/2507.23267'
kind: preprint
date: 2026-11-17
summary: 'A causal transformer pretrained on compact transaction tokens, fused end-to-end with tabular features, buys 1.25% relative AUC over a LightGBM baseline in production.'
status: read
tags: ['transactions', 'architecture', 'training']
draft: false
---

The argument is that transaction histories are the richest signal in credit risk and the worst-used:
production systems compress months of spending into hand-built aggregates for gradient-boosted trees.
nuFormer pretrains a decoder-only transformer on tokenised transactions with next-token prediction,
then fine-tunes it end-to-end alongside the tabular stack it is meant to complement. The paper
reports +1.25% relative test AUC over a LightGBM baseline on a six-month default label, deployed to
100% of customers in one NuBank market.

What makes it worth reading is that it is a deployment report rather than a leaderboard entry. The
ablation table is unflattering to the transformer in isolation, and the authors print it anyway.

## How it works

A transaction is amount, date, description, and the paper's contribution is mostly in how those
become tokens. Structured attributes get dedicated vocabulary items; only the description goes
through BPE:

$$
\tau(t) = \big(\phi_{\text{sign}}, \phi_{\text{amt}}, \phi_{\text{month}}, \phi_{\text{day}}, \phi_{\text{weekday}}\big) \oplus \phi_{\text{BPE}}(v_{\text{desc}})
$$

Amounts are binned into 21 buckets, dates into 12 months, 31 days, and 7 weekdays. Average cost is
14 tokens per transaction, against roughly 55 serialised as text. In a 2048-token window that is
about 146 transactions versus 37.

Sequences are concatenated per member with separator tokens, then a causal transformer is pretrained
at ~500B tokens with no positional embeddings and FlashAttention. For a downstream task the last
non-padding token's hidden state is the user embedding — the only position that has seen the full
history — fed through an MLP.

**Joint Fusion** instead optimises the transformer and a DCNv2 network over 291 tabular features
together, with LoRA on the attention and projection layers to keep the 330M parameter backbone
trainable:

$$
\hat{y} = \mathrm{MLP}\big([\,h_{\text{txn}} \;\|\; \mathrm{proj}(\mathrm{DCNv2}(x_{\text{tab}}))\,]\big)
$$

Getting there needed a neural net that matches LightGBM on tabular features alone (+0.08% relative),
which required PLR numerical embeddings and L2 on the cross layers.

## Evidence

The primary task is credit default: 203M training rows, 2M test rows, disjoint time periods, and a
binary label for being 65+ days late six months after the score date. All gains are relative AUC over
LightGBM on tabular features only. Late fusion reaches 0.97% (identical for LightGBM and DCNv2
heads); Joint Fusion reaches 1.25%.

Scaling is shown mostly in figures: 24M parameters gives 0.37% and 330M gives 0.62% over the same
baseline, with context length 512/1024/2048 and fine-tuning data 5M→100M both trending up, the
larger model gaining more from each. None of those curves is tabulated.

The ablation, on 10M rows with 1024 context, is relative to Joint Fusion itself. Tabular only lands
at −0.96% and transformer only at −2.83%, so neither modality carries the model alone; early fusion
at −0.51% is the cleanest evidence that end-to-end training beats concatenation. At matched
transaction counts the tokenisations are a wash (−0.36% for Joint Fusion at 352 context versus −0.37%
for text-only at 1024). Pretrained knowledge does not rescue the text path: GPT-2 Medium reaches
−0.91%, Qwen3 0.6B and 4B reach −0.41% and −0.43% at 3.7× and 9× the training time.

Table 2 extends the recipe: +1.81% relative AUC on a second market, +2.23% on lending, +7.54% F1 on
income and +6.85% R² on spend prediction. Online, the model is credited with a 32% increase in a
long-term surrogate metric, roughly 3× a standard upgrade.

## What to be careful about

The 1.25% is relative, over a baseline that already includes bureau scores and 291 features, with no
confidence intervals, seed variance, or significance test. On hundreds of millions of rows a small
AUC delta can be real and still be dwarfed by the modelling choices around it; the honest framing is
a modest addition to a strong baseline.

Deployment evidence is weaker than the abstract implies: labels take six months to mature, so there
was no A/B test, and the 32% figure is a surrogate compared against historical launches rather than a
randomised control. Figure 7 is the only defence against period-specific leakage, and it is a plot.
They did find a real leakage bug — Buy-Now-Pay-Later prepayments rewriting transaction timestamps —
worth more to a practitioner than the AUC table.

Appendix A slips: the text calls source B the least useful, while the table puts C at −111.64% and B
at −44.67% against the all-sources baseline. Percentages that size cannot be AUC changes, and the
caption's "shortfall reduction" is never defined. Read it as directional only: it is a story about
context contention, where a noisy source evicts informative transactions from a fixed window.

None of it is reproducible outside NuBank — proprietary data, no code, ~500B pretraining tokens —
and the claim that 90% of hand-crafted transaction features can be dropped without loss appears once,
with no table.

## Why it matters for my work

This is the closest thing I have seen to a transaction foundation model in production, and the lesson
is that the win comes from the interface, not the parameters. Fourteen tokens per transaction — coarse
amount buckets, calendar tokens, BPE on the merchant string — is a design decision I can copy or
argue with. The 2048-token budget is a budget over *behaviour*; Appendix A shows what happens when you
spend it on the wrong events.

The negative result matters as much: a 4B pretrained language model did worse than a 24M model
trained from scratch on transactions, at nine times the cost. Whatever world knowledge lives in a
general LLM does not transfer for free to spending sequences.

## Related

- [Pre-training](/notes/pretraining/) — next-token training on transactions instead of text.
- [Fine-tuning](/notes/fine-tuning/) — LoRA plus a task head; why the last token carries the user.
- [Sequence packing](/notes/sequence-packing/) — the fixed-window economics behind 14 vs 55 tokens.
- [RoFormer](/papers/roformer-rotary-position-embedding/) — the option this paper declines by using NoPE.

## My take

<!-- take:pending -->

> _Not written yet. Replace this block with your own opinion — what convinced you, what you doubt,
> and whether it changes how you build._
