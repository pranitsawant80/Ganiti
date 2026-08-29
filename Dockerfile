# Deploy-only: packages the existing Flask app (server/app.py) as a Lambda
# container image. The AWS Lambda Web Adapter lets the unmodified Flask/gunicorn
# server run inside Lambda behind API Gateway. No application code is changed.
FROM public.ecr.aws/docker/library/python:3.12-slim

# Lambda Web Adapter: bridges API Gateway <-> a normal HTTP server on :8080
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
RUN chmod +x /opt/extensions/lambda-adapter

WORKDIR /var/task

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY server/app.py ./

# gunicorn worker timeout (60s) sits above the Lambda / API Gateway timeout (30s)
CMD ["gunicorn", "-b", ":8080", "-w", "2", "--threads", "8", "-t", "60", "app:app"]
