# PortfolioCMS — Render Free tier Dockerfile
# Small + fast: python:3.11-slim, single uvicorn worker (~100-200MB RAM).

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000

WORKDIR /app

# Install deps first (better layer caching: rebuilds are fast when only code changes)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app
COPY app.py main.py config.py storage.py security.py routes_auth.py routes_dashboard.py routes_public.py ./
COPY templates/ ./templates/
COPY static/ ./static/

# Writable dirs for JSON "database" + resume uploads.
# NOTE: Render Free has an ephemeral filesystem — data resets on redeploy/restart
# unless you attach a paid Persistent Disk and set DATA_DIR to it.
RUN mkdir -p /app/data /app/static/uploads

EXPOSE 10000

# Render injects $PORT (default 10000). Must bind 0.0.0.0, NOT 127.0.0.1.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
