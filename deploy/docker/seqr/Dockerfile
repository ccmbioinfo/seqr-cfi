############################
# UI build (Node.js 14 only)
############################
FROM node:14-bullseye AS ui-build
#LABEL maintainer="Broad TGG"

WORKDIR /build/ui

# Copy package metadata first for better caching
COPY ./ui/package.json .
COPY ./ui/package-lock.json .

# npm v7 for lockfile v2 compatibility
RUN npm install -g npm@7.24.2 \
    && npm ci
RUN npx update-browserslist-db@latest
# Copy the rest of the UI source and build
COPY ./ui/ .
RUN npm run build


############################
# Python build stage
############################
FROM python:3.11-slim-bullseye AS build
#LABEL maintainer="Broad TGG"

# install commmon utilities, database clients for debugging
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-utils \
    bzip2 \
    curl \
    gcc \
    # git needed for the nodejs install
    git \
    libc6-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /opt

COPY ./requirements.txt .

# install seqr python dependencies
RUN pip install --no-cache-dir wheel && \
    pip install --no-cache-dir -U setuptools && \
    pip install --no-cache-dir -r requirements.txt

#############################
# Main Container stage
############################
FROM python:3.11-slim-bullseye as runtime
LABEL org.opencontainers.image.source="https://github.com/ccmbioinfo/seqr-cfi"
LABEL org.opencontainers.image.authors="Centre for Computational Medicine, Hospital for Sick Children"
LABEL org.opencontainers.image.title="seqr-cfi"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN apt-get update && apt-get install -y --no-install-recommends \
    cron \
    curl \
    emacs \
    vim \
    gnupg \
    htop \
    less \
    libpq-dev \
    nano \
    postgresql-client \
    procps \
    redis-tools \
    xterm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# install gcloud tools
RUN echo "deb http://packages.cloud.google.com/apt cloud-sdk-bullseye main" > /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - \
    && apt-get update && apt-get install -y --no-install-recommends \
    google-cloud-sdk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy django files
WORKDIR /seqr
COPY admin/ ./admin
COPY clickhouse_search/ ./clickhouse_search
COPY matchmaker/ ./matchmaker
COPY panelapp/ ./panelapp
COPY reference_data/ ./reference_data
COPY seqr/ ./seqr
COPY manage.py settings.py wsgi.py ./

# Copy compiled ui and environment
COPY --from=ui-build /build/ui/dist /seqr/ui/dist
COPY --from=build /opt/venv /opt/venv

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN ./manage.py collectstatic --no-input

EXPOSE 8000

ENV TERM=xterm

COPY deploy/docker/seqr/readiness_probe /
COPY deploy/docker/seqr/wait_for_routes /
COPY deploy/docker/seqr/bin/*.sh /usr/local/bin/
COPY deploy/docker/seqr/config/*.py ./
COPY deploy/docker/seqr/bashrc /root/.bashrc
COPY deploy/docker/seqr/entrypoint.sh /

CMD [ "/entrypoint.sh" ]
