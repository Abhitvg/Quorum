# Quorum

Quorum is a comprehensive real-time video conferencing and AI collaboration platform. Built as a Turborepo monorepo, it seamlessly integrates a modern web frontend, a robust API backend, and an intelligent AI agent participant using LiveKit. 

## 🏗️ Architecture

The project is structured as a turborepo with the following main applications and packages:

- **`apps/web`**: A modern frontend web application built with **Next.js 16**, React 19, and Tailwind CSS. It utilizes `@livekit/components-react` for seamless real-time video and audio integration.
- **`apps/api`**: A robust backend REST API built with **NestJS**. It handles user authentication (JWT & Google OAuth), meeting creation, LiveKit token generation, and database interactions using TypeORM with PostgreSQL.
- **`apps/agent`**: A sophisticated AI participant built in **Python** (`livekit-agents`). It leverages deepgram and elevenlabs for voice AI capabilities, allowing an intelligent agent to join meetings dynamically.
- **`infrastructure`**: **AWS CDK** configurations (TypeScript) to securely provision and deploy the platform's cloud infrastructure.
- **`packages/shared-types`**: Shared TypeScript definitions used across both frontend and backend.

## 🚀 Prerequisites

Ensure you have the following installed before getting started:
- Node.js (v20+)
- [pnpm](https://pnpm.io/) (v9.15+)
- Python 3.9+ (for the AI agent)
- Docker & Docker Compose (for the local database)

## 🛠️ Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Environment Variables:**
   Copy the `.env.example` file to `.env` at the root and fill in the necessary keys (LiveKit, Google OAuth, Database credentials):
   ```bash
   cp .env.example .env
   ```

3. **Start the local database (PostgreSQL + Redis):**
   ```bash
   pnpm db:up
   ```

4. **Run the development servers:**
   ```bash
   pnpm dev
   ```
   This will concurrently start the `web` and `api` environments.

## 🧪 Testing & Proper Proof of Concept

To verify that the core architecture and integration points are functioning as expected, we have provided an end-to-end API test script (`test-api.js`). This script provides **proper proof** that the backend properly integrates with LiveKit and handles database transactions seamlessly.

### Running the API Proof Test:
With the backend running (`pnpm dev` or `npm run start:api`), execute the test script:
```bash
node test-api.js
```

**Expected Output:**
```text
1. Logging in...
Logged in as: test2@quorum.com
2. Creating a meeting...
Meeting created: <meeting-uuid> Internal Test Meeting
3. Fetching token...
Token generated: YES
LiveKit URL: wss://your-project.livekit.cloud
SUCCESS! All API endpoints working beautifully.
```
This output serves as proof that the user authentication, database persistence (meeting creation), and secure LiveKit token generation are working flawlessly in tandem.

## 📦 Available Scripts

- `pnpm dev`: Starts the development servers across all apps.
- `pnpm build`: Builds all apps and packages for production.
- `pnpm test`: Runs test suites using Turbo.
- `pnpm db:up`: Starts the database container.
- `pnpm db:reset`: Drops and recreates the local database.
- `pnpm clean`: Cleans the turbo cache and removes `node_modules`.

## ☸️ Kubernetes (EKS) Deployment

The production infrastructure runs on **Amazon EKS** with Kustomize-based manifests in the `k8s/` directory.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    AWS EKS Cluster                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  quorum-web  │  │  quorum-api  │  │ quorum-agent│     │
│  │  (Next.js)   │  │  (NestJS)    │  │  (Python)   │     │
│  │  3 replicas   │  │  3 replicas   │  │  2 replicas  │     │
│  └──────┬───────┘  └──────┬───────┘  └─────────────┘     │
│         │                  │                              │
│  ┌──────┴──────────────────┴──────┐                      │
│  │     AWS ALB Ingress Controller  │                      │
│  └────────────────────────────────┘                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Datadog      │  │  Datadog      │                     │
│  │  Node Agent   │  │  Cluster Agent│                     │
│  │  (DaemonSet)  │  │  (2 replicas) │                     │
│  └──────────────┘  └──────────────┘                     │
└──────────────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐         ┌────┴────┐
    │ RDS     │         │ ElastiCache│
    │ Postgres│         │ Redis      │
    └─────────┘         └───────────┘
```

### Environments

| Environment | Branch | Overlay | Hosts |
|-------------|--------|---------|-------|
| Development | local | `k8s/overlays/development/` | localhost |
| Staging | `staging` / `develop` | `k8s/overlays/staging/` | `staging.quorum.atma-ai.co.in` |
| Production | `main` | `k8s/overlays/production/` | `quorum.atma-ai.co.in` |

### Deploying Manually

```bash
# 1. Configure kubeconfig
aws eks update-kubeconfig --name QuorumCluster --region eu-north-1

# 2. Deploy to production
kubectl apply -k k8s/overlays/production/

# 3. Deploy Datadog
kubectl apply -k k8s/base/datadog/

# 4. Verify
kubectl get pods -n quorum
kubectl get ingress -n quorum
```

### Building Docker Images

```bash
# From monorepo root:
docker build -f apps/api/Dockerfile -t quorum-api .
docker build -f apps/web/Dockerfile -t quorum-web .
docker build -f apps/agent/Dockerfile -t quorum-agent .
```

## 📊 Datadog Observability

Full-stack monitoring is powered by the **Datadog Operator** with:

- **APM Tracing**: Distributed traces across API → Web → Agent (auto-instrumented via `dd-trace` / `ddtrace`)
- **Log Collection**: All container stdout/stderr collected with service/source tags
- **Infrastructure Metrics**: Node, pod, and container-level resource monitoring
- **Live Processes**: Real-time process visibility inside containers
- **Network Performance**: Inter-service network traffic monitoring

### Setup (One-time)

```bash
# Install Datadog Operator
helm repo add datadog https://helm.datadoghq.com
helm install datadog-operator datadog/datadog-operator \
  --namespace datadog --create-namespace

# Create Datadog API key secret
kubectl create secret generic datadog-secret \
  --from-literal api-key=<YOUR_DD_API_KEY> \
  -n datadog

# Apply Datadog Agent configuration
kubectl apply -k k8s/base/datadog/
```

### Unified Service Tagging

All services are tagged with `env`, `service`, and `version` labels for correlation:

| Service | `DD_SERVICE` | Language | APM Method |
|---------|-------------|----------|------------|
| API | `quorum-api` | Node.js | `--require dd-trace/init` |
| Web | `quorum-web` | Node.js | `--require dd-trace/init` |
| Agent | `quorum-agent` | Python | `ddtrace-run` |

