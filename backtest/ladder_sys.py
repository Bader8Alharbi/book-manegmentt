#!/usr/bin/env python3
"""The user's rung-ladder system, exactly as specified:
enter 0.382, ride the rungs, TP at 1.272 (final), exit on a 2-rung giveback
from the highest rung tagged. Tested on QQQ + 10-stock splits + 498 tickers."""
import csv, itertools
from backtest import load, load_adj, sma

COMM = 0.0005
SLIP = 0.02
FINE   = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618, 2.0]
COARSE = [0.0, 0.382, 0.786, 1.0, 1.272, 1.618, 2.0]   # the ladder as spoken

class LCfg:
    def __init__(self, **kw):
        self.prd=8; self.entryFib=0.382; self.minRange=0.04; self.maxRange=1.5
        self.entryWin=30; self.maxHold=60; self.regimeLen=200
        self.rungs=FINE; self.giveback=2; self.tp=1.272   # tp=None -> ride until giveback
        for k,v in kw.items():
            assert hasattr(self,k), k
            setattr(self,k,v)

def run(bars, cfg):
    n=len(bars)
    o=[b[1] for b in bars]; h=[b[2] for b in bars]; l=[b[3] for b in bars]; c=[b[4] for b in bars]
    smaC=sma(c,cfg.regimeLen)
    K=cfg.rungs
    iE=K.index(cfg.entryFib)
    phP=phB=plP=plB=None
    pend=None; pos=None; closeNext=False; trades=[]; gbBars=[]  # bars of giveback exits

    def px(kidx): return pos["a0"] + K[kidx]*pos["rng"]
    def close_tr(x, sf, why, t):
        xx=x-(SLIP if sf else 0.0)
        pnl=(xx-pos["e"])-COMM*(pos["e"]+xx)
        trades.append(dict(r=pnl/max(pos["riskPS"], 1e-9*pos["e"]), win=pnl>0, why=why))
        if why=="rung": gbBars.append(t)

    for t in range(1,n):
        if pos is not None:
            if closeNext:
                close_tr(o[t],False,"time",t); pos=None; closeNext=False
            else:
                stopIdx = max(pos["hi"]-cfg.giveback, 0)
                stopPx  = px(stopIdx)
                tpPx    = None if cfg.tp is None else pos["a0"]+cfg.tp*pos["rng"]
                why     = "rung" if pos["hi"]>iE else "stop"
                done=False
                if o[t]<=stopPx: close_tr(o[t],True,why,t); done=True
                elif tpPx is not None and o[t]>=tpPx: close_tr(o[t],False,"tp",t); done=True
                elif l[t]<=stopPx: close_tr(stopPx,True,why,t); done=True
                elif tpPx is not None and h[t]>=tpPx: close_tr(tpPx,False,"tp",t); done=True
                if done: pos=None
        elif pend is not None and t>pend["pb"]:
            fill=None
            if o[t]<=pend["e"]: fill=o[t]
            elif l[t]<=pend["e"]: fill=pend["e"]
            if fill is not None:
                pos=dict(e=fill,a0=pend["a0"],rng=pend["rng"],hi=iE,b=t,
                         riskPS=max(pend["e"]-(pend["a0"]+K[max(iE-cfg.giveback,0)]*pend["rng"]), 0.001*fill))
                pend=None
                if l[t] <= px(max(iE-cfg.giveback,0)):
                    close_tr(px(max(iE-cfg.giveback,0)),True,"stop",t); pos=None
        # pivots
        pi=t-cfg.prd
        newPl=False
        if pi>=cfg.prd:
            if all(l[pi]<l[j] for j in range(pi-cfg.prd,pi)) and all(l[pi]<l[j] for j in range(pi+1,t+1)):
                plP,plB=l[pi],pi; newPl=True
            if all(h[pi]>h[j] for j in range(pi-cfg.prd,pi)) and all(h[pi]>h[j] for j in range(pi+1,t+1)):
                phP,phB=h[pi],pi
        # setup
        if newPl and phP is not None and phB<plB and phP>plP and pos is None:
            a0,rng=plP,phP-plP
            relSz=rng/a0
            regOk = smaC[t] is None or c[t]>smaC[t]
            if cfg.minRange<=relSz<=cfg.maxRange and regOk:
                pend=dict(e=a0+cfg.entryFib*rng, a0=a0, rng=rng, pb=t)
        if pend is not None and pos is None and t-pend["pb"]>cfg.entryWin:
            pend=None
        # rung climb at bar close (effective next bar)
        if pos is not None:
            while pos["hi"]+1 < len(K) and h[t] >= px(pos["hi"]+1):
                pos["hi"] += 1
            if (t-pos["b"])>=cfg.maxHold:
                closeNext=True
    return trades, gbBars

def ag(tr):
    if not tr: return dict(n=0,win=0.0,pf=0.0,avgR=0.0)
    gp=sum(x["r"] for x in tr if x["r"]>0); gl=-sum(x["r"] for x in tr if x["r"]<0)
    return dict(n=len(tr),win=100.0*sum(1 for x in tr if x["win"])/len(tr),
                pf=gp/gl if gl>0 else 99.0, avgR=sum(x["r"] for x in tr)/len(tr))

if __name__=="__main__":
    qqq=load_adj("QQQ.csv")
    TICKERS=["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
    DEV=["AAPL","JNJ","XOM","CAT","DIS"]; HOLD=["JPM","PG","HD","NEE","AMT"]
    stocks=load("all_stocks_5yr.csv",TICKERS)
    names=set()
    with open("all_stocks_5yr.csv") as f:
        for row in csv.DictReader(f): names.add(row["Name"])
    uni=load("all_stocks_5yr.csv",sorted(names))
    ubars={t:v for t,v in uni.items() if len(v)>=400}

    def sets(cfg):
        q,_=run(qqq,cfg)
        d=[];hh=[]
        for tk in DEV: d+=run(stocks[tk],cfg)[0]
        for tk in HOLD: hh+=run(stocks[tk],cfg)[0]
        pool=[]
        for tk in ubars: pool+=run(ubars[tk],cfg)[0]
        return ag(q),ag(d),ag(hh),ag(pool)

    print("USER LADDER SYSTEM (entry 0.382, rung trail):")
    print(f"{'variant':38s} | {'QQQ':>26s} | {'dev':>12s} | {'hold':>12s} | {'UNIVERSE':>26s}")
    for lbl,kw in [
        ("as spoken: coarse, TP1.272, gb2", dict(rungs=COARSE, tp=1.272, giveback=2)),
        ("fine rungs, TP1.272, gb2",        dict(rungs=FINE,   tp=1.272, giveback=2)),
        ("fine rungs, TP1.618, gb2",        dict(rungs=FINE,   tp=1.618, giveback=2)),
        ("fine rungs, NO TP, gb2 (ride)",   dict(rungs=FINE,   tp=None,  giveback=2)),
        ("fine rungs, TP1.272, gb3",        dict(rungs=FINE,   tp=1.272, giveback=3)),
        ("coarse, NO TP, gb2 (ride)",       dict(rungs=COARSE, tp=None,  giveback=2)),
    ]:
        q,d,hh,u = sets(LCfg(**kw))
        print(f"{lbl:38s} | n={q['n']:3d} {q['win']:4.1f}% PF{q['pf']:5.2f} R{q['avgR']:+.2f} | {d['win']:4.1f}% PF{d['pf']:4.2f} | {hh['win']:4.1f}% PF{hh['pf']:4.2f} | n={u['n']:4d} {u['win']:4.1f}% PF{u['pf']:4.2f} R{u['avgR']:+.2f}")

    # reversal claim: after a 2-rung giveback exit, what happens next?
    print("\nREVERSAL CLAIM ('after a 2-rung giveback the side is done'):")
    cfg=LCfg(rungs=FINE, tp=1.272, giveback=2)
    horizons={10:[],20:[]}
    base={10:[],20:[]}
    for bars in [qqq]+list(ubars.values()):
        _,gb=run(bars,cfg)
        c=[b[4] for b in bars]
        for t in gb:
            for hz in horizons:
                if t+hz < len(c): horizons[hz].append(c[t+hz]/c[t]-1)
        for t in range(0,len(c)-21,10):
            for hz in base: base[hz].append(c[t+hz]/c[t]-1)
    for hz in horizons:
        a=100.0*sum(horizons[hz])/len(horizons[hz]) if horizons[hz] else 0
        b=100.0*sum(base[hz])/len(base[hz]) if base[hz] else 0
        print(f"  fwd {hz}d after giveback exit: {a:+.2f}%  vs unconditional {b:+.2f}%  (n={len(horizons[hz])})")
