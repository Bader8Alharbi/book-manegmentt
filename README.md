# Fib Strategy (visual) — TradingView / Pine v5

Price-action swing strategy: Fibonacci retracements of confirmed pivot swings.
No oscillators, no RSI — pivots, fib levels, and a trend SMA filter only.

## ⭐ The strategy: [`fib_strategy.pine`](fib_strategy.pine)

The original visual strategy, tuned with its trade shape intact: limit entry
on the shallow retracement (0.318), tight 0.05 stop under the swing, target
1.0 with the fib-ratchet trail to 1.618.

**Evidence** (Python port of the exact logic, commission + slippage;
QQQ 1999–2019 includes the dot-com and 2008 bears):

| Change | QQQ PF |
|---|---|
| original defaults (buy-stop entry, no regime filter) | 0.86 (loses) |
| entry as a limit order (same level, no chasing) | 1.40 |
| + regime filter on (longs above 200-SMA) | 1.71 |
| + entry 0.318 (tuned) | **1.76 (+0.34R avg)** |

Stocks: dev split PF 1.88, holdout PF 1.34. Win rate is ~25–30% by design —
a few 1.618 runners pay for many small stops. Two further search rounds
(1,000+ variants each) found nothing that beat these defaults on the full
498-ticker S&P universe: they are confirmed robust, not stale.

**Exit mode (new default): the rung ladder** — the level-to-level system:
enter at 0.382, ride the rungs (0.786 / 1.0 / 1.272 / 1.618 / 2.0), exit when
price gives back **two rungs** from the highest rung tagged, no fixed target.
Versus the old ratchet trail on 7,200+ trades across 498 tickers: PF 1.32 vs
1.28, +0.18R vs +0.12R per trade, 33.5% vs 28.4% win rate (QQQ alone preferred
the ratchet — both modes are selectable). A fixed take-profit at 1.272 tested
worse everywhere; and shorting after a giveback was tested and rejected
(price drifts up after those exits, not down). Evidence: `backtest/ladder_sys.py`.

**Options, all price-action, all measured:**

- **Scale out** (off by default): bank 50% at the 0.618 level, trail the rest
  to 1.618. Win rate jumps 22%→59% (QQQ) / 28%→54% (universe) at a PF cost of
  ~0.2 / ~0.06 — flip it on if you want most trades green.
- **QQQ-only**: Regime SMA length 150 historically beat 200 there (PF 2.11)
  but is QQQ-fitted; slightly worse across the universe.
- Entry order type (Stop = the original chasing behavior), shorts (default
  off — lost on every test instrument), volume / impulse-angle filters.

## 🪜 The ladder: [`fib_ladder.pine`](fib_ladder.pine)

The full retracement grid — **0.236 / 0.382 / 0.5 / 0.618 / 0.786 / 1.0 /
1.272 / 1.618** — pinned automatically to the *major* swing of the lookback
window (the same two points you would pin the manual fib tool to, not small
internal pivots). The panel always knows which two rungs price is between and
plans the level-to-level trade: **buy the rung being tested, stop under the
next rung down, targets = the next rungs up**, with R:R and share sizing for
your account. Alerts: "Fib rung touched" and "Bounce confirmed at a rung" —
one alert per watchlist symbol turns TradingView into your level scanner.

## Alternative: [`fib_strategy_v4.pine`](fib_strategy_v4.pine)

Same fib engine, rewritten (v4.3): bug fixes, R-multiple stats, and a
**Preset dropdown** with three vetted profiles (raw inputs apply when
Preset=Custom):

| Preset | Geometry | Evidence (win rate / PF) |
|---|---|---|
| **High win rate** (default) | entry 0.5, target 0.786, disaster stop 1.2×range | QQQ 88.7%/1.84 · 10 stocks 84.6%/1.78 · 498-ticker pool 83.8%/1.54 |
| **Balanced (classic levels)** | entry 0.618, target = prior high, stop 0.3×range under the swing low | QQQ 77.5%/1.71 · stocks dev 71.1%/1.89 · holdout 68.4%/1.42 |
| **Trend runner (v3)** | entry 0.382, tight 0.05 stop, trails to 1.618 | ~40% win, PF ~2.0–2.6 on the stock splits |

Win rate, target size and stop distance are a pick-two triangle — the presets
are three defensible corners of it, not three free lunches.

## Reproducing the backtest

```bash
cd backtest
curl -LO https://raw.githubusercontent.com/plotly/datasets/master/all_stocks_5yr.csv
curl -o QQQ.csv https://raw.githubusercontent.com/nateGeorge/simulate_leveraged_ETFs/master/eod_data/QQQ.csv
python3 backtest.py all_stocks_5yr.csv   # shipped defaults on the 10 tickers
python3 search_qqq.py                    # QQQ-dev search + stock-split validation
python3 search_classic.py                # classic-geometry search (Balanced preset)
python3 search_old.py                    # original-strategy tuning (fib_strategy.pine)
python3 enhance_old.py                   # round-2 search + universe arbitration
python3 scaleout.py                      # scale-out option evidence
python3 fibstudy.py                      # wave-termination study (FIB_WAVE_STUDY.md)
python3 ladder_sys.py                    # rung-ladder exit system evidence
```

Full changelog and per-parameter rationale are in the header comments of the
script itself.
