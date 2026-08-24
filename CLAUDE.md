# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ganiti is a no-build, static calculator web app: `index.html` + `style.css` + `script.js`, plus an optional Flask backend for an "Ask AI" tab. There is no package.json, bundler, build step, test suite, or linter.

## Running it

**Frontend** — open `index.html` directly in a browser, or serve it:
```bash
python -m http.server 8000
# then visit http://localhost:8000
```

**Backend** (only needed for the "Ask AI" tab):
```bash
cd server
pip install -r requirements.txt
# copy server/.env.example to server/.env and set NVIDIA_API_KEY, or export it directly
python app.py   # serves http://localhost:5000
```

Without the backend running, every other tab works normally — only "Ask AI" errors.

## Architecture

### Frontend (`script.js`)

All calculator logic lives in this single file — no modules, no bundler.

- **Core state**: `expression`, `result`, `memory`, `angleMode`, the undo/redo `history` stack, `calculationHistory`, and `variables` (`x`/`y`) are plain top-level variables. `calculationHistory`, `variables`, and theme persist to `localStorage` under `ganiti-*` keys — there is no server-side state.
- **Expression evaluator**: a hand-rolled recursive-descent parser — not `eval()` and not a math library. Pipeline: `tokenize()` -> `withImplicitMultiplication()` -> `evaluate()`, where `evaluate()` itself descends through `primary` -> `power` -> `postfix` -> `term` -> `expressionParser`. It handles implicit multiplication (`2π`), factorial (`!`), percent (`%`), `mod`, degree/radian-aware trig, and the `x`/`y`/`ans` constants.
  - **When adding an operator or function**: you must touch `tokenize()`, `withImplicitMultiplication()`, and the relevant `evaluate()` sub-parser together — missing one will silently break parsing or precedence.
- **Tool tabs**: Convert, Finance, Equation, Graph, Data, Programmer, and Ask AI are independent panels switched via `.tool-tabs`. Each wires its own button click handler in `script.js` and does not share state with the core calculator — except Graph and Ask AI, which both reuse the core `evaluate()` and `formatNumber()` functions.
- **Ask AI flow**: the frontend posts the question to a hardcoded `http://localhost:5000/api/ask`, then evaluates the *returned expression string* itself using the same evaluator. The AI never computes the final number, so results stay exact even if the model is imprecise.

### Backend (`server/app.py`)

A single-route Flask app: `POST /api/ask`, calling an NVIDIA-hosted OpenAI-compatible model.

- The system prompt forces raw JSON output: `{"expression", "explanation"}`.
- `extract_json()` strips markdown fences before parsing the model's response.
- Requires `NVIDIA_API_KEY` (see `server/.env.example`).
- CORS is wide open (`origins: "*"`) — this is explicitly local-dev only and **must be pinned** before any real deployment.
