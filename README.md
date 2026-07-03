# Fib Strategy (visual) v4

A TradingView Pine Script (v5) swing strategy that buys pullbacks to a Fibonacci
retracement of a confirmed pivot swing, with evidence-based defaults.

**File:** [`fib_strategy_v4.pine`](fib_strategy_v4.pine) — paste it into the
TradingView Pine editor and add it to a chart.

## What it does

- Detects confirmed swing lows/highs (`ta.pivothigh` / `ta.pivotlow`) and arms a
  **limit entry at the 0.382 retracement** of the swing, with a stop just beyond
  the swing anchor and a trailing stop that ratchets up the fib extension levels.
- Filters: 200-SMA regime (longs only above it), above-average volume at the
  anchor pivot, swing-size bounds, optional impulse-slope and reward:risk gates.
- Risk-based position sizing (~1% of equity per stop-out by default).
- Visuals: the latest setup's entry/stop/target lines, swing zig-zag, live
  trailing-stop line, volume highlighting, and a stats table with R-multiple
  expectancy.

## Evidence behind the defaults

Defaults were chosen from an offline backtest of this exact logic (Python port)
on 18 US large-caps across 10 sectors, daily bars Feb 2013 – Feb 2018, split
into 10 development and 8 untouched holdout tickers:

| Config | PF dev / holdout | Avg R dev / holdout |
|---|---|---|
| old defaults | 0.62 / 0.70 | −0.24R / −0.15R |
| v3/v4 defaults | 2.61 / 1.69 | +0.40R / +0.21R |

Known limits: ~180 trades for the chosen config, bull-market-only sample (no
2020/2022), and the Python fill engine approximates TradingView's. Re-verify in
TradingView's own strategy tester before trading it.

Full changelog and per-parameter rationale are in the header comments of the
script itself.
