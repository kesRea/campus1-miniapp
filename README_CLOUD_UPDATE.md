# Campus №1 — Cloud Source

This repository is the source of truth for Campus №1.

- Root files (`index.html`, `app.js`, `styles.css`, `version.json`) = GitHub Pages frontend.
- `backend/` = Apps Script source with secret placeholders only.
- `.github/workflows/deploy-apps-script.yml` = automatic Apps Script production deploy.
- Secrets are stored in GitHub Actions, not committed to the repository.

Important:
- Never commit a Telegram bot token, OpenAI key, Google refresh token, or raw `.clasprc.json`.
- `backend/` is safe to edit from another computer.
- A push to `backend/**` automatically updates the existing Apps Script deployment.
