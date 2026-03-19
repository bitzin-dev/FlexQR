FROM python:3.12-slim

# Keep Python output unbuffered and avoid generating bytecode in the container.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/ /app/

RUN python -m pip install --upgrade pip \
    && pip install -e .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
