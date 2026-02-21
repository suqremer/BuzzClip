FROM python:3.11-slim AS base

WORKDIR /app

RUN adduser --disabled-password --no-create-home appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x start.sh

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["./start.sh"]
