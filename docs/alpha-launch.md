# Alpha launch (Embergate Discord)

1. GitHub: create private repo GengarAI-DH/flood-forecast (no README). Claude pushes the code.
2. Cloudflare: Workers & Pages → Create → Pages → Connect to Git → pick flood-forecast.
   - Production branch: main
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: site
3. Discord: create #flood-forecast → Edit Channel → Integrations → Webhooks → New Webhook → Copy Webhook URL.
4. GitHub repo → Settings → Secrets and variables → Actions:
   - Secrets → New repository secret: DISCORD_WEBHOOK = the webhook URL
   - Variables → New repository variable: SITE_URL = your pages.dev link
5. GitHub → Actions → Daily Discord digest → Run workflow (test post).
6. Post the link in Discord. On iPhone: Safari → Share → Add to Home Screen.
