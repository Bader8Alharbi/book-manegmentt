# Study: do waves terminate at Fibonacci extensions? ("fib inside fib")

**Hypothesis (user observation):** waves tend to end near the 1.272 extension
of the prior wave, then decline, then start a new wave — so fib grids nest
fractally and the prior wave's extension tag should predict the next entry.

**Method** (`fibstudy.py`): wave structure = alternating confirmed pivots
(prd=8, identical to the strategy). For each pivot chain H0→L0→H1→L1:
`ext = (H1−L0)/(H0−L0)` (up-wave size vs prior down-wave, i.e. where the wave
terminated on the chain's fib grid) and `retr = (H1−L1)/(H1−L0)` (how far the
next pullback went). Data: QQQ 1999–2019 daily (135 waves) and 498 S&P
tickers 2013–2018 (11,506 waves).

## Finding 1 — On QQQ alone, the pattern LOOKS real; across 11,506 waves it vanishes

Share of wave terminations inside ±0.05 of each fib extension, vs the average
of the neighboring ±0.05 bands (ratio > 1 = clustering):

| band | QQQ (n=135) | 498 tickers (n=11,506) |
|---|---|---|
| 1.0   | **1.76×** | 1.01× |
| 1.272 | **1.40×** | 1.04× |
| 1.618 | 1.20× | 0.92× |
| 2.0   | **2.50×** | 1.03× |

With 135 waves, each band holds a handful of observations — enough for the eye
to "confirm" the level. With 11,506 waves the distribution is a smooth
declining curve with **no clustering at any fib ratio** (1.04× at 1.272 is
noise; 1.618 actually has *fewer* terminations than its neighbors).
Retracements likewise form a broad smooth hump from 0.35–0.80 with no spikes
at 0.382 / 0.5 / 0.618 / 0.786. **Fib levels are measuring tape, not magnets.**

## Finding 2 — BUT the "stall after stretching" part of the observation is real

Event study: after price first tags the k-extension of a confirmed up-wave,
forward returns (13,000+ events, QQQ + universe pooled) vs unconditional:

| after tagging | fwd 5d | fwd 10d | fwd 20d |
|---|---|---|---|
| (unconditional) | +0.29% | +0.58% | +1.15% |
| k = 1.0   | +0.29% | +0.58% | +0.99% |
| k = 1.272 | +0.15% | +0.43% | +0.85% |
| k = 1.618 | +0.12% | +0.35% | +0.73% |

Forward drift roughly **halves** after a 1.272 tag — extended moves do stall,
exactly as observed. But the effect is *smooth in k* (1.618 stalls more than
1.272, which stalls more than 1.0): it is short-term overextension, not a
property of the specific ratio. And drift stays **positive** — moves pause
and pull back; they do not reverse on average.

## Finding 3 — the wave-chain entry gate does not add edge

Restricting the tuned strategy to setups whose *prior* up-wave terminated in a
given extension band:

| gate | QQQ | 498-ticker universe |
|---|---|---|
| none (baseline) | n=58, PF 1.76 | n=7,570, PF 1.25 |
| prior wave ended 1.15–1.45 | n=6, PF 28.2 *(6 trades — noise)* | n=1,256, PF 1.22 |
| prior wave ended 1.5–1.8 | n=9, PF 0.77 | n=939, PF 1.15 |
| prior wave ended 0.8–1.15 | n=18, PF 2.05 | n=1,608, PF 1.24 |

On the only sample big enough to trust, every gate variant trades 5–8× less
for the same or worse PF. The strategy already *is* "fib inside fib": every
new confirmed swing re-anchors its own grid (the zig-zag re-anchoring), which
is precisely the fractal structure hypothesized — and it already captures all
the edge that structure offers ("buy the pullback of the latest wave").

## Bottom line

- The stall-after-1.272 observation is real and measurable (drift halves).
- The *level* itself is not special — no termination clustering at any ratio
  on large samples; QQQ's apparent clustering is a 135-wave small-sample effect.
- The tradeable content is already in `fib_strategy.pine` (pullback entry on
  each newly re-anchored wave); gating on the prior wave's extension band
  reduced opportunity without improving profitability, so it was not added.

Reproduce: `python3 fibstudy.py` (needs `all_stocks_5yr.csv` and `QQQ.csv`,
see backtest/README.md).

## Addendum: the "two-level correction" reversal claim (reversal_test.py)

**Claim:** "if the stock corrects two fib levels, it usually reverses."

**Race test** — for every completed up-wave, after price gives back to level X,
which comes first: a NEW HIGH above the wave top (continuation) or a FULL
RETRACE to the wave start (reversal)? 12,000-17,000 events, QQQ + 498 tickers:

| gave back to | new high first | full retrace first |
|---|---|---|
| 0.786 (1 rung) | 50.2% | 49.8% |
| **0.618 (2 rungs)** | **43.7%** | **56.3%** |
| 0.5 (3 rungs) | 37.3% | 62.7% |
| 0.382 (deep) | 30.3% | 69.7% |

The claim is DIRECTIONALLY TRUE and dose-dependent: at one rung it is a coin
flip; at two rungs the odds tilt to reversal (56/44) and keep tilting deeper.
"Two levels" is exactly where the coin starts leaning.

**But the tradeable SHORT of it loses.** Shorting the 2-rung giveback (stop
above the wave high, ladder down): universe PF 0.54 (n=14,209), QQQ PF 0.74.
Only QQQ *below its 200-SMA* was profitable (PF 1.36, n=40 - thin), and the
same filter still lost across the universe (PF 0.59). Why: the reversal odds
(56%) are real but the geometry is terrible - the stop above the wave high is
far, downside is slow and choppy, and the 44% continuations rip. The correct
uses of the signal are DEFENSIVE: exit longs on the giveback (the strategy's
default exit) and do not buy again until a new swing forms.

**Selling longs between 1.0-1.272 (fixed TP) re-tested:** TP 1.0 universe PF
1.20, TP 1.136 PF 1.23, TP 1.272 PF 1.26, riding the giveback PF 1.32 - every
fixed TP underperforms the giveback exit.
