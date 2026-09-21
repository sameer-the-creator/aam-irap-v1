# IRAP — Interactive Readiness-Assessment Platform

A self-service diagnostic that helps regional and small airport staff assess their airport's readiness for Advanced Air Mobility (AAM) operations — eVTOL/AAM ground infrastructure, vertiports, and related use cases.

This is a working prototype: fill out a guided questionnaire, get a category-by-category readiness snapshot with plain-language strengths, gaps, barriers, and recommended next actions.

## Running it

No build step, no dependencies, no backend. It's a static site.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## How it works

- **Intake** (`assets/questions.js`): a 5-category questionnaire (Demand & Public Value, Strategic Fit & Community Context, Technical & Infrastructure Readiness, Sustainability & Environmental Factors, Current Operations) using multiple choice, multi-select, and short free text — all answerable from information an airport manager already has.
- **Scoring** (`assets/scoring.js`): a transparent, rule-based engine. Every answer option carries an explicit point value; category scores are simple sums normalized to a percentage and mapped to one of four readiness tiers. Barriers and priority actions come from an inspectable list of condition → recommendation rules — no black-box model, so the logic can be explained line-by-line to an airport board.
- **Results**: a category-by-category breakdown, auto-derived strengths/gaps (from the highest/lowest-scoring answers), curated current barriers, and prioritized next actions.
- **Resources** (`assets/content.js`): static placeholder educational content on AAM basics and funding pathway categories.
- **Persistence**: assessments are saved to `localStorage` in the browser so you can demo multiple airport profiles side by side. There's no server-side storage — this is a single-session demo tool.

## Project structure

```
index.html            entry point
assets/
  styles.css           all styling
  icons.js             small inline icon set
  questions.js         question bank + category metadata
  scoring.js           scoring engine + barrier/action rules
  content.js           static Resources page content
  app.js               routing, rendering, state, local persistence
```
