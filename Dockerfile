ARG NODE_VERSION=stable
ARG COMMIT_SHA=master

FROM europe-west1-docker.pkg.dev/connectedcars-build/node-builder/master:$NODE_VERSION as builder

WORKDIR /app

USER builder

# Copy application code.
COPY --chown=builder:builder . /app

RUN npm ci

# Make sure to build code so we can run the tests
RUN npm run build

# Run ci checks
RUN npm run ci-audit

RUN npm run ci-jest

RUN npm run ci-eslint

# Run tests (to possibly fail build)
RUN npm test
