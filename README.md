# Fib Strategy (visual)

TradingView Pine Script (v5) swing strategies that trade Fibonacci
retracements of confirmed pivot swings.

## Two scripts

- **[`fib_strategy.pine`](fib_strategy.pine)** — the original visual strategy:
  stop-entry at the 0.236 retracement, target at 1.0, tight stop under the
  swing, fib-ratchet trailing to 1.618, longs and shorts. This is the classic
  look: big target zone, snug stop. Heads-up from simulation (long side):
  QQQ 1999-2019 ~21% win / PF 0.86; 10 large-caps 2013-18 ~28% win / PF 1.15.
  It lives on infrequent big runners - judge it in the TradingView tester.
- **[`fib_strategy_v4.pine`](fib_strategy_v4.pine)** — the researched rewrite
  (v4.3): same visuals plus bug fixes, R-multiple stats, and a **Preset
  dropdown** with three vetted profiles (raw inputs apply when Preset=Custom):

| Preset | Geometry | Evidence (win rate / PF) |
|---|---|---|
| **High win rate** (default) | entry 0.5, target 0.786, disaster stop 1.2×range | QQQ 88.7%/1.84 · 10 stocks 84.6%/1.78 · 498-ticker pool 83.8%/1.54 |
| **Balanced (classic levels)** | entry 0.618, target = prior high, stop 0.3×range under the swing low | QQQ 77.5%/1.71 · stocks dev 71.1%/1.89 · holdout 68.4%/1.42 |
| **Trend runner (v3)** | entry 0.382, tight 0.05 stop, trails to 1.618 | ~40% win, PF ~2.0–2.6 on the stock splits |

Win rate, target size and stop distance are a pick-two triangle — the presets
are three defensible corners of it, not three free lunches.

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
python3 search_classic.py                # classic-geometry search (Balanced preset)
```

Full changelog and per-parameter rationale are in the header comments of the
script itself.
