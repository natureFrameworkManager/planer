ARG INCLUDE_FRONTEND=true

FROM python:3.14-slim AS base

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./backend /code/backend

FROM base AS frontend-true
COPY ./frontend /code/frontend

FROM base AS frontend-false

FROM frontend-${INCLUDE_FRONTEND}

RUN useradd -u 8888 appuser && chown -R appuser:appuser /code

USER appuser

WORKDIR /code/backend

# CMD ["fastapi", "run", "main.py", "--port", "80"]

# If running behind a proxy like Nginx or Traefik add --proxy-headers
CMD ["fastapi", "run", "main.py", "--port", "80", "--proxy-headers"]