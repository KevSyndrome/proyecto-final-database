# Lightweight image that serves only the BI dashboard (used by Railway).
FROM python:3.11-slim
WORKDIR /app
COPY dashboard/requirements.txt dashboard/requirements.txt
RUN pip install --no-cache-dir -r dashboard/requirements.txt
COPY dashboard/ dashboard/
COPY data/processed/superstore_clean.csv data/processed/superstore_clean.csv
ENV PORT=8050
EXPOSE 8050
CMD gunicorn dashboard.app:server --bind 0.0.0.0:${PORT} --workers 2 --timeout 120
