# NOTE: This Dockerfile is designed to be built from the monorepo root context.
# To build manually: docker build -f apps/agent/Dockerfile .
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY apps/agent/pyproject.toml .
RUN pip install . && pip install ddtrace

# Copy agent code
COPY apps/agent/src ./src

# Command to run the agent with Datadog APM auto-instrumentation
CMD ["ddtrace-run", "python", "-m", "src.agent"]
