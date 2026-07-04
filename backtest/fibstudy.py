#!/usr/bin/env python3
"""Study: do waves terminate at fib extensions, and can a wave-chain gate
('fib inside fib') improve the pullback strategy?

Wave structure = alternating confirmed pivots (prd=8, same as the strategy).
For consecutive pivots ... H0 (high), L0 (low), H1 (high), L1 (low) ...:
  ext  = (H1-L0)/(H0-L0)  -> up-wave size vs the prior down-wave (fib grid of the chain)
  retr = (H1-L1)/(H1-L0)  -> how far the next pullback retraces the up-wave
"""
import csv, math
from collections import defaultdict
from backtest import load, load_adj, sma

PRD = 8
COMM = 0.0005
SLIP = 0.02

def pivots(bars):
    """Alternating pivot list [(bar, price, isHigh)] using prd-confirmed pivots;
    same-direction pivot replaces the tip if more extreme (classic zig-zag)."""
    n=len(bars); h=[b[2] for b in bars]; l=[b[3] for b in bars]
    seq=[]
    for t in range(PRD, n-PRD):
        isPl = all(l[t] < l[j] for j in range(t-PRD,t)) and all(l[t] < l[j] for j in range(t+1,t+PRD+1))
        isPh = all(h[t] > h[j] for j in range(t-PRD,t)) and all(h[t] > h[j] for j in range(t+1,t+PRD+1))
        for isHigh, px in ((True,h[t]) if isPh else (None,None), (False,l[t]) if isPl else (None,None)):
            if isHigh is None: continue
            if seq and seq[-1][2] == isHigh:
                if (isHigh and px > seq[-1][1]) or ((not isHigh) and px < seq[-1][1]):
                    seq[-1] = (t, px, isHigh)
            else:
                seq.append((t, px, isHigh))
    return seq

def chains(seq):
    """Yield (H0, L0, H1, L1) price quadruples from alternating pivots."""
    for i in range(len(seq)-3):
        a,b,c,d = seq[i:i+4]
        if a[2] and not b[2] and c[2] and not d[2]:   # H,L,H,L
            H0,L0,H1,L1 = a[1],b[1],c[1],d[1]
            if H0 > L0 and H1 > L0 and H1 > L1:
                yield H0,L0,H1,L1

def study(all_bars):
    exts=[]; retrs=[]; pairs=[]
    for bars in all_bars:
        for H0,L0,H1,L1 in chains(pivots(bars)):
            dn = H0-L0
            up = H1-L0
            if dn <= 0 or up <= 0: continue
            e = up/dn
            r = (H1-L1)/up
            if 0.2 < e < 4.0: exts.append(e)
            if 0.05 < r < 1.5: retrs.append(r)
            pairs.append((e,r))
    return exts, retrs, pairs

def hist(vals, lo, hi, w):
    bins=defaultdict(int)
    for v in vals:
        if lo <= v < hi: bins[round((v-lo)//w)] += 1
    total=sum(bins.values())
    return bins, total, w, lo

def show_hist(title, vals, lo, hi, w, marks):
    bins,total,w,lo0 = hist(vals,lo,hi,w)
    print(f"\n{title}  (n={total})")
    mx = max(bins.values()) if bins else 1
    for k in sorted(bins):
        x = lo0 + k*w
        bar = "#" * max(1, int(40*bins[k]/mx))
        tag = "".join(f" <-- {m}" for m in marks if x <= m < x+w)
        print(f"  {x:4.2f}-{x+w:4.2f} {100.0*bins[k]/total:5.1f}% {bar}{tag}")

def band_share(vals, center, half):
    n=len(vals)
    return 100.0*sum(1 for v in vals if abs(v-center)<=half)/n if n else 0.0

# ---------------- load ----------------
qqq = load_adj("QQQ.csv")
names=set()
with open("all_stocks_5yr.csv") as f:
    for row in csv.DictReader(f): names.add(row["Name"])
uni = load("all_stocks_5yr.csv", sorted(names))
uni_bars=[v for v in uni.values() if len(v)>=400]

# ---------------- Part 1: where do waves end? ----------------
for label, data in [("QQQ 1999-2019", [qqq]), ("498 S&P tickers 2013-18", uni_bars)]:
    exts, retrs, _ = study(data)
    show_hist(f"[{label}] up-wave size vs prior down-wave (fib-chain extension)", exts, 0.4, 2.8, 0.1, [1.0, 1.272, 1.618, 2.0])
    show_hist(f"[{label}] pullback retracement of the up-wave", retrs, 0.1, 1.1, 0.05, [0.382, 0.5, 0.618, 0.786])
    for c in (1.0, 1.272, 1.618, 2.0):
        inb = band_share(exts, c, 0.05)
        nb  = (band_share(exts, c-0.15, 0.05) + band_share(exts, c+0.15, 0.05))/2
        print(f"  extension band {c}: +/-0.05 share={inb:.1f}% vs neighbors {nb:.1f}%  ratio={inb/nb if nb else 0:.2f}")

# ---------------- Part 2: event study at the 1.272 tag ----------------
def event_study(bars, k):
    """After each confirmed up-wave L0->H1, when price FIRST tags L0+k*(H1-L0):
    forward close-to-close returns 5/10/20d vs unconditional."""
    n=len(bars); h=[b[2] for b in bars]; c=[b[4] for b in bars]
    seq=pivots(bars)
    fwd={5:[],10:[],20:[]}
    for i in range(len(seq)-1):
        lo, hi_ = seq[i], seq[i+1]
        if lo[2] or not hi_[2]: continue
        L0,H1 = lo[1], hi_[1]
        lvl = L0 + k*(H1-L0)
        start = hi_[0]+PRD+1               # after the high pivot is confirmed
        for t in range(start, min(start+120, n-21)):
            if h[t] >= lvl:
                for hz in fwd: fwd[hz].append(c[t+hz]/c[t]-1)
                break
    return fwd

def uncond(bars):
    c=[b[4] for b in bars]; out={5:[],10:[],20:[]}
    for t in range(0, len(c)-21, 5):
        for hz in out: out[hz].append(c[t+hz]/c[t]-1)
    return out

def avg(x): return 100.0*sum(x)/len(x) if x else 0.0

print("\n[Event study] forward returns after FIRST tag of the k-extension (QQQ + universe pooled):")
for k in (1.0, 1.272, 1.618):
    pooled={5:[],10:[],20:[]}
    for bars in [qqq]+uni_bars:
        f=event_study(bars,k)
        for hz in pooled: pooled[hz]+=f[hz]
    base={5:[],10:[],20:[]}
    for bars in [qqq]+uni_bars:
        u=uncond(bars)
        for hz in base: base[hz]+=u[hz]
    print(f"  k={k}: n={len(pooled[5])}  fwd 5d {avg(pooled[5]):+.2f}% (uncond {avg(base[5]):+.2f}%) | "
          f"10d {avg(pooled[10]):+.2f}% ({avg(base[10]):+.2f}%) | 20d {avg(pooled[20]):+.2f}% ({avg(base[20]):+.2f}%)")

# ---------------- Part 3: wave-chain gate on the strategy ----------------
from scaleout import SCfg, run as srun, ag

def run_gated(bars, band):
    """Long-only tuned fib engine, but only take setups whose prior up-wave
    (L0->H1) terminated with ext=(H1-L0)/(H0-L0) inside `band` (None = no gate)."""
    n=len(bars)
    o=[b[1] for b in bars]; h=[b[2] for b in bars]; l=[b[3] for b in bars]; c=[b[4] for b in bars]
    smaC=sma(c,200)
    seq=[]
    pend=None; pos=None; closeNext=False; trades=[]
    phP=phB=plP=plB=None
    lastH_before=None   # low pivot before current high pivot, and high before that
    hist_pivots=[]
    for t in range(1,n):
        # emulate (same as scaleout baseline, single leg, trail on)
        if pos is not None:
            if closeNext:
                x=o[t]; pnl=(x-pos["e"])-COMM*(pos["e"]+x)
                trades.append(dict(r=pnl/pos["riskPS"], win=pnl>0)); pos=None; closeNext=False
            else:
                stop=pos["curStop"]; tgt=pos["tgt"]
                px=None; sf=False
                if o[t]<=stop: px,sf=o[t],True
                elif o[t]>=tgt: px=o[t]
                elif l[t]<=stop: px,sf=stop,True
                elif h[t]>=tgt: px=tgt
                if px is not None:
                    xx=px-(SLIP if sf else 0)
                    pnl=(xx-pos["e"])-COMM*(pos["e"]+xx)
                    trades.append(dict(r=pnl/pos["riskPS"], win=pnl>0)); pos=None
        elif pend is not None and t>pend["pb"]:
            fill=None
            if o[t]<=pend["e"]: fill=o[t]
            elif l[t]<=pend["e"]: fill=pend["e"]
            if fill is not None:
                pos=dict(e=fill,curStop=pend["s"],a0=pend["a0"],rng=pend["rng"],
                         riskPS=abs(fill-pend["s"]),b=t,tgt=pend["a0"]+1.618*pend["rng"])
                pend=None
                if l[t]<=pos["curStop"]:
                    xx=pos["curStop"]-SLIP; pnl=(xx-pos["e"])-COMM*(pos["e"]+xx)
                    trades.append(dict(r=pnl/pos["riskPS"], win=pnl>0)); pos=None
        # pivots
        pi=t-PRD
        newPl=False
        if pi>=PRD:
            if all(l[pi]<l[j] for j in range(pi-PRD,pi)) and all(l[pi]<l[j] for j in range(pi+1,t+1)):
                plP,plB=l[pi],pi; newPl=True
                if hist_pivots and hist_pivots[-1][2]==False:
                    if l[pi]<hist_pivots[-1][1]: hist_pivots[-1]=(pi,l[pi],False)
                else: hist_pivots.append((pi,l[pi],False))
            if all(h[pi]>h[j] for j in range(pi-PRD,pi)) and all(h[pi]>h[j] for j in range(pi+1,t+1)):
                phP,phB=h[pi],pi
                if hist_pivots and hist_pivots[-1][2]==True:
                    if h[pi]>hist_pivots[-1][1]: hist_pivots[-1]=(pi,h[pi],True)
                else: hist_pivots.append((pi,h[pi],True))
        # setup
        if newPl and phP is not None and phB<plB and phP>plP and pos is None:
            a0,rng = plP, phP-plP
            e=a0+0.318*rng; s=a0-0.05*rng
            relSz=rng/a0
            regOk = smaC[t] is None or c[t]>smaC[t]
            gateOk=True
            if band is not None:
                # need ...H0,L0,H1(=phP),L1(=plP): find in hist_pivots
                gateOk=False
                hp=hist_pivots
                if len(hp)>=4 and hp[-1][2]==False and hp[-2][2]==True and hp[-3][2]==False and hp[-4][2]==True:
                    H0,L0,H1 = hp[-4][1],hp[-3][1],hp[-2][1]
                    if H0>L0:
                        ext=(H1-L0)/(H0-L0)
                        gateOk = band[0] <= ext <= band[1]
            if e>s and 0.04<=relSz<=1.5 and regOk and gateOk:
                pend=dict(e=e,s=s,a0=a0,rng=rng,pb=t)
        if pend is not None and pos is None and t-pend["pb"]>30:
            pend=None
        # trail
        if pos is not None:
            a0,rng=pos["a0"],pos["rng"]; be=pos["e"]
            l618=a0+0.618*rng; l100=a0+1.0*rng; l127=a0+1.272*rng
            cs=pos["curStop"]
            if h[t]>=l127: cs=max(cs,l100)
            elif h[t]>=l100: cs=max(cs,l618)
            elif h[t]>=l618: cs=max(cs,be)
            pos["curStop"]=cs
            if (t-pos["b"])>=60: closeNext=True
    return trades

print("\n[Wave-chain gate] only buy pullbacks whose PRIOR up-wave ended in the band:")
for label, band in [("no gate (baseline)",None), ("ext 1.15-1.45 ('1.272 tag')",(1.15,1.45)),
                    ("ext 1.5-1.8 ('1.618 tag')",(1.5,1.8)), ("ext 0.8-1.15 (weak wave)",(0.8,1.15)),
                    ("ext >1.15 (any strong wave)",(1.15,9.9))]:
    q=ag([dict(r=x["r"],win=x["win"]) for x in run_gated(qqq,band)])
    pool=[]
    for bars in uni_bars: pool+=run_gated(bars,band)
    U=ag([dict(r=x["r"],win=x["win"]) for x in pool])
    print(f"  {label:30s} QQQ n={q['n']:3d} win={q['win']:4.1f}% PF={q['pf']:4.2f} R{q['avgR']:+.2f} | UNIV n={U['n']:5d} win={U['win']:4.1f}% PF={U['pf']:4.2f} R{U['avgR']:+.2f}")
