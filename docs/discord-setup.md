# Discord server plan

Goal: a place people check every day, with phone push notifications they choose.

## Server name

Flood Forecast (or One Guy AI: Flood Forecast)

## Channels

**START HERE**
- `#welcome` – what Flood Forecast is, how to read the trend map, not-financial-advice note
- `#pick-your-alerts` – reaction roles so people opt in to pings

**ALERTS** (read-only, the collector posts here)
- `#daily-brief` – once a day: 3 trends heating up, 1 whisper, world risk level
- `#breakouts` – a trend jumps a stage (for example Emerging → Hot now)
- `#whispers` – brand-new early sightings, confirmed or dropped within 14 days
- `#big-money` – funding rounds, huge-business moves, public trade filings
- `#world-risk` – daily gauge change and any Doomsday Clock news
- `#career-trends` – job-market signals for tech, AI, robotics and trades

**TALK**
- `#discussion`
- `#your-calls` – members post their own predictions
- `#scorecard` – weekly: what the model called, what came true, hit rate

## Roles for pings

- @Breakouts, @Whispers, @BigMoney, @WorldRisk, @Careers, @DailyBrief
- Members react in `#pick-your-alerts` to get a role. Alerts @-mention only that role, so nobody gets spammed by things they didn't pick.

## How alerts get posted

Each alert channel gets a Discord webhook (Channel settings → Integrations → Webhooks → New webhook → Copy URL).

The collector would post a short message to the right webhook at the end of each run. Two things to sort out first:

1. **Network access.** The scheduled collector runs in a cloud sandbox whose outbound access is limited. Posting to Discord webhooks needs to be tested; if it's blocked, the fallback is a small relay (for example a Cloudflare Worker) that the dashboard or a connector can reach.
2. **Keep webhook URLs secret.** Anyone with the URL can post to the channel. Don't commit them to this repo; store them as secrets.

## Message style

- Breakout: `🔥 Padel moved Emerging → Hot now. Heat 1.8 (+0.6 this week). 4 signals. [dashboard link]`
- Whisper: `👀 Early whisper: <one line>. Source: <outlet>. Confirms or drops by <date>.`
- World risk: `🌍 World stress 49 (Elevated, flat). Biggest mover: Grid, water and food ↑ 5.`

Keep world-risk posts calm and factual. No doom bait.
