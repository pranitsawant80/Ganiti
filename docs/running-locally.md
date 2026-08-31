# Running Ganiti locally

Everything runs from the files at the repo root. The static calculator needs
nothing installed; only the **Ask AI** tab needs the Python backend.

## 1. Serve the frontend

Option A — just open the file:

- Double-click `index.html`. Every tab works except Ask AI needs step 2.

Option B — serve the folder (recommended, closer to production):

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

`js/config.js` auto-detects `localhost`, `127.0.0.1`, and `file://`, so the
frontend automatically calls the local API at `http://localhost:5000` — no
config edits needed.

## 2. Run the Ask AI backend (optional)

```bash
cd server
pip install -r requirements.txt
```

Provide an NVIDIA API key, either by copying the example env file:

```bash
cp .env.example .env       # then edit .env and set NVIDIA_API_KEY
```

or by exporting it directly:

```bash
export NVIDIA_API_KEY=your-key-here     # Windows PowerShell: $env:NVIDIA_API_KEY = "your-key-here"
```

Start the server:

```bash
python app.py
```

It listens on `http://localhost:5000`. The wide-open CORS in `app.py` is fine
for local use — see [deploying-to-cloud.md](deploying-to-cloud.md) before
exposing it publicly.

## 3. Use it

Reload `index.html` / the `http.server` page. The Ask AI tab now posts to
`http://localhost:5000/api/ask`; the AI returns an expression string and
Ganiti's own evaluator computes the result.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Ask AI shows an error toast | Backend not running, or `NVIDIA_API_KEY` unset |
| `RuntimeError: NVIDIA_API_KEY is not set` | Create `server/.env` or export the variable |
| Ask AI calls the AWS URL instead of localhost | You opened the site from a non-local hostname; use `localhost`/`127.0.0.1` or `file://` |
