# English Mastery AI

English Mastery AI is a production-oriented foundation for a personal AI assistant and adaptive English-learning companion. Milestone 1 provides a responsive workspace, secure account flow, PostgreSQL/Prisma data model, private conversation persistence, streaming OpenAI responses, and three learning modes.

## Architecture

- Next.js App Router + TypeScript + Tailwind CSS
- Route Handlers for authentication, health, conversations, and streaming chat
- Auth.js credentials provider with JWT sessions and bcrypt password hashing
- Prisma ORM with PostgreSQL schema and versioned initial migration
- OpenAI Responses API called only from the server; streamed with SSE to the client
- Railway configuration includes Prisma client generation, migration deployment, and health checks

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL`, `AUTH_SECRET`, and `OPENAI_API_KEY`.
3. Create or connect a PostgreSQL database.
4. Apply the schema:

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Open <http://localhost:3000>. The `/api/health` endpoint reports whether the database and OpenAI credentials are configured. The dashboard can render without credentials, but account creation and AI chat require the corresponding services.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes for auth/chat | PostgreSQL connection string, including Railway's injected value |
| `AUTH_SECRET` | Yes for auth | Long random secret for Auth.js sessions |
| `OPENAI_API_KEY` | Yes for AI chat | Server-only OpenAI credential |
| `OPENAI_MODEL` | Optional | Model used by the Responses API; defaults to `gpt-5.5` |
| `NEXT_PUBLIC_APP_URL` | Optional | Public application URL |

## Implemented in Milestone 1

- Responsive light/dark application shell with sidebar navigation.
- Overview dashboard with daily goal, streak, study time, level, and skill snapshot.
- Assistant, English Tutor, and Smart Learning modes.
- Supportive correction instructions, including corrected sentence, natural alternative, and concise Spanish explanation when relevant.
- Auth.js credentials sign-in and registration with user-scoped data access.
- Conversation and message persistence with ownership checks.
- Streaming assistant responses using the server-side OpenAI Responses API.
- Basic in-memory rate limiting and request validation.
- Relational models for the learning engine, assessments, vocabulary reviews, pronunciation attempts, memory, tool connections, and audit records.
- Railway build/deploy settings and health check.

## Remaining work

The next milestones add assessment and adaptive lesson execution, real spaced repetition, voice and specialized pronunciation scoring, authorized external tools, travel simulations, data export/account deletion, persistent rate limiting, privacy retention jobs, and deployment verification with live credentials.
