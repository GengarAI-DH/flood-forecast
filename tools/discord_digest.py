"""Post today's Flood Forecast digest to a Discord channel.

Reads site/data/radar.json, finds the trends that heated up and cooled most over the
last 4 weeks plus the newest whisper, and posts them to the webhook in DISCORD_WEBHOOK.
"""
import datetime as dt
import json
import os
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE_URL = os.environ.get("SITE_URL", "").rstrip("/")
WEIGHT = {3: 1.0, 2: 0.5, 1: -0.5}


def heat_at(signals, day):
    total = 0.0
    for s in signals:
        d = dt.date.fromisoformat(s["date"])
        if d <= day:
            total += WEIGHT.get(s["heat"], 0) * 0.5 ** ((day - d).days / 90)
    return total


def main():
    upd = ROOT / "site/data/updated.json"
    if upd.exists():
        at = dt.datetime.fromisoformat(json.loads(upd.read_text())["at"].replace("Z", "+00:00"))
        age_h = (dt.datetime.now(dt.timezone.utc) - at).total_seconds() / 3600
        if age_h > 36:
            print(f"Data is {age_h:.0f} hours old, so no digest today (avoids reposting stale trends).")
            return
    radar = json.loads((ROOT / "site/data/radar.json").read_text())
    ref = max(dt.date.fromisoformat(s["date"]) for s in radar)
    then = ref - dt.timedelta(days=28)
    by = {}
    for s in radar:
        by.setdefault(s["field"], []).append(s)
    rows = []
    for field, sig in by.items():
        sig.sort(key=lambda s: s["date"], reverse=True)
        rows.append((field, heat_at(sig, ref) - heat_at(sig, then), heat_at(sig, ref), sig[0]))
    # Same fixed 0 to 100 heat score as the site (can't go above 100).
    import math
    score = lambda p: 100 * (1 - math.exp(-p / 8)) if p >= 0 else -100 * (1 - math.exp(p / 8))
    rows = [(f, score(h) - score(h - d), score(h), s) for f, d, h, s in rows]
    hot = [r for r in sorted(rows, key=lambda r: -r[1]) if r[1] > 0 and r[2] > 0][:3]
    cool = sorted(rows, key=lambda r: r[1])[:1]
    whispers = sorted((s for s in radar if s["signal"].lower().startswith("early whisper")), key=lambda s: s["date"], reverse=True)

    lines = [f"**Flood Forecast · {dt.date.today():%b %-d}**", ""]
    for f, d, _, s in hot:
        lines.append(f"🔥 **{f}** (heat +{d:.0f} in 4 weeks)\n> {s['signal']} ([{s['source']}]({s['url']}))")
    for f, d, _, s in cool:
        if d < 0:
            lines.append(f"🧊 **{f}** cooling (heat {d:.0f} in 4 weeks)\n> {s['signal']}")
    if whispers:
        w = whispers[0]
        lines.append(f"👀 **Whisper: {w['field']}**\n> {w['signal'].split(':', 1)[-1].strip()}")
    if SITE_URL:
        lines += ["", f"Full map and sources: {SITE_URL}"]
    lines.append("_Not financial advice._")
    content = "\n".join(lines)[:1990]

    hook = os.environ.get("DISCORD_WEBHOOK")
    if not hook:
        print(content)
        print("\n(DISCORD_WEBHOOK not set, so nothing was posted.)")
        return
    req = urllib.request.Request(hook, data=json.dumps({"content": content, "allowed_mentions": {"parse": []}}).encode(),
                                 headers={"Content-Type": "application/json", "User-Agent": "FloodForecastDigest/1.0"})
    with urllib.request.urlopen(req) as r:
        print("posted", r.status)


if __name__ == "__main__":
    main()
