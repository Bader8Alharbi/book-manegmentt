#!/usr/bin/env python3
"""Test the claim: 'if the stock corrects TWO fib levels, it usually reverses'
plus the tradeable short version of it. No regime filter unless stated."""
import csv
from backtest import load, load_adj, sma
from fibstudy import pivots, PRD
from ladder_sys import LCfg, run as lrun, ag, FINE, COARSE

COMM = 0.0005
SLIP = 0.02
qqq = load_adj("QQQ.csv")
names=set()
with open("all_stocks_5yr.csv") as f:
    for row in csv.DictReader(f): names.add(row["Name"])
uni = load("all_stocks_5yr.csv", sorted(names))
ubars = {t:v for t,v in uni.items() if len(v) >= 400}

# ---------------- Part A: the race test ----------------
# For each confirmed up-wave L0->H1: from confirmation, wait for the giveback
# (low <= gbLvl). If a new high above H1 comes first, the wave simply went on.
# After the giveback: which comes first - NEW HIGH above H1 (claim wrong) or
# FULL RETRACE to L0 (claim right)?
def race(bars, gbK, maxwait=120):
    h=[b[2] for b in bars]; l=[b[3] for b in bars]
    seq = pivots(bars)
    newhigh=retrace=timeout=0; skipped=0
    for i in range(len(seq)-1):
        lo, hi_ = seq[i], seq[i+1]
        if lo[2] or not hi_[2]: continue
        L0,H1 = lo[1], hi_[1]
        if H1 <= L0: continue
        gbLvl = L0 + gbK*(H1-L0)
        start = hi_[0] + PRD + 1
        t0=None
        for t in range(start, min(start+maxwait, len(bars))):
            if h[t] > H1:            # extended before any giveback -> new structure
                t0=None; skipped+=1; break
            if l[t] <= gbLvl:
                t0=t; break
        if t0 is None: continue
        done=False
        for t in range(t0, min(t0+maxwait, len(bars))):
            if h[t] > H1: newhigh+=1; done=True; break
            if l[t] <= L0: retrace+=1; done=True; break
        if not done: timeout+=1
    return newhigh, retrace, timeout

print("PART A - after an up-wave gives back to level X, what wins the race?")
print("        (NEW HIGH above the wave top  vs  FULL RETRACE to the wave start)")
for lbl, gbK in [("1 rung  (below 0.786)", 0.786), ("2 rungs (below 0.618)", 0.618),
                 ("3 rungs (below 0.5)", 0.5), ("deep    (below 0.382)", 0.382)]:
    NH=RT=TO=0
    for bars in [qqq]+list(ubars.values()):
        a,b,c2 = race(bars, gbK)
        NH+=a; RT+=b; TO+=c2
    tot=NH+RT
    print(f"  {lbl}: n={tot+TO:5d}  new high first {100.0*NH/tot:5.1f}%  |  full retrace first {100.0*RT/tot:5.1f}%  (timeouts {TO})")

# ---------------- Part B: the tradeable SHORT ----------------
# Short at next open after a 2-rung giveback from the wave top; stop above H1;
# ride the mirrored ladder down (cover on a 2-rung give-UP from the lowest
# rung tagged); maxHold 40. Grid = the up-wave's own grid.
def short_sys(bars, gbK=0.618, regime=None, regimeLen=200, maxHold=40):
    n=len(bars)
    o=[b[1] for b in bars]; h=[b[2] for b in bars]; l=[b[3] for b in bars]; c=[b[4] for b in bars]
    smaC=sma(c,regimeLen)
    seq=pivots(bars)
    # map: for speed, precompute wave list with confirm bars
    waves=[]
    for i in range(len(seq)-1):
        lo,hi_=seq[i],seq[i+1]
        if (not lo[2]) and hi_[2] and hi_[1]>lo[1]:
            waves.append((lo[1],hi_[1],hi_[0]+PRD+1))
    K=FINE
    trades=[]
    wi=0; watch=None; pos=None; closeNext=False
    for t in range(1,n):
        # manage position
        if pos is not None:
            if closeNext:
                x=o[t]+SLIP*0  # market cover at open
                pnl=(pos["e"]-x)-COMM*(pos["e"]+x)
                trades.append(dict(r=pnl/pos["riskPS"], win=pnl>0)); pos=None; closeNext=False
            else:
                stopIdx=min(pos["lo"]+2, len(K)-1)
                stopPx=pos["a0"]+K[stopIdx]*pos["rng"]      # cover-stop two rungs above lowest tagged
                hardPx=pos["hard"]
                done=False; x=None
                if o[t]>=hardPx or o[t]>=stopPx: x=o[t]+SLIP; done=True
                elif h[t]>=min(stopPx,hardPx): x=min(stopPx,hardPx)+SLIP; done=True
                if done:
                    pnl=(pos["e"]-x)-COMM*(pos["e"]+x)
                    trades.append(dict(r=pnl/pos["riskPS"], win=pnl>0)); pos=None
        # activate watches for confirmed waves
        while wi < len(waves) and waves[wi][2] == t:
            watch = dict(L0=waves[wi][0], H1=waves[wi][1], born=t)
            wi += 1
        # trigger: giveback crossing (no new high yet)
        if watch is not None and pos is None:
            L0,H1 = watch["L0"], watch["H1"]
            if h[t] > H1 or t-watch["born"] > 120:
                watch=None
            elif l[t] <= L0 + gbK*(H1-L0):
                ok = regime is None or (smaC[t] is not None and ((regime=="bear" and c[t]<smaC[t]) or (regime=="bull" and c[t]>smaC[t])))
                if ok:
                    rng=H1-L0
                    e=o[t+1]-SLIP if t+1<n else None
                    if e is not None:
                        # lowest rung index at/below entry on grid
                        posk=(e-L0)/rng
                        loIdx=0
                        for j in range(len(K)):
                            if K[j] <= posk: loIdx=j
                        pos=dict(e=e, a0=L0, rng=rng, lo=loIdx, hard=H1,
                                 riskPS=max(H1-e, 0.001*e), b=t+1)
                watch=None
        # rung descent + maxHold
        if pos is not None and t >= pos["b"]:
            while pos["lo"]-1 >= 0 and l[t] <= pos["a0"]+K[pos["lo"]-1]*pos["rng"]:
                pos["lo"] -= 1
            if t-pos["b"] >= maxHold: closeNext=True
    return trades

print("\nPART B - SHORT the 2-rung giveback (stop above the wave high, ladder down):")
for lbl, reg in [("no regime filter", None), ("only BELOW 200SMA (bear)", "bear"), ("only ABOVE 200SMA", "bull")]:
    q=ag(short_sys(qqq, regime=reg))
    pool=[]
    for b in ubars.values(): pool+=short_sys(b, regime=reg)
    u=ag(pool)
    print(f"  {lbl:26s} QQQ n={q['n']:3d} win={q['win']:4.1f}% PF={q['pf']:4.2f} R{q['avgR']:+.2f} | UNIV n={u['n']:5d} win={u['win']:4.1f}% PF={u['pf']:4.2f} R{u['avgR']:+.2f}")

# ---------------- Part C: sell the long between 1.0 and 1.272? ----------------
print("\nPART C - long ladder with a fixed TP vs riding the giveback:")
for lbl,kw in [("TP at 1.0",   dict(rungs=COARSE, tp=1.0,   giveback=2)),
               ("TP at 1.136 (mid 1.0-1.272)", dict(rungs=COARSE, tp=1.136, giveback=2)),
               ("TP at 1.272", dict(rungs=COARSE, tp=1.272, giveback=2)),
               ("NO TP (ride the giveback)", dict(rungs=COARSE, tp=None, giveback=2))]:
    q=ag(lrun(qqq,LCfg(**kw))[0])
    pool=[]
    for b in ubars.values(): pool+=lrun(b,LCfg(**kw))[0]
    u=ag(pool)
    print(f"  {lbl:28s} QQQ PF={q['pf']:4.2f} R{q['avgR']:+.2f} | UNIV n={u['n']:5d} win={u['win']:4.1f}% PF={u['pf']:4.2f} R{u['avgR']:+.2f}")
