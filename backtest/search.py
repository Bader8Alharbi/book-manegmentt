#!/usr/bin/env python3
"""Grid search for a >=75% win-rate config. Dev/holdout ticker split."""
import itertools
from backtest import Cfg, load, run_all, agg

TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
DEV  = ["AAPL","JNJ","XOM","CAT","DIS"]
HOLD = ["JPM","PG","HD","NEE","AMT"]
data = load("all_stocks_5yr.csv", TICKERS)

grid = dict(
    prd      = [5, 8],
    entryFib = [0.382, 0.5],
    tgtFib   = [0.618, 0.786, 1.0],
    stopBuf  = [0.05, 0.15, 0.30, 0.50],
    volMult  = [1.15, 1.3],
    useVol   = [True, False],
    trail    = [False],
    cancelAtTgt = [False, True],
    maxHold  = [40, 60],
)
keys = list(grid)
rows = []
seen = set()
for combo in itertools.product(*[grid[k] for k in keys]):
    kw = dict(zip(keys, combo))
    if not kw["useVol"]:
        kw["volMult"] = 1.3   # value irrelevant when off; dedupe
    if kw["tgtFib"] <= kw["entryFib"]:
        continue
    cfg = Cfg(**kw)
    sig = tuple(sorted(kw.items()))
    if sig in seen: continue
    seen.add(sig)
    dtot, _, _ = run_all(data, cfg, DEV)
    rows.append((kw, dtot))

# candidates: dev win>=75, decent n and PF
cand = [(kw,d) for kw,d in rows if d["win"] >= 75 and d["n"] >= 40 and d["pf"] >= 1.2]
cand.sort(key=lambda x: (x[1]["win"], x[1]["pf"]), reverse=True)
print(f"{len(rows)} configs tested, {len(cand)} pass dev gate (win>=75%, n>=40, PF>=1.2)\n")
print("TOP DEV CANDIDATES -> holdout & all-10 check:")
for kw, d in cand[:12]:
    cfg = Cfg(**kw)
    htot, _, _ = run_all(data, cfg, HOLD)
    atot, _, _ = run_all(data, cfg, TICKERS)
    tag = " ".join(f"{k}={v}" for k,v in kw.items() if k in
                   ("prd","entryFib","tgtFib","stopBuf","useVol","volMult","cancelAtTgt","maxHold"))
    print(f" dev n={d['n']:3d} win={d['win']:4.1f} PF={d['pf']:4.2f} | "
          f"hold n={htot['n']:3d} win={htot['win']:4.1f} PF={htot['pf']:4.2f} | "
          f"ALL n={atot['n']:3d} win={atot['win']:4.1f} PF={atot['pf']:4.2f} avgR={atot['avgR']:+.2f} | {tag}")

# also show best overall win rates regardless of gate, for context
rows.sort(key=lambda x: x[1]["win"], reverse=True)
print("\nBEST RAW DEV WIN RATES (context):")
for kw, d in rows[:8]:
    tag = " ".join(f"{k}={v}" for k,v in kw.items() if k in
                   ("prd","entryFib","tgtFib","stopBuf","useVol","volMult","cancelAtTgt","maxHold"))
    print(f" dev n={d['n']:3d} win={d['win']:4.1f} PF={d['pf']:4.2f} avgR={d['avgR']:+.2f} | {tag}")
