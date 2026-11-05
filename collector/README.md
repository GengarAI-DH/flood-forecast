# Collector

A scheduled Claude task ("Flood Forecast signal collector") runs every 6 hours on Sonnet. The full instructions live in the scheduled task itself; this is the summary.

## Every run
1. Load the current signal list.
2. Search the last ~48 hours across nine signal types (Key people, World events, Politics, Stocks, News, Social, Funding, Jobs, Courses) and these areas: world powers, money and finance, stocks, AI, jobs, farming and food, oil and gas, electricity and the grid, water, infrastructure, plus consumer, culture and health.
3. Also watch huge businesses, small trending businesses, publicly disclosed big-trader filings, prediction-market odds shifts, and single-source "whispers".
4. Add only real, dated, sourced signals, written in its own words. Dedupe. Whispers need a second source within 14 days or get dropped.
5. Keep the newest 400 signals and publish them.

## Once a day
- Relearn influence-edge strengths from which signal types actually came before which.
- Rescore the world-risk gauge (six areas, 0 to 100, max 10 points a day unless a major event) from serious sources only, and check for a Doomsday Clock reset.

## Once a week
- Score calls made 30+ days earlier and log the hit rate.
- Check for new published catastrophe-odds estimates from reliable forecasting groups and expert surveys only.

## Ground rules
- No buy/sell advice; trades are signals of where money moved, never recommendations.
- Politically neutral: record what people and governments said or did, not opinions.
- Public statements and legally required disclosures only, never private details.
