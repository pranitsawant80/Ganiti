// Environment configuration. Edit AI_API_BASE below when deploying the API
// separately from the static site (e.g. AWS: static on S3/CloudFront, API on
// EC2/Lambda/API Gateway) — everything else in js/ reads from this constant.
// Auto-detects local dev (localhost/127.0.0.1) so `python -m http.server` and
// double-clicking index.html keep working against the local Flask server.

const IS_LOCAL_DEV =
  location.protocol === 'file:' ||
  location.hostname === '' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '[::1]';

const AI_API_BASE = IS_LOCAL_DEV
  ? 'http://localhost:5000'
  : 'https://mgetdyieqd.execute-api.us-east-1.amazonaws.com';

const AI_ENDPOINT = `${AI_API_BASE}/api/ask`;
