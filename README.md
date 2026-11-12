# 🔥 Roast My GitHub Issue

Paste a GitHub issue. Get a score out of 100 and the roast you deserve.

A static, dependency-free web app that judges how badly you've described your task — on **clarity**, **specificity** and **completeness** — then tells you exactly what's missing (repro steps, expected behaviour, acceptance criteria, evidence…). Every joke is tied to a detected weakness. No AI, no API keys, no mercy.

## Features

- 📋 Paste any issue title + description, or drop in a **public GitHub issue URL** and it's fetched automatically via the GitHub REST API
- 🎯 Transparent, rule-based score out of 100 (Clarity /35 · Specificity /35 · Completeness /30) with a per-point breakdown
- 🔥 Context-aware roasts — 17 detectable weaknesses, each with its own pool of jokes, from gentle mockery to absolute devastation
- 🧾 A constructive "what's missing" section with hints for fixing each gap
- 📣 One-click **copyable scorecard for X** (≤280 chars) plus a Post-on-X intent link
- 🌗 Dark, screenshot-ready design, animated score gauge, fully responsive
- 🔒 Everything runs client-side. The only network call is the optional GitHub issue fetch

## Run it locally

No build step. Any static file server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` straight from disk also works — the clipboard fallback handles non-HTTPS contexts.)

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait a minute or two. Your site will be live at:

   `https://<your-username>.github.io/<your-repo>/`

That's it — `index.html`, `styles.css` and `script.js` are the whole app. If you prefer the `docs/` folder workflow or a custom GitHub Actions workflow, both work unchanged; just keep the three files at the served root.

## How the scoring works

| Pillar | Max | Rewarded |
|---|---|---|
| Clarity | 35 | Proper summary title, full sentences, headings/bullets, absence of vague waffle; penalties for vague terms, "it doesn't work" non-descriptions and ALL-CAPS shouting |
| Specificity | 35 | Error messages/stack traces, version numbers, code snippets & file paths, environment details, concrete identifiers/URLs |
| Completeness | 30 | Reproduction steps, expected behaviour, actual behaviour, environment, acceptance criteria, logs/screenshots/links (5 pts each) |

Score bands: **90+** Suspiciously Excellent · **75–89** Mildly Toasted · **50–74** Medium Roast · **25–49** Well Done · **0–24** Cremated.

The full rule engine lives in `script.js` (`analyzeText`, `scoreIssue`) and is intentionally readable — every point in the UI maps to a rule you can audit.

## Notes & limits

- The GitHub API allows **60 unauthenticated requests/hour per IP**. The site detects rate limits and tells you when it resets — pasting the issue text always works.
- Private repos return 404 from the public API; the error message covers that.
- No tracking, no cookies, no external services (the Google Fonts link degrades gracefully to system fonts offline).

Roast responsibly. Then write better issues.
