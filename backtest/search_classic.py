#!/usr/bin/env python3
"""Best 'classic geometry' config: tight stop (<=0.3 beyond anchor), real target (>=1.0).
Maximize win rate subject to PF on QQQ + both stock splits."""
import itertools
from backtest import Cfg, load, load_adj, run_ticker, run_all, agg

TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
DEV  = ["AAPL","JNJ","XOM","CAT","DIS"]; HOLD = ["JPM","PG","HD","NEE","AMT"]
stocks = load("all_stocks_5yr.csv", TICKERS)
qqq = load_adj("QQQ.csv")

grid = dict(
    prd      = [5, 8, 13],
    entryFib = [0.382, 0.5, 0.618],
    tgtFib   = [1.0, 1.272, 1.618],
    stopBuf  = [0.05, 0.15, 0.3],
    trail    = [False, True],
    breakExit= [False, True],
    maxHold  = [25, 40, 60, 80],
    useVol   = [False, True],
    minRange = [0.04, 0.06],
)
keys = list(grid)
rows = []
for combo in itertools.product(*[grid[k] for k in keys]):
    kw = dict(zip(keys, combo))
    q = agg(run_ticker(qqq, Cfg(**kw)))
    if q["n"] < 40 or q["pf"] < 1.25: continue
    d, _, _ = run_all(stocks, Cfg(**kw), DEV)
    h, _, _ = run_all(stocks, Cfg(**kw), HOLD)
    if d["pf"] < 1.25 or h["pf"] < 1.25 or d["n"] < 25 or h["n"] < 25: continue
    rows.append((kw, q, d, h))

rows.sort(key=lambda r: min(r[1]["win"], r[2]["win"], r[3]["win"]), reverse=True)
print(f"{len(rows)} classic-geometry configs pass PF>=1.25 on QQQ + dev + holdout")
for kw, q, d, h in rows[:15]:
    tag = " ".join(f"{k}={v}" for k,v in kw.items())
    print(f" QQQ {q['n']:3d}t {q['win']:4.1f}%/{q['pf']:4.2f} R{q['avgR']:+.2f} | "
          f"dev {d['win']:4.1f}%/{d['pf']:4.2f} | hold {h['win']:4.1f}%/{h['pf']:4.2f} | {tag}")
