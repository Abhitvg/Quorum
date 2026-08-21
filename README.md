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
