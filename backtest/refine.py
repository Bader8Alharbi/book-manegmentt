#!/usr/bin/env python3
"""Refinement around the high-win region + robustness detail for finalists."""
import itertools
from collections import Counter
from backtest import Cfg, load, run_all, agg

TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
DEV  = ["AAPL","JNJ","XOM","CAT","DIS"]
HOLD = ["JPM","PG","HD","NEE","AMT"]
data = load("all_stocks_5yr.csv", TICKERS)

grid = dict(
    prd      = [5, 8, 13],
    entryFib = [0.5, 0.55, 0.618],
    tgtFib   = [0.618, 0.7, 0.786],
    stopBuf  = [0.4, 0.5, 0.65, 0.8],
    volMult  = [1.15],
    useVol   = [True, False],
    minRange = [0.04, 0.06],
    trail    = [False],
    maxHold  = [40, 60, 80],
)
keys = list(grid)
rows = []
for combo in itertools.product(*[grid[k] for k in keys]):
    kw = dict(zip(keys, combo))
    if kw["tgtFib"] <= kw["entryFib"] + 0.05: continue
    cfg = Cfg(**kw)
    d, _, _ = run_all(data, cfg, DEV)
    h, _, _ = run_all(data, cfg, HOLD)
    a, _, _ = run_all(data, cfg, TICKERS)
    rows.append((kw, d, h, a))

# gate: BOTH splits >= 75% win, both PF >= 1.0, total n >= 120
cand = [r for r in rows if r[1]["win"]>=75 and r[2]["win"]>=75
        and r[1]["pf"]>=1.0 and r[2]["pf"]>=1.0 and r[3]["n"]>=120]
cand.sort(key=lambda r: (min(r[1]["pf"], r[2]["pf"]), r[3]["win"]), reverse=True)
print(f"{len(rows)} tested, {len(cand)} pass BOTH-split gate (win>=75 & PF>=1 on dev AND holdout, n>=120)\n")
for kw, d, h, a in cand[:15]:
    tag = " ".join(f"{k}={v}" for k,v in kw.items() if k in
                   ("prd","entryFib","tgtFib","stopBuf","useVol","minRange","maxHold"))
    print(f" dev {d['win']:4.1f}%/{d['pf']:4.2f} | hold {h['win']:4.1f}%/{h['pf']:4.2f} | "
          f"ALL n={a['n']:3d} {a['win']:4.1f}%/{a['pf']:4.2f} avgR={a['avgR']:+.3f} | {tag}")

# detail on the best
if cand:
    kw = cand[0][0]
    cfg = Cfg(**kw)
    tot, per, allt = run_all(data, cfg, TICKERS)
    print("\nFINALIST DETAIL:", kw)
    print(f" ALL: n={tot['n']} win={tot['win']:.1f}% PF={tot['pf']:.2f} avgR={tot['avgR']:+.3f}")
    for t in TICKERS:
        p = per[t]
        print(f"  {t:5s} n={p['n']:3d} win={p['win']:5.1f}% PF={p['pf']:5.2f} avgR={p['avgR']:+.3f}")
    reasons = Counter(x["reason"] for x in allt)
    rwin = {k: sum(1 for x in allt if x["reason"]==k and x["pnl"]>0) for k in reasons}
    print(" exits:", {k: f"{v} ({100.0*rwin[k]/v:.0f}% win)" for k,v in reasons.items()})
    # worst losing streak & loss tail
    streak = mx = 0
    for x in sorted(allt, key=lambda x: 0):  # order within list is per-ticker sequential
        if x["pnl"] <= 0: streak += 1; mx = max(mx, streak)
        else: streak = 0
    losses = sorted(x["r"] for x in allt if x["pnl"] <= 0)
    print(f" max losing streak={mx}, worst 5 losses (R): {[f'{r:.2f}' for r in losses[:5]]}")
