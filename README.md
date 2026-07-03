# Fib Strategy (visual) v4.2

A TradingView Pine Script (v5) swing strategy that buys deep pullbacks to a
Fibonacci retracement of a confirmed pivot swing, with evidence-based defaults.

**File:** [`fib_strategy_v4.pine`](fib_strategy_v4.pine) — paste it into the
TradingView Pine editor and add it to a chart.

## What it does

- Detects confirmed swing lows/highs (`ta.pivothigh` / `ta.pivotlow`) and arms a
  **limit entry at the 0.5 retracement** of the swing, takes profit quickly at
  the **0.786 level**, with a wide stop parked beyond the swing anchor.
- Filters: 200-SMA regime (longs only above it), swing-size bounds, optional
  volume / impulse-slope / reward:risk gates.
- Risk-based position sizing (~1% of equity per stop-out by default).
- Visuals: the latest setup's entry/stop/target lines, swing zig-zag, live
  stop line, volume highlighting, and a stats table with R-multiple expectancy.

## Evidence behind the defaults (v4.2)

A live TradingView run of v4.1 on QQQ exposed a flaw: 79.8% win rate but
profit factor 1.04 — with avg win +0.25R vs avg loss −1R, breakeven needs
exactly 80% wins. v4.2 was re-derived the hard way: **QQQ 1999–2019 (including
the dot-com and 2008 bears) as the dev set**, required to also pass the
10-sector-stock dev/holdout splits and a conservative-fill stress test, then
validated once on the full S&P 500 universe (498 tickers never used in
selection). All tests use a faithful Python port of this exact logic
([`backtest/`](backtest/)) with commission and stop-fill slippage.

| Test set | Trades | Win rate | Profit factor |
|---|---|---|---|
| QQQ 1999–2019 (2 bear markets) | 53 | **88.7%** | 1.84 (stress 1.42) |
| 10 sector stocks 2013–2018 | 136 | **84.6%** | 1.78 |
| full S&P 500 universe (498 tickers) | 7,447 | **83.8%** | 1.54 |

83% of the 498 tickers individually clear a 75% win rate; 73% have PF > 1.

**Why it works:** entries are deep pullbacks (0.5 fib) with a quick 0.786
target; the stop (1.2×range beyond the anchor) is a *disaster stop* hit about
once per 10 trades, and routine losers are cut by the max-hold time exit at a
fraction of −1R. Expect ~3–8 setups per year per symbol — patience, not
scalping. Keep risk-based sizing on: the wide stop means a naive fixed-size
position would be far too large.

**Known limits:** no 2020/2022 data in any set; the fill engine approximates
TradingView's (conservative stop-first on ambiguous bars). Re-verify in
TradingView's own strategy tester before trading.

## Reproducing the backtest

```bash
cd backtest
curl -LO https://raw.githubusercontent.com/plotly/datasets/master/all_stocks_5yr.csv
curl -o QQQ.csv https://raw.githubusercontent.com/nateGeorge/simulate_leveraged_ETFs/master/eod_data/QQQ.csv
python3 backtest.py all_stocks_5yr.csv   # shipped defaults on the 10 tickers
python3 search_qqq.py                    # QQQ-dev search + stock-split validation
```

Full changelog and per-parameter rationale are in the header comments of the
script itself.
