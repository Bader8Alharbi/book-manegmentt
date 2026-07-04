#!/usr/bin/env python3
"""Round 2 for the tuned original: runner target, entry window, fine stops,
cancel-at-target. Gate on worst of QQQ/dev/holdout; validate winner broadly."""
import csv, itertools
from collections import Counter
from backtest import Cfg, load, load_adj, run_ticker, run_all, agg

TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
DEV  = ["AAPL","JNJ","XOM","CAT","DIS"]; HOLD = ["JPM","PG","HD","NEE","AMT"]
stocks = load("all_stocks_5yr.csv", TICKERS)
qqq = load_adj("QQQ.csv")

CUR = dict(prd=8, entryFib=0.318, stopBuf=0.05, trail=True, useRegime=True,
           useVol=False, maxHold=60, minRange=0.04, stopEntry=False)
q = agg(run_ticker(qqq, Cfg(**CUR)))
d,_,_ = run_all(stocks, Cfg(**CUR), DEV); h,_,_ = run_all(stocks, Cfg(**CUR), HOLD)
print(f"CURRENT: QQQ {q['win']:.1f}%/{q['pf']:.2f} R{q['avgR']:+.2f} | dev {d['pf']:.2f} | hold {h['pf']:.2f} | worstPF={min(q['pf'],d['pf'],h['pf']):.2f}\n")

grid = dict(
    prd       = [5, 8, 13],
    entryFib  = [0.318, 0.382],
    stopBuf   = [0.02, 0.05, 0.1, 0.15],
    runnerFib = [1.272, 1.618, 2.0],
    entryWin  = [15, 30],
    maxHold   = [40, 60, 80],
    minRange  = [0.04, 0.06],
    cancelAtTgt = [False, True],
    regimeLen = [150, 200],
)
keys = list(grid)
rows = []
for combo in itertools.product(*[grid[k] for k in keys]):
    kw = dict(zip(keys, combo))
    kw.update(trail=True, useRegime=True, useVol=False, stopEntry=False)
    q = agg(run_ticker(qqq, Cfg(**kw)))
    if q["n"] < 40: continue
    d, _, _ = run_all(stocks, Cfg(**kw), DEV)
    h, _, _ = run_all(stocks, Cfg(**kw), HOLD)
    if d["n"] < 25 or h["n"] < 25: continue
    wpf = min(q["pf"], d["pf"], h["pf"]); wr = min(q["avgR"], d["avgR"], h["avgR"])
    rows.append((wpf, wr, kw, q, d, h))

rows.sort(key=lambda r: (r[0], r[1]), reverse=True)
print(f"{len(rows)} configs with enough trades; top by WORST-set PF:")
for wpf, wr, kw, q, d, h in rows[:12]:
    tag = " ".join(f"{k}={v}" for k,v in kw.items() if k in keys)
    print(f" worstPF={wpf:4.2f} worstR={wr:+.2f} | QQQ n={q['n']:3d} {q['win']:4.1f}%/{q['pf']:4.2f} R{q['avgR']:+.2f} | "
          f"dev {d['win']:4.1f}%/{d['pf']:4.2f} | hold {h['win']:4.1f}%/{h['pf']:4.2f} | {tag}")

# ---- winner: broad validation ----
wpf, wr, kw, _, _, _ = rows[0]
print("\nWINNER:", kw)
cfg = Cfg(**kw)
qc = agg(run_ticker(qqq, Cfg(consFill=True, **kw)))
print(f" QQQ consFill stress: win={qc['win']:.1f}% PF={qc['pf']:.2f}")
names = set()
with open("all_stocks_5yr.csv") as f:
    for row in csv.DictReader(f): names.add(row["Name"])
uni = load("all_stocks_5yr.csv", sorted(names))
pool = []; perT = []
for t in sorted(names):
    if len(uni[t]) < 400: continue
    tr = run_ticker(uni[t], cfg)
    if tr: pool += tr; perT.append(agg(tr))
P = agg(pool)
pf1 = sum(1 for a in perT if a["pf"] > 1)
print(f" FULL UNIVERSE: {len(perT)} tickers, pooled n={P['n']} win={P['win']:.1f}% PF={P['pf']:.2f} avgR={P['avgR']:+.3f}; PF>1 on {100*pf1/len(perT):.0f}% of tickers")
allq = run_ticker(qqq, cfg)
print(" QQQ exits:", dict(Counter(x['reason'] for x in allq)))
