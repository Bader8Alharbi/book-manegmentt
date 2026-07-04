#!/usr/bin/env python3
"""Index mean-reversion (long-only): buy short-term weakness in an uptrend,
exit into strength. Fills at next open, 0.05%/side + $0.02 slippage/side."""
import csv, itertools
from backtest import load, load_adj, sma

COMM = 0.0005
SLIP = 0.02

def rsi(closes, n):
    out = [None]*len(closes)
    ag = al = None
    for i in range(1, len(closes)):
        ch = closes[i] - closes[i-1]
        g = ch if ch > 0 else 0.0
        lo = -ch if ch < 0 else 0.0
        if i == n:
            gs = ls = 0.0
            for j in range(1, n+1):
                cj = closes[j] - closes[j-1]
                gs += cj if cj > 0 else 0.0
                ls += -cj if cj < 0 else 0.0
            ag, al = gs/n, ls/n
        elif i > n:
            ag = (ag*(n-1) + g)/n
            al = (al*(n-1) + lo)/n
        if ag is not None:
            out[i] = 100.0 if al == 0 else 100.0 - 100.0/(1.0 + ag/al)
    return out

class MCfg:
    def __init__(self, **kw):
        self.rsiLen=2; self.buyBelow=10.0; self.sellAbove=70.0
        self.smaLen=200; self.maxHold=10; self.exitHigh=False  # exit if close > prev high
        for k,v in kw.items():
            assert hasattr(self,k), k
            setattr(self,k,v)

def run_mr(bars, cfg):
    n = len(bars)
    o=[b[1] for b in bars]; h=[b[2] for b in bars]; c=[b[4] for b in bars]
    smaC = sma(c, cfg.smaLen)
    r = rsi(c, cfg.rsiLen)
    trades=[]; pos=None; enterNext=False; exitNext=False
    for t in range(1, n):
        if exitNext and pos is not None:
            x = o[t] - SLIP
            ret = (x - pos["e"]) / pos["e"] - COMM*2
            trades.append(dict(ret=ret, bars=t - pos["b"]))
            pos=None
        exitNext=False
        if enterNext and pos is None:
            pos = dict(e=o[t] + SLIP, b=t)
        enterNext=False
        # signals at close of t
        if pos is None:
            if smaC[t] is not None and c[t] > smaC[t] and r[t] is not None and r[t] < cfg.buyBelow:
                enterNext=True
        else:
            hold = t - pos["b"]
            sig = (r[t] is not None and r[t] > cfg.sellAbove) or (cfg.exitHigh and c[t] > h[t-1]) or hold >= cfg.maxHold
            if sig: exitNext=True
    return trades

def m_agg(tr):
    if not tr: return dict(n=0, win=0.0, pf=0.0, avg=0.0, dd=0.0, tot=0.0)
    wins=[x for x in tr if x["ret"]>0]
    gp=sum(x["ret"] for x in tr if x["ret"]>0); gl=-sum(x["ret"] for x in tr if x["ret"]<0)
    cum=0.0; peak=0.0; dd=0.0
    for x in tr:
        cum += x["ret"]; peak=max(peak,cum); dd=max(dd, peak-cum)
    return dict(n=len(tr), win=100.0*len(wins)/len(tr), pf=(gp/gl if gl>0 else 99.0),
                avg=100.0*sum(x["ret"] for x in tr)/len(tr), dd=100.0*dd, tot=100.0*cum)

if __name__ == "__main__":
    qqq = load_adj("QQQ.csv")
    TICKERS=["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
    stocks = load("all_stocks_5yr.csv", TICKERS)

    print("GRID on QQQ 1999-2019 (dev):")
    rows=[]
    for bb, sa, mh, eh in itertools.product([5,10,15,25],[60,70,80],[5,10,15],[False,True]):
        cfg = MCfg(buyBelow=bb, sellAbove=sa, maxHold=mh, exitHigh=eh)
        a = m_agg(run_mr(qqq, cfg))
        if a["n"] >= 80: rows.append((a["pf"], cfg, a))
    rows.sort(key=lambda x: x[0], reverse=True)
    for pf, cfg, a in rows[:10]:
        print(f" buy<{cfg.buyBelow:4} sell>{cfg.sellAbove} hold<={cfg.maxHold:2} exitHigh={cfg.exitHigh}: "
              f"n={a['n']:3d} win={a['win']:4.1f}% PF={a['pf']:4.2f} avg={a['avg']:+.2f}% tot={a['tot']:+.0f}% maxDD={a['dd']:.1f}%")

    # validate top on the 10 stocks (holdout style)
    pf, cfg, a = rows[0]
    print("\nWINNER on 10 sector stocks (holdout):")
    allt=[]
    for tkr in TICKERS:
        tr = run_mr(stocks[tkr], cfg)
        allt += tr
        x = m_agg(tr)
        print(f"  {tkr:5s} n={x['n']:3d} win={x['win']:5.1f}% PF={x['pf']:5.2f} avg={x['avg']:+.2f}%")
    X = m_agg(allt)
    print(f"  ALL   n={X['n']} win={X['win']:.1f}% PF={X['pf']:.2f} avg={X['avg']:+.2f}%")

    # full universe
    names=set()
    with open("all_stocks_5yr.csv") as f:
        for row in csv.DictReader(f): names.add(row["Name"])
    uni = load("all_stocks_5yr.csv", sorted(names))
    pool=[]; per=[]
    for tkr in sorted(names):
        if len(uni[tkr]) < 400: continue
        tr = run_mr(uni[tkr], cfg)
        if tr: pool += tr; per.append(m_agg(tr))
    P = m_agg(pool); pf1 = sum(1 for x in per if x["pf"]>1)
    print(f"\nWINNER on FULL UNIVERSE: {len(per)} tickers, n={P['n']} win={P['win']:.1f}% PF={P['pf']:.2f} avg={P['avg']:+.2f}%; PF>1 on {100*pf1/len(per):.0f}% of tickers")
