# The following Docker setup expects a config file to be mounted at:
#
#     /home/tracksix/.tracksix.config.json
#
# E.g.
#
#  docker run -v /path/to/local/config.json:/home/tracksix/.tracksix.config.json ghcr.io/bencevans/tracksix:latest
#

FROM node:lts-alpine

RUN addgroup -S tracksix && adduser -S -G tracksix tracksix
USER tracksix

# Set working directory
WORKDIR /app

# Install dependencies
COPY --chown=tracksix:tracksix package*.json ./
RUN npm ci --only=production

# Copy application code
# Using --chown to set ownership to tracksix user
COPY --chown=tracksix:tracksix . .

ENTRYPOINT [ "node", "bin.js" ]
