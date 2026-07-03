# Backtest tooling for fib_strategy_v4.pine

- `backtest.py` - Python port of the Pine logic (TradingView-style fills); runs the shipped defaults on the 10 test tickers.
- `search.py` - coarse grid search with a dev-ticker gate.
- `refine.py` - fine grid, dev/holdout gate, and per-ticker detail for the finalist.

Data (not committed, ~29 MB):

```bash
curl -LO https://raw.githubusercontent.com/plotly/datasets/master/all_stocks_5yr.csv
```

Run everything from inside this directory.
