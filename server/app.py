import json
import os
import re

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY")
if not NVIDIA_API_KEY:
    raise RuntimeError("NVIDIA_API_KEY is not set. Copy server/.env.example to server/.env and fill it in.")

client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NVIDIA_API_KEY)

SYSTEM_PROMPT = """You are a math-expression translator for the Ganiti calculator. Given a natural-language question, respond with ONLY a single raw JSON object (no Markdown fences, no extra text) of the exact shape:
{"expression": "<expression>", "explanation": "<short explanation>"}

Rules for "expression":
- Use only: + - * / ^ (power) % (percent, means divide-by-100) ! (factorial) ( )
- Allowed functions: sin cos tan asin acos atan log ln sqrt cbrt abs
- Allowed constants: pi, e
- Do not include units, words, or any other characters.
- Do not compute or simplify the result yourself - return the expression only.
- Do not use ** for power, use ^. Do not use unicode multiply/divide signs.

Rules for "explanation":
- One or two short sentences restating what the expression represents.
- Never state a numeric result or guess the answer.

If the question cannot be turned into a math expression, set "expression" to "" and explain why in "explanation"."""

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # local-dev only; pin to the frontend origin before any non-local deployment


def extract_json(content):
    content = content.strip()
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.MULTILINE).strip()
    match = re.search(r"\{.*\}", content, flags=re.DOTALL)
    if match:
        content = match.group(0)
    return json.loads(content)


@app.route("/api/ask", methods=["POST"])
def ask():
    body = request.get_json(silent=True) or {}
    question = (body.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Enter a question first."}), 400

    try:
        completion = client.chat.completions.create(
            model="nvidia/nemotron-3.5-lightning-30b-a3b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0.2,
            top_p=0.95,
            max_tokens=2048,
            stream=False,
            # nemotron-3.5 ignores plain "detailed thinking off" text and burns the
            # whole token budget on a reasoning monologue, truncating the JSON. This
            # is the real switch that turns thinking off for this model.
            extra_body={"chat_template_kwargs": {"enable_thinking": False}},
        )
    except Exception:
        return jsonify({"error": "The AI service could not be reached. Try again shortly."}), 502

    content = completion.choices[0].message.content or ""
    try:
        parsed = extract_json(content)
        expression = parsed["expression"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return jsonify({"error": "The AI did not return a valid expression. Try rephrasing your question."}), 422

    return jsonify({"expression": expression, "explanation": parsed.get("explanation", "")})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
