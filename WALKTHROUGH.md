# Quorum - Comprehensive System Walkthrough

Welcome to the definitive technical walkthrough of the **Quorum** project. Quorum is a modern, real-time video conferencing platform built as a Turborepo monorepo. It features a robust web interface, a scalable backend API, an autonomous AI participant (the "Quo" agent), and automated AWS infrastructure provisioning.

---

## 🏗️ 1. Architecture Overview

Quorum is built using the **Turborepo** monorepo architecture, utilizing `pnpm` workspaces for efficient dependency management.

```text
quorum/
├── apps/
│   ├── web/           # Next.js 16 Frontend
│   ├── api/           # NestJS REST Backend
│   └── agent/         # Python LiveKit AI Agent
├── packages/
│   ├── shared-types/  # TypeScript Interfaces shared across web & api
│   └── config/        # ESLint, Prettier, TypeScript configs
├── infrastructure/    # AWS CDK Deployment Scripts
└── docker/            # Docker compose for local DB & Redis
```

---

## 🖥️ 2. Frontend: Web Application (`apps/web`)

The frontend is built with **Next.js 16** (App Router), **React 19**, and styled with **Tailwind CSS v4**. 

### Key Directories & Routes
- `src/app/page.tsx`: The landing page.
- `src/app/login/` & `src/app/register/`: Authentication views interacting with the NestJS API.
- `src/app/dashboard/`: The user dashboard to create or join existing meetings.
- `src/app/room/`: The core video conferencing interface. Uses LiveKit components (`LiveKitRoom`, `VideoConference`) to render the meeting room.
- `src/app/providers.tsx`: Wraps the application in context providers for auth and data fetching.

### Real-Time Integration
The Next.js app communicates with LiveKit using `@livekit/components-react`. It fetches a secure WebSocket URL and token from the NestJS backend and mounts the `<LiveKitRoom>` component, which automatically negotiates WebRTC connections, handles audio/video publication, and network fallback.

---

## ⚙️ 3. Backend: REST API (`apps/api`)

The backend is built using **NestJS**, utilizing **TypeORM** for PostgreSQL database interactions and **Passport** for secure authentication.

### Core Endpoints (`/meetings`)

The `MeetingsController` exposes the following key endpoints (secured by `JwtAuthGuard`):

- `POST /meetings` - Creates a new meeting entity in the DB.
- `GET /meetings` - Lists all meetings scoped to the user's Organization.
- `GET /meetings/:id` - Retrieves meeting details.
- `POST /meetings/:id/token` - Generates a secure LiveKit join token for the participant.
- `POST /meetings/:id/summon-agent` - Triggers the AI agent to join the specified meeting.
- `POST /meetings/:id/end` - Terminates the meeting.

**Host & Recording Controls (LiveKit Integration):**
- `GET /meetings/:id/participants` - Lists all participants in the LiveKit room.
- `POST /meetings/:id/participants/:identity/mute` - Remotely mutes/unmutes a participant's track.
- `DELETE /meetings/:id/participants/:identity` - Kicks a participant from the room.
- `POST /meetings/:id/recording/start` & `stop` - Controls room recordings (Egress).

### Internal Transcripts API
The API also exposes an internal route (`/internal/transcripts`) shielded by an `INTERNAL_API_KEY`. The AI agent uses this route to persist real-time STT (Speech-to-Text) transcripts to the database.

---

## 🤖 4. AI Participant: The "Quo" Agent (`apps/agent`)

The Quorum agent is an autonomous Python application utilizing the `livekit-agents` framework.

### State Machine (`src/agent.py`)
1. **Connection**: Connects as an `AUDIO_ONLY` participant. It updates its state (`agentState: idle, researching, responding`) via LiveKit participant attributes, allowing the React UI to visually reflect the agent's status.
2. **Speech-to-Text (STT)**: Uses the **Deepgram** plugin (`nova-3-general`) to transcribe audio continuously.
3. **Transcription Sync**: Every time speech is detected, the agent pushes the transcript securely to the backend via `POST /internal/transcripts`.
4. **Wake Word Detection**: The agent listens for its name ("quo"). If detected in the transcript, it switches to `researching` mode.
5. **LLM Processing**: The query is sent to an **OpenAI GPT-4o-mini** model via an `OpenAIProvider` to generate a context-aware response.
6. **Text-to-Speech (TTS)**: The text is passed to **ElevenLabs** for voice synthesis.
7. **Audio Publication**: The agent creates an audio track, streams the synthesized voice into the LiveKit room, and reverts its state to `idle`.

---

## ☁️ 5. Infrastructure Setup (`infrastructure/`)

Quorum is deployed to AWS using the **AWS Cloud Development Kit (CDK)** defined in `infrastructure-stack.ts`.

### Deployed AWS Resources:
1. **VPC**: A VPC with Public and Private subnets (with a NAT Gateway).
2. **Database & Cache**: 
   - **Amazon ElastiCache (Redis)**: Runs on a `cache.t3.micro` instance in private subnets for caching and message brokering.
   - **Amazon RDS**: The backend relies on an RDS PostgreSQL database (iam authentication enabled).
3. **API Service (ECS Fargate)**: 
   - The NestJS app is containerized and deployed to **ECS Fargate**.
   - It sits behind an Application Load Balancer with an SSL certificate (`api.quorum.atma-ai.co.in`).
   - Secrets (JWT, LiveKit keys, S3 credentials) are securely injected from **AWS Secrets Manager**.
4. **Agent Service (ECS Fargate)**:
   - The Python LiveKit agent runs as a background Fargate service in the private subnet. It scales independently from the API and communicates with Redis.
5. **Frontend (AWS Amplify)**:
   - The Next.js app is hosted on **AWS Amplify**, automatically mapped to the domain `quorum.atma-ai.co.in`.

---

## 🚀 6. Local Development Execution Guide

### Prerequisites
- Node.js (v20+) and `pnpm` (v9.15+)
- Python (v3.9+)
- Docker & Docker Compose
- Accounts/API Keys for: LiveKit, OpenAI, Deepgram, and ElevenLabs.

### Step-by-Step Initialization

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root based on `.env.example`:
   ```env
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=quorum
   DATABASE_USER=quorum
   DATABASE_PASSWORD=quorum_dev

   # LiveKit
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```
   *Create a similar `.env` inside `apps/agent` for OpenAI, Deepgram, and ElevenLabs keys.*

3. **Start Local Infrastructure**
   Spin up the local PostgreSQL database and Redis cache:
   ```bash
   pnpm db:up
   ```

4. **Run the API and Web Frontend**
   Use Turbo to start the development servers concurrently:
   ```bash
   pnpm dev
   ```

5. **Start the AI Agent**
   In a separate terminal window, start the Python agent:
   ```bash
   cd apps/agent
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .
   python src/agent.py start
   ```

6. **Verify the System**
   Execute the integration test to prove the backend endpoints are interacting successfully:
   ```bash
   node test-api.js
   ```

## 🛡️ Security & Best Practices
- **Monorepo Linting**: TypeScript compilation and linting run concurrently via Turborepo across all apps.
- **IAM Authentication**: ECS Fargate tasks are granted specific IAM roles to securely authenticate against RDS PostgreSQL without hardcoded passwords.
- **Internal APIs**: The `/internal/transcripts` route enforces an internal API key to prevent unauthorized transcript spoofing.
