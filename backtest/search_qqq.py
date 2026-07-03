#!/usr/bin/env python3
"""Search on QQQ 1999-2019 (dev), validate on the 10-stock splits."""
import itertools
from backtest import Cfg, load, load_adj, run_ticker, run_all, agg

TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
DEV  = ["AAPL","JNJ","XOM","CAT","DIS"]
HOLD = ["JPM","PG","HD","NEE","AMT"]
stocks = load("all_stocks_5yr.csv", TICKERS)
qqq = load_adj("QQQ.csv")

grid = dict(
    prd      = [5, 8, 13],
    entryFib = [0.5, 0.55, 0.618, 0.7],
    tgtFib   = [0.618, 0.7, 0.786, 0.9, 1.0],
    stopBuf  = [0.3, 0.5, 0.8, 1.2],
    breakExit= [True, False],
    maxHold  = [15, 25, 40, 80],
    useVol   = [False, True],
    minRange = [0.03, 0.04, 0.06],
    trail    = [False],
)
keys = list(grid)
passers = []
tested = 0
for combo in itertools.product(*[grid[k] for k in keys]):
    kw = dict(zip(keys, combo))
    if kw["tgtFib"] <= kw["entryFib"] + 0.05: continue
    tested += 1
    q = agg(run_ticker(qqq, Cfg(**kw)))
    if q["n"] >= 60 and q["win"] >= 75 and q["pf"] >= 1.3:
        passers.append((kw, q))

print(f"{tested} configs tested on QQQ, {len(passers)} pass (win>=75, PF>=1.3, n>=60)")
passers.sort(key=lambda x: x[1]["pf"], reverse=True)
for kw, q in passers[:20]:
    d, _, _ = run_all(stocks, Cfg(**kw), DEV)
    h, _, _ = run_all(stocks, Cfg(**kw), HOLD)
    ok = "  <== ALL PASS" if (d["win"]>=75 and h["win"]>=75 and d["pf"]>=1.2 and h["pf"]>=1.2) else ""
    tag = " ".join(f"{k}={v}" for k,v in kw.items() if k in
                   ("prd","entryFib","tgtFib","stopBuf","breakExit","maxHold","useVol","minRange"))
    print(f" QQQ n={q['n']:3d} {q['win']:4.1f}%/{q['pf']:4.2f} R{q['avgR']:+.2f} | "
          f"dev {d['win']:4.1f}%/{d['pf']:4.2f} | hold {h['win']:4.1f}%/{h['pf']:4.2f} | {tag}{ok}")
