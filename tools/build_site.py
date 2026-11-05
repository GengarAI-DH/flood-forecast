"""Assemble site/index.html from site/page.html plus the shared head and scripts."""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "site"
page = (root / "page.html").read_text()
head = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Flood Forecast</title>
<meta name="description" content="Spot trends early, see where they're headed, and keep an eye on world risk.">
<meta name="theme-color" content="#faf9f6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Flood Forecast">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<style>
:root{--color-fg:#1f1e1c;--color-fg-muted:#6b6862;--color-bg:#faf9f6;--color-panel:#ffffff;--color-border-line:#e4e1da;--color-ok:#2f7d4f;--color-warn:#b06d12;--color-bad:#b3362e;
--font-anthropic-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--font-anthropic-serif:Georgia,"Times New Roman",serif;
--cds-font-size-caption:12px;--cds-font-size-body:15px;--cds-font-size-heading:17px;--cds-font-size-title:26px;--cds-font-weight-medium:600;
--cds-gap-xs:4px;--cds-gap-sm:8px;--cds-gap-md:12px;--cds-gap-lg:20px;--cds-gap-xl:28px;--cds-pad-xs:4px;--cds-pad-sm:8px;--cds-pad-md:12px;--cds-pad-lg:16px;--cds-pad-xl:24px;--cds-radius:10px;
--cds-chart-grid:#eceae4;--cds-chart-axis:#bdb8ae;--cds-chart-reference:#9a958c;--cds-chart-muted:#cbc6bc;--cds-chart-status-critical:#d0572e;
--cds-surface-popover:#ffffff;--cds-border:#dedad2;--cds-shadow-popover:0 6px 20px rgba(0,0,0,.14);--cds-text-secondary:#6b6862;--cds-dur-slow:300ms;--cds-ease-out:cubic-bezier(.2,.8,.2,1)}
@media (prefers-color-scheme: dark){:root{--color-fg:#ecebe7;--color-fg-muted:#a3a097;--color-bg:#171614;--color-panel:#211f1c;--color-border-line:#36332e;--color-ok:#5cbf85;--color-warn:#e0a24a;--color-bad:#ec6b62;
--cds-chart-grid:#2c2a26;--cds-chart-axis:#55514a;--cds-chart-reference:#77736a;--cds-chart-muted:#4a4740;--cds-chart-status-critical:#f08156;--cds-surface-popover:#2a2824;--cds-border:#3e3a34;--cds-shadow-popover:0 6px 20px rgba(0,0,0,.5);--cds-text-secondary:#a3a097}}
html,body{margin:0;background:var(--color-bg);color:var(--color-fg);font-family:var(--font-anthropic-sans);-webkit-text-size-adjust:100%}
#dash-root{max-width:1100px;margin:0 auto;padding:12px max(16px, env(safe-area-inset-left)) 48px;box-sizing:border-box}
[data-appifact-content] b,.ff b{font-weight:600}
.dash-skeleton{color:transparent;background:var(--color-border-line);border-radius:6px}
</style>
<link rel="stylesheet" href="styles.css">
<script src="vendor/d3.v7.9.0.min.js"></script>
</head>
<body>
<div id="dash-root">
"""
tail = """</div>
<script src="runtime.js"></script>
<script src="calcs.js"></script>
<script src="ui.js"></script>
<script src="charts.js"></script>
<script src="alpha.js"></script>
</body>
</html>
"""
(root / "index.html").write_text(head + page + tail)
print("built", len(head + page + tail))
