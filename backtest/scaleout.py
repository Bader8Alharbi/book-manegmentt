#!/usr/bin/env python3
"""Scale-out test for the tuned fib strategy (price-action only, longs):
bank part of the position at a fib target, trail the rest to 1.618."""
import csv, itertools
from backtest import load, load_adj, sma

COMM = 0.0005
SLIP = 0.02

class SCfg:
    def __init__(self, **kw):
        self.prd=8; self.entryFib=0.318; self.stopBuf=0.05
        self.minRange=0.04; self.maxRange=1.50; self.entryWin=30; self.maxHold=60
        self.runnerFib=1.618; self.regimeLen=200
        self.partial=0.0        # fraction banked at tgt1 (0 = off)
        self.tgt1=1.0           # fib level for the banked part
        for k,v in kw.items():
            assert hasattr(self,k), k
            setattr(self,k,v)

def run(bars, cfg):
    n=len(bars)
    o=[b[1] for b in bars]; h=[b[2] for b in bars]; l=[b[3] for b in bars]; c=[b[4] for b in bars]
    smaC=sma(c,cfg.regimeLen)
    phP=phB=plP=plB=None
    pend=None; pos=None; closeNext=False
    trades=[]; legwins=[0,0]  # [wins, legs]

    def leg_pnl(e, x, stopfill):
        xx = x - (SLIP if stopfill else 0.0)
        return (xx - e) - COMM*(e + xx)

    def close_leg(li, px, stopfill, t):
        leg = pos["legs"][li]
        if leg is None: return
        pnl = leg_pnl(pos["e"], px, stopfill) * leg["w"]
        pos["done"] += pnl
        legwins[0] += 1 if pnl > 0 else 0
        legwins[1] += 1
        pos["legs"][li] = None
        if pos["legs"][0] is None and pos["legs"][1] is None:
            r = pos["done"] / (pos["riskPS"]) if pos["riskPS"]>0 else 0.0
            trades.append(dict(pnl=pos["done"], r=r, win=pos["done"]>0))
            return True
        return False

    for t in range(1, n):
        if pos is not None:
            if closeNext:
                for li in (0,1):
                    if pos["legs"][li] is not None:
                        if close_leg(li, o[t], False, t): break
                pos=None if (pos is None or (pos["legs"][0] is None and pos["legs"][1] is None)) else pos
                if pos is not None and pos["legs"][0] is None and pos["legs"][1] is None: pos=None
                closeNext=False
                if pos is not None and pos["legs"] == [None,None]: pos=None
            else:
                for li in (0,1):
                    if pos is None or pos["legs"][li] is None: continue
                    leg = pos["legs"][li]
                    stop = pos["s"] if li==0 else pos["curStop"]
                    tgt  = leg["tgt"]
                    fin=False
                    if o[t] <= stop:   fin=close_leg(li, o[t], True, t)
                    elif o[t] >= tgt:  fin=close_leg(li, o[t], False, t)
                    elif l[t] <= stop: fin=close_leg(li, stop, True, t)
                    elif h[t] >= tgt:  fin=close_leg(li, tgt, False, t)
                    if fin: pos=None; break
        elif pend is not None and t > pend["placedBar"]:
            fill=None
            if o[t] <= pend["e"]: fill=o[t]
            elif l[t] <= pend["e"]: fill=pend["e"]
            if fill is not None:
                a0,rng = pend["a0"], pend["rng"]
                w1 = cfg.partial
                legs=[None,None]
                if w1 > 0: legs[0]=dict(w=w1, tgt=a0+cfg.tgt1*rng)
                legs[1]=dict(w=1.0-w1, tgt=a0+cfg.runnerFib*rng)
                pos=dict(e=fill, s=pend["s"], curStop=pend["s"], a0=a0, rng=rng,
                         riskPS=abs(pend["e"]-pend["s"]), b=t, legs=legs, done=0.0)
                pend=None
                if l[t] <= pos["s"]:
                    for li in (0,1):
                        if pos and pos["legs"][li] is not None:
                            if close_leg(li, pos["s"], True, t): pos=None; break
                    if pos is not None and pos["legs"]==[None,None]: pos=None

        pi = t - cfg.prd
        if pi >= cfg.prd:
            lo=l[pi]; hi=h[pi]
            if all(lo < l[j] for j in range(pi-cfg.prd,pi)) and all(lo < l[j] for j in range(pi+1,t+1)):
                plP,plB = lo,pi
            if all(hi > h[j] for j in range(pi-cfg.prd,pi)) and all(hi > h[j] for j in range(pi+1,t+1)):
                phP,phB = hi,pi

        if (plB is not None and plB == t-cfg.prd and pi >= cfg.prd) and phP is not None and phB < plB and phP > plP:
            a0,a1 = plP,phP; rng = a1-a0
            e = a0 + cfg.entryFib*rng; s = a0 - cfg.stopBuf*rng
            relSz = rng/a0
            regOk = smaC[t] is None or c[t] > smaC[t]
            if e > s and cfg.minRange <= relSz <= cfg.maxRange and regOk and pos is None:
                pend=dict(e=e, s=s, a0=a0, rng=rng, placedBar=t)
        if pend is not None and pos is None and t - pend["placedBar"] > cfg.entryWin:
            pend=None

        if pos is not None and pos["legs"][1] is not None:
            a0,rng = pos["a0"], pos["rng"]
            be=pos["e"]
            l618=a0+0.618*rng; l100=a0+1.0*rng; l127=a0+1.272*rng
            cs=pos["curStop"]
            if   h[t] >= l127: cs=max(cs,l100)
            elif h[t] >= l100: cs=max(cs,l618)
            elif h[t] >= l618: cs=max(cs,be)
            pos["curStop"]=cs
        if pos is not None and (t - pos["b"]) >= cfg.maxHold:
            closeNext=True
    return trades, legwins

def ag(tr):
    if not tr: return dict(n=0,win=0,pf=0,avgR=0)
    gp=sum(x["r"] for x in tr if x["r"]>0); gl=-sum(x["r"] for x in tr if x["r"]<0)
    return dict(n=len(tr), win=100.0*sum(1 for x in tr if x["win"])/len(tr),
                pf=gp/gl if gl>0 else 99, avgR=sum(x["r"] for x in tr)/len(tr))

if __name__=="__main__":
    qqq=load_adj("QQQ.csv")
    TICKERS=["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
    DEV=["AAPL","JNJ","XOM","CAT","DIS"]; HOLD=["JPM","PG","HD","NEE","AMT"]
    stocks=load("all_stocks_5yr.csv",TICKERS)
    names=set()
    with open("all_stocks_5yr.csv") as f:
        for row in csv.DictReader(f): names.add(row["Name"])
    uni=load("all_stocks_5yr.csv",sorted(names))

    def sets(cfg):
        q,_ = run(qqq,cfg)
        d=[]; hh=[]
        for tk in DEV: d += run(stocks[tk],cfg)[0]
        for tk in HOLD: hh += run(stocks[tk],cfg)[0]
        pool=[]
        for tk in sorted(names):
            if len(uni[tk])<400: continue
            pool += run(uni[tk],cfg)[0]
        return ag(q),ag(d),ag(hh),ag(pool)

    print(f"{'variant':28s} | {'QQQ':>24s} | {'dev':>13s} | {'hold':>13s} | {'UNIVERSE':>24s}")
    for label, kw in [
        ("baseline (no scale-out)", dict(partial=0.0)),
        ("bank 50% @ 0.618",        dict(partial=0.5, tgt1=0.618)),
        ("bank 50% @ 0.786",        dict(partial=0.5, tgt1=0.786)),
        ("bank 50% @ 1.0",          dict(partial=0.5, tgt1=1.0)),
        ("bank 65% @ 1.0",          dict(partial=0.65, tgt1=1.0)),
        ("bank 50% @ 1.272",        dict(partial=0.5, tgt1=1.272)),
    ]:
        q,d,hh,u = sets(SCfg(**kw))
        print(f"{label:28s} | n={q['n']:3d} {q['win']:4.1f}% PF{q['pf']:5.2f} R{q['avgR']:+.2f} | {d['win']:4.1f}% PF{d['pf']:4.2f} | {hh['win']:4.1f}% PF{hh['pf']:4.2f} | n={u['n']:4d} {u['win']:4.1f}% PF{u['pf']:4.2f} R{u['avgR']:+.2f}")
