#!/usr/bin/env python3
"""Improve the ORIGINAL strategy keeping its geometry: shallow entry, tight stop,
trail to 1.618 (or big fixed target). Rank by worst-set profitability."""
import itertools
from backtest import Cfg, load, load_adj, run_ticker, run_all, agg

TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
DEV  = ["AAPL","JNJ","XOM","CAT","DIS"]; HOLD = ["JPM","PG","HD","NEE","AMT"]
stocks = load("all_stocks_5yr.csv", TICKERS)
qqq = load_adj("QQQ.csv")

# baseline: the old code as-is (long side)
BASE = dict(prd=8, entryFib=0.236, tgtFib=1.0, stopBuf=0.05, trail=True,
            useRegime=False, useVol=False, maxHold=60, minRange=0.04, stopEntry=True)
for lbl, kw in [("OLD as-is (stop entry)", BASE),
                ("OLD + limit entry only", {**BASE, "stopEntry": False}),
                ("OLD + limit + regime",   {**BASE, "stopEntry": False, "useRegime": True})]:
    q = agg(run_ticker(qqq, Cfg(**kw)))
    a, _, _ = run_all(stocks, Cfg(**kw), TICKERS)
    print(f"{lbl:26s} QQQ n={q['n']:3d} {q['win']:4.1f}%/{q['pf']:4.2f} R{q['avgR']:+.2f} | 10stk n={a['n']:3d} {a['win']:4.1f}%/{a['pf']:4.2f} R{a['avgR']:+.2f}")

print("\nSEARCH (classic geometry, limit entry, regime on):")
grid = dict(
    prd      = [8, 13],
    entryFib = [0.236, 0.318, 0.382],
    stopBuf  = [0.05, 0.15, 0.3],
    trail    = [True, False],
    tgtFib   = [1.0, 1.272],       # fixed target when trail off; ignored-ish when on
    useVol   = [False, True],
    maxHold  = [40, 60, 80],
    minRange = [0.04, 0.06],
)
keys = list(grid)
rows = []
for combo in itertools.product(*[grid[k] for k in keys]):
    kw = dict(zip(keys, combo))
    if kw["trail"] and kw["tgtFib"] != 1.0: continue   # tgt ignored under trail; dedupe
    kw.update(useRegime=True, stopEntry=False)
    q = agg(run_ticker(qqq, Cfg(**kw)))
    if q["n"] < 40: continue
    d, _, _ = run_all(stocks, Cfg(**kw), DEV)
    h, _, _ = run_all(stocks, Cfg(**kw), HOLD)
    if d["n"] < 25 or h["n"] < 25: continue
    worst_pf = min(q["pf"], d["pf"], h["pf"])
    worst_r  = min(q["avgR"], d["avgR"], h["avgR"])
    rows.append((worst_pf, worst_r, kw, q, d, h))

rows.sort(key=lambda r: (r[0], r[1]), reverse=True)
for wpf, wr, kw, q, d, h in rows[:14]:
    tag = " ".join(f"{k}={v}" for k,v in kw.items() if k in
                   ("prd","entryFib","stopBuf","trail","tgtFib","useVol","maxHold","minRange"))
    print(f" worstPF={wpf:4.2f} | QQQ n={q['n']:3d} {q['win']:4.1f}%/{q['pf']:4.2f} R{q['avgR']:+.2f} | "
          f"dev {d['win']:4.1f}%/{d['pf']:4.2f} | hold {h['win']:4.1f}%/{h['pf']:4.2f} | {tag}")
