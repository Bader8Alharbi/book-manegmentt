#!/usr/bin/env python3
"""Faithful Python port of fib_strategy_v4.pine for daily bars.

Mirrors TradingView semantics:
- pivots confirm `prd` bars late
- orders placed at bar close become active the NEXT bar
- broker emulator: gap fills at open; ambiguous bars resolve STOP-FIRST (conservative)
- limit entry fills at min(open, level) for longs
- trail ratchet computed at bar close, effective next bar (like strategy.exit re-issue)
- commission 0.05%/side; 2-tick ($0.02) adverse slippage on stop-triggered fills
"""
import csv, math, itertools, sys
from collections import defaultdict

COMM = 0.0005      # 0.05% per side
SLIP = 0.02        # 2 ticks on stop/market fills

def load(path, tickers):
    data = {t: [] for t in tickers}
    with open(path) as f:
        for row in csv.DictReader(f):
            t = row["Name"]
            if t in data:
                try:
                    data[t].append((row["date"], float(row["open"]), float(row["high"]),
                                    float(row["low"]), float(row["close"]), float(row["volume"])))
                except ValueError:
                    pass  # rare NA rows in this dataset
    return data

def load_adj(path):
    """Load a single-ticker CSV with Adj_Open/Adj_High/Adj_Low/Adj_Close/Adj_Volume."""
    out = []
    with open(path) as f:
        for row in csv.DictReader(f):
            out.append((row["Date"], float(row["Adj_Open"]), float(row["Adj_High"]),
                        float(row["Adj_Low"]), float(row["Adj_Close"]), float(row["Adj_Volume"])))
    return out

def sma(vals, n):
    out = [None]*len(vals); s = 0.0
    for i, v in enumerate(vals):
        s += v
        if i >= n: s -= vals[i-n]
        if i >= n-1: out[i] = s/n
    return out

class Cfg:
    def __init__(self, **kw):
        # v4.2 defaults (mirror fib_strategy_v4.pine)
        self.prd=8; self.entryFib=0.5; self.stopBuf=1.2; self.tgtFib=0.786
        self.minRange=0.04; self.maxRange=1.50; self.entryWin=30; self.maxHold=80
        self.trail=False; self.runnerFib=1.618
        self.useRegime=True; self.regimeLen=200
        self.useVol=False; self.volLen=20; self.volMult=1.3
        self.cancelAtTgt=False; self.lockBracket=True
        self.breakExit=False   # exit next open if a bar CLOSES below the swing anchor
        self.consFill=False    # pessimistic: limit entries fill at the level, never better
        for k,v in kw.items():
            assert hasattr(self,k), k
            setattr(self,k,v)
    def key(self):
        return (self.prd,self.entryFib,self.stopBuf,self.tgtFib,self.trail,
                self.volMult if self.useVol else 0, self.cancelAtTgt, self.maxHold)

def run_ticker(bars, cfg):
    """Long-only (v4 default). Returns list of per-trade dicts."""
    n = len(bars)
    o = [b[1] for b in bars]; h = [b[2] for b in bars]
    l = [b[3] for b in bars]; c = [b[4] for b in bars]; v = [b[5] for b in bars]
    smaC = sma(c, cfg.regimeLen)
    smaV = sma(v, cfg.volLen)

    phP=phB=plP=plB=None; phV=plV=None
    # pending entry
    pend=None   # dict(e,s,tgt,a0,rng,placedBar)
    pos=None    # dict(entry,stop,tgt,a0,rng,riskPS,entryBar,runnerTgt)
    closeNext=None   # exit-at-next-open reason ('time'/'break') or None
    trades=[]

    def close_trade(exit_px, bar_i, reason, stopfill):
        e = pos["entry"]
        x = exit_px - (SLIP if stopfill else 0.0)
        pnl = (x - e) - COMM*(e + x)
        r = pnl / pos["riskPS"] if pos["riskPS"] > 0 else 0.0
        trades.append(dict(entry=e, exit=x, pnl=pnl, r=r, reason=reason,
                           bars=bar_i - pos["entryBar"]))

    for t in range(1, n):
        # ---- 1) broker emulator: execute orders configured at end of t-1 ----
        if pos is not None:
            if closeNext is not None:           # scheduled market exit at next open
                close_trade(o[t], t, closeNext, False); pos=None; closeNext=None
            else:
                stop, tgt = pos["stop"], pos["tgt"]
                if o[t] <= stop:   close_trade(o[t], t, "stop", True);  pos=None
                elif o[t] >= tgt:  close_trade(o[t], t, "target", False); pos=None
                elif l[t] <= stop: close_trade(stop, t, "stop", True);  pos=None
                elif h[t] >= tgt:  close_trade(tgt, t, "target", False); pos=None
        elif pend is not None and t > pend["placedBar"]:
            fill = None
            if o[t] <= pend["e"]: fill = pend["e"] if cfg.consFill else o[t]
            elif l[t] <= pend["e"]: fill = pend["e"]
            if fill is not None:
                pos = dict(entry=fill, stop=pend["s"],
                           tgt=(pend["runnerTgt"] if cfg.trail else pend["tgt"]),
                           a0=pend["a0"], rng=pend["rng"],
                           riskPS=abs(fill - pend["s"]), entryBar=t,
                           runnerTgt=pend["runnerTgt"], fixedTgt=pend["tgt"])
                pend = None
                # same-bar bracket check after fill (conservative stop-first)
                if l[t] <= pos["stop"]:
                    close_trade(min(o[t], pos["stop"]) if o[t] < pos["stop"] else pos["stop"], t, "stop", True); pos=None
                elif h[t] >= pos["tgt"] and fill != o[t]:
                    pass  # filled on the way down; target same bar would need reversal - skip (conservative)

        # ---- 2) pivots confirmed at t for bar t-prd ----
        pi = t - cfg.prd
        if pi >= cfg.prd:
            lo = l[pi]; hi = h[pi]
            if all(lo < l[j] for j in range(pi-cfg.prd, pi)) and all(lo < l[j] for j in range(pi+1, t+1)):
                plP, plB = lo, pi
                plV = (v[pi]/smaV[pi]) if smaV[pi] else None
            if all(hi > h[j] for j in range(pi-cfg.prd, pi)) and all(hi > h[j] for j in range(pi+1, t+1)):
                phP, phB = hi, pi
                phV = (v[pi]/smaV[pi]) if smaV[pi] else None

        # ---- 3) strategy logic at bar t close ----
        newPl = (plB is not None and plB == t - cfg.prd and pi >= cfg.prd)
        if newPl and phP is not None and phB < plB and phP > plP:
            a0, a1 = plP, phP
            rng = a1 - a0
            e  = a0 + cfg.entryFib*rng
            s  = a0 - cfg.stopBuf*rng
            tg = a0 + cfg.tgtFib*rng
            valid = e > s
            relSz = rng/a0
            regOk = (not cfg.useRegime) or smaC[t] is None or c[t] > smaC[t]
            volOk = (not cfg.useVol) or (plV is not None and plV >= cfg.volMult)
            gateOk = pos is None or not cfg.lockBracket
            if valid and cfg.minRange <= relSz <= cfg.maxRange and regOk and volOk and gateOk and pos is None:
                pend = dict(e=e, s=s, tgt=tg, a0=a0, rng=rng, placedBar=t,
                            runnerTgt=a0 + cfg.runnerFib*rng)

        # pending hygiene
        if pend is not None and pos is None:
            if cfg.cancelAtTgt and h[t] >= pend["a0"] + cfg.tgtFib*pend["rng"]:
                pend = None
            elif t - pend["placedBar"] > cfg.entryWin:
                pend = None

        # trail ratchet (bar close, effective next bar)
        if pos is not None and cfg.trail:
            a0, rng = pos["a0"], pos["rng"]
            be = pos["entry"]
            l618 = a0 + 0.618*rng; l100 = a0 + 1.0*rng; l127 = a0 + 1.272*rng
            cs = pos["stop"]
            if   h[t] >= l127: cs = max(cs, l100)
            elif h[t] >= l100: cs = max(cs, l618)
            elif h[t] >= l618: cs = max(cs, be)
            pos["stop"] = cs

        # structure break: bar CLOSED below the fib-0 anchor -> get out next open
        if pos is not None and cfg.breakExit and c[t] < pos["a0"]:
            closeNext = "break"
        # maxHold
        if pos is not None and (t - pos["entryBar"]) >= cfg.maxHold:
            closeNext = "time" 

    return trades

def agg(trades):
    n = len(trades)
    if n == 0: return dict(n=0, win=0.0, pf=0.0, avgR=0.0)
    wins = [x for x in trades if x["pnl"] > 0]
    gp = sum(x["r"] for x in trades if x["r"] > 0)
    gl = -sum(x["r"] for x in trades if x["r"] < 0)
    return dict(n=n, win=100.0*len(wins)/n,
                pf=(gp/gl if gl > 0 else float("inf")),
                avgR=sum(x["r"] for x in trades)/n)

def run_all(data, cfg, tickers):
    per = {}
    allt = []
    for t in tickers:
        tr = run_ticker(data[t], cfg)
        per[t] = agg(tr)
        allt += tr
    return agg(allt), per, allt

if __name__ == "__main__":
    TICKERS = ["AAPL","JPM","JNJ","XOM","PG","HD","CAT","NEE","DIS","AMT"]
    data = load(sys.argv[1] if len(sys.argv) > 1 else "all_stocks_5yr.csv", TICKERS)
    cfg = Cfg()  # v4 defaults
    tot, per, _ = run_all(data, cfg, TICKERS)
    print("v4.2 DEFAULTS:")
    print(f"  ALL: n={tot['n']} win={tot['win']:.1f}% PF={tot['pf']:.2f} avgR={tot['avgR']:+.2f}")
    for t in TICKERS:
        p = per[t]
        print(f"  {t:5s} n={p['n']:3d} win={p['win']:5.1f}% PF={p['pf']:5.2f} avgR={p['avgR']:+.2f}")
