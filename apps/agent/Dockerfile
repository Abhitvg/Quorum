# NOTE: This Dockerfile is designed to be built from the monorepo root context.
# To build manually: docker build -f apps/agent/Dockerfile .
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY apps/agent/pyproject.toml .
RUN pip install .

# Copy agent code
COPY apps/agent/src ./src

# Command to run the agent
CMD ["python", "-m", "src.agent"]
