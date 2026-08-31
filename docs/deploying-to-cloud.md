# Deploying Ganiti to the cloud

Ganiti has two deployable pieces:

1. **Static site** — `index.html`, `style.css`, `js/` — goes to any static host.
2. **Ask AI API** — `server/app.py`, packaged by the root `Dockerfile` — goes to
   a container host. This is optional; skip it if you don't need the Ask AI tab.

The same source files serve local and cloud. `js/config.js` picks the API URL by
hostname: local hostnames hit `http://localhost:5000`, anything else hits the
deployed API.

## 1. Deploy the static site

Deploy the repo root (excluding `server/`) to any of:

- **GitHub Pages** — Settings -> Pages -> deploy from `main`
- **Netlify / Vercel / Cloudflare Pages** — connect the repo, no build command,
  publish directory = repo root
- **AWS S3 + CloudFront** — upload `index.html`, `style.css`, `js/`

The main files:

- `index.html` — page structure
- `style.css` — layout and themes
- `js/config.js`, `js/evaluator.js`, `js/calculator.js`, `js/tools.js`, `js/ai.js`

If you don't need Ask AI, you're done here.

## 2. Deploy the Ask AI API

The root `Dockerfile` packages the unmodified Flask app as a Lambda container
image using the AWS Lambda Web Adapter. The current deployment targets
**AWS Lambda + API Gateway**.

### Build and push the image

```bash
aws ecr create-repository --repository-name ganiti-api
docker build -t ganiti-api .
docker tag ganiti-api:latest <acct>.dkr.ecr.<region>.amazonaws.com/ganiti-api:latest
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com
docker push <acct>.dkr.ecr.<region>.amazonaws.com/ganiti-api:latest
```

### Create the Lambda function

- Package type: **Image**, pointing at the pushed image
- Environment variable: `NVIDIA_API_KEY` = your key (never commit it)
- Timeout: 30s (gunicorn's 60s worker timeout sits above this deliberately)
- Add an **API Gateway** trigger (HTTP API). Note the invoke URL, e.g.
  `https://xxxx.execute-api.<region>.amazonaws.com`

### Other hosts

`server/app.py` is a plain Flask app, so Render, Railway, Fly.io, or a container
service also work. Run it with `gunicorn -b :$PORT app:app` and set
`NVIDIA_API_KEY`.

## 3. Point the frontend at the deployed API

Edit `js/config.js` and set the non-local branch to your API's base URL (no
trailing slash, no `/api/ask`):

```js
const AI_API_BASE = IS_LOCAL_DEV
  ? 'http://localhost:5000'
  : 'https://YOUR-API-DOMAIN';   // <- your API Gateway / Render / etc. URL
```

Commit and redeploy the static site.

## 4. Lock down CORS

`server/app.py` currently allows all origins:

```python
CORS(app, resources={r"/api/*": {"origins": "*"}})   # local-dev only
```

Before any public deployment, pin it to your static site's origin:

```python
CORS(app, resources={r"/api/*": {"origins": "https://your-site-domain"}})
```

## Checklist

- [ ] Static site deployed
- [ ] API image built, pushed, and running (Lambda/other)
- [ ] `NVIDIA_API_KEY` set in the API host's environment, not in git
- [ ] `AI_API_BASE` in `js/config.js` updated to the deployed API URL
- [ ] CORS in `server/app.py` pinned to the frontend origin
- [ ] `server/.env` is gitignored (it is) and never pushed
