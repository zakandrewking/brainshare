FROM python:3.12-slim-bullseye

# Install git
RUN apt update \
    && apt install -y git gcc tmux procps bash curl

# Configure Poetry
ENV POETRY_VERSION=1.8.2
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VENV=/opt/poetry-venv
ENV POETRY_CACHE_DIR=/opt/.cache

# Install poetry separated from system interpreter
RUN python -m venv $POETRY_VENV \
    && $POETRY_VENV/bin/pip install -U pip setuptools \
    && $POETRY_VENV/bin/pip install poetry==${POETRY_VERSION}

# Add `poetry` to PATH
ENV PATH="${PATH}:${POETRY_VENV}/bin"

WORKDIR /app

# get overmind
RUN curl -L -o overmind.gz https://github.com/DarthSim/overmind/releases/download/v2.4.0/overmind-v2.4.0-linux-amd64.gz && \
    gunzip overmind.gz && \
    chmod +x overmind && \
    mv overmind /usr/local/bin/overmind

# Install dependencies
COPY poetry.lock pyproject.toml ./
RUN poetry install --without=dev --no-interaction

COPY . /app/
COPY fly-debugger/Procfile /app/

CMD ["overmind", "start"]
