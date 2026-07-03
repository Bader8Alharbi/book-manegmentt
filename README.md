# Fib Strategy (visual) v4.1

A TradingView Pine Script (v5) swing strategy that buys deep pullbacks to a
Fibonacci retracement of a confirmed pivot swing, with evidence-based defaults.

**File:** [`fib_strategy_v4.pine`](fib_strategy_v4.pine) — paste it into the
TradingView Pine editor and add it to a chart.

## What it does

- Detects confirmed swing lows/highs (`ta.pivothigh` / `ta.pivotlow`) and arms a
  **limit entry at the 0.55 retracement** of the swing, takes profit quickly at
  the **0.786 level**, with a wide stop parked beyond the swing anchor.
- Filters: 200-SMA regime (longs only above it), swing-size bounds, optional
  volume / impulse-slope / reward:risk gates.
- Risk-based position sizing (~1% of equity per stop-out by default).
- Visuals: the latest setup's entry/stop/target lines, swing zig-zag, live
  stop line, volume highlighting, and a stats table with R-multiple expectancy.

## Evidence behind the defaults (v4.1 high-win profile)

Offline backtest of a faithful Python port of this exact logic
([`backtest/`](backtest/)) on **10 US large-caps, one per GICS sector**
(AAPL, JPM, JNJ, XOM, PG, HD, CAT, NEE, DIS, AMT), real daily OHLCV
Feb 2013 – Feb 2018, 0.05%/side commission + 2-tick slippage on stop fills.
Parameters were chosen on 5 dev tickers and validated on 5 untouched holdout
tickers:

| Split | Trades | Win rate | Profit factor |
|---|---|---|---|
| dev (AAPL JNJ XOM CAT DIS) | 87 | **84.9%** | 2.13 |
| holdout (JPM PG HD NEE AMT) | 101 | **81.4%** | 1.55 |
| **all 10** | **188** | **83.0%** | **1.79** (avg +0.13R) |

9 of 10 tickers ≥ ~74% win rate; exits: 154 targets / 28 stops / 6 time;
max losing streak 2. Every neighboring parameter combo (entry 0.5–0.618,
target 0.7–0.786, stop buffer 0.65–0.8, hold 60–80) also passed win ≥ 75%
and PF ≥ 1 on **both** splits — a plateau, not a lucky spike.

**The trade-off:** the high win rate is bought with reward:risk ≈ 0.17 —
winners are small and a rare stop-out costs ~8 wins. Keep risk-based sizing on.
The earlier v3 "expectancy profile" (~40% win, bigger R, PF ~2.0–2.6) is one
settings flip away and documented in the script header.

**Known limits:** bull-market-only sample (no 2020/2022), modest n, and the
Python fill engine approximates TradingView's (conservative stop-first on
ambiguous bars). Re-verify in TradingView's own strategy tester before trading.

## Reproducing the backtest

```bash
cd backtest
curl -LO https://raw.githubusercontent.com/plotly/datasets/master/all_stocks_5yr.csv
python3 backtest.py all_stocks_5yr.csv   # v4.1 defaults on the 10 tickers
python3 search.py                        # coarse grid search (dev gate)
python3 refine.py                        # fine grid + dev/holdout gate + detail
```

Full changelog and per-parameter rationale are in the header comments of the
script itself.
