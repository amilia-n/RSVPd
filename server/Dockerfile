# syntax=docker/dockerfile:1
# This docker file starts the API
ARG NODE_VERSION=20

# Single stage build to keep all runtime dependencies
FROM node:${NODE_VERSION}-alpine
WORKDIR /app

# Install build dependencies and runtime requirements for native modules (argon2)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    tini \
    libstdc++ \
    libgcc

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY --chown=node:node . .

ENV NODE_ENV=production
USER node
EXPOSE 7777

ENTRYPOINT ["tini","--"]
CMD npm start