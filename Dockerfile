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

# Install cron and gosu (gosu gives clean exec into appuser without sudo)
RUN apt-get update && apt-get install -y --no-install-recommends cron gosu && \
    rm -rf /var/lib/apt/lists/*

# Persistent data volume — symlink the SQLite db out of the image layer so
# it survives container rebuilds when /data is mounted from the host.
RUN mkdir -p /data && \
    ln -sf /data/database.db /code/backend/database.db

# Daily cron job: re-run parse_and_populate at 03:00
RUN echo 'SHELL=/bin/bash' > /etc/cron.d/planer-parse && \
    echo '0 3 * * * appuser cd /code/backend && /usr/local/bin/python3 -c "from database.parse import parse_and_populate; parse_and_populate()" >> /var/log/planer-cron.log 2>&1' \
    >> /etc/cron.d/planer-parse && \
    chmod 0644 /etc/cron.d/planer-parse

# Pre-create cron log file so appuser can write to it
RUN touch /var/log/planer-cron.log

# Entrypoint: start cron daemon, then exec FastAPI as appuser (PID 1)
RUN echo '#!/bin/bash'                                                                      > /entrypoint.sh && \
    echo 'set -e'                                                                          >> /entrypoint.sh && \
    echo '/usr/sbin/cron'                                                                  >> /entrypoint.sh && \
    echo 'exec gosu appuser fastapi run main.py --port 80 --proxy-headers'                >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

RUN useradd -u 8888 appuser && \
    chown -R appuser:appuser /code /data /var/log/planer-cron.log

WORKDIR /code/backend

# CMD ["fastapi", "run", "main.py", "--port", "80"]

# If running behind a proxy like Nginx or Traefik add --proxy-headers
# CMD ["fastapi", "run", "main.py", "--port", "80", "--proxy-headers"]
CMD ["/entrypoint.sh"]