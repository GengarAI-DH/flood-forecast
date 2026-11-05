# Flood Forecast

Spot trends early, see where they're headed, and keep an eye on world risk.

Flood Forecast tracks any trend sweeping anything (tech, careers, money, energy, food, water, culture) and places each one on its lifecycle:

**Emerging → Money pours in → Goes mainstream → How-tos boom → Social flood → Crowded**

A research collector runs every 6 hours, logs dated and sourced signals, and the dashboard turns them into a trend map, forecasts that reach further out as data builds, an influence network that relearns itself, and a world-risk panel built only from published forecaster and expert estimates.

Built by Devin (buildswithdevin / One Guy AI).

## What's in here

| Folder | What it is |
|---|---|
| `dashboard/` | The dashboard page (`index.html`) and a snapshot of its data files |
| `model/` | The original flood-timing model and leave-one-out backtest (Python) |
| `collector/` | The instructions the scheduled research collector follows |
| `docs/` | Discord setup plan and the growth roadmap |

## How it works

1. **Signals.** Each signal is one dated, sourced fact tagged with a trend, a signal type (Key people, World events, Politics, Stocks, News, Social, Funding, Jobs, Courses), a lifecycle stage and a heat score (3 heating, 2 building, 1 crowding).
2. **Heat.** Each signal adds heat that fades by half every 90 days.
3. **Influence network.** Signal types push each other with a strength and lead time (for example funding leads job spikes by about 18 months). Strengths are relearned daily from which signals actually came before which.
4. **Forecast reach.** The forecast can see about half as far ahead as the history it has, stretched or shrunk by its hit rate, capped at five years.
5. **Accuracy.** Each week the collector scores calls made 30+ days earlier against what actually happened.
6. **World risk.** A daily stress gauge (0 to 100 per risk area) plus published probability estimates pooled with the geometric mean of odds.

## Honest limits

- Past-trend stage years are estimates from documented history, not measured series.
- Catastrophe and extinction odds can't be checked against outcomes; they are informed judgment.
- Nothing here is financial advice. Big-trader signals come from public filings that lag by up to 45 days.

## Live version

The live dashboard runs as a Claude artifact and is updated by the scheduled collector. The data files in `dashboard/data/` are a snapshot from setup day.
