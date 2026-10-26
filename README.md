# English Mastery AI

English Mastery AI is a production-oriented personal AI assistant and adaptive English-learning companion. The current local build includes a responsive workspace, secure account flow, PostgreSQL/Prisma data model, private conversation persistence, streaming OpenAI responses, voice practice, contextual verb reviews, assessment, privacy controls, and PWA support.

## Architecture

- Next.js App Router + TypeScript + Tailwind CSS
- Route Handlers for authentication, health, conversations, streaming chat, adaptive lessons, assessment, progress, profile, vocabulary reviews, privacy, memory, and voice speech
- Auth.js credentials provider with JWT sessions and bcrypt password hashing
- Prisma ORM with PostgreSQL schema and versioned initial migration
- OpenAI Responses API called only from the server; streamed with SSE to the client, with optional server-side TTS
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
npm run deploy:preflight
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes for auth/chat | PostgreSQL connection string, including Railway's injected value |
| `AUTH_SECRET` | Yes for auth | Long random secret for Auth.js sessions |
| `OPENAI_API_KEY` | Yes for AI chat | Server-only OpenAI credential |
| `OPENAI_MODEL` | Optional | Model used by the Responses API; defaults to `gpt-5.5` |
| `OPENAI_TTS_MODEL` | Optional | TTS model for the voice coach; defaults to `gpt-4o-mini-tts` |
| `OPENAI_TTS_VOICE` | Optional | TTS voice; defaults to `coral` |
| `OPENAI_REALTIME_MODEL` | Optional | Low-latency Realtime model; defaults to `gpt-realtime` |
| `AZURE_SPEECH_KEY` | Optional | Server-only Azure Speech key for specialized pronunciation assessment |
| `AZURE_SPEECH_REGION` | Optional | Azure Speech resource region |
| `AI_DEFAULT_MONTHLY_BUDGET_USD` | Optional | Default per-user estimated AI budget; defaults to `5` |
| `OPENAI_INPUT_COST_PER_MILLION_USD` | Optional | Current input-token price used for budget estimates |
| `OPENAI_OUTPUT_COST_PER_MILLION_USD` | Optional | Current output-token price used for budget estimates |
| `NEXT_PUBLIC_APP_URL` | Optional | Public application URL |
| `HEALTHCHECK_STRICT` | Optional | Set to `true` to require PostgreSQL and OpenAI for a healthy deployment response; production mode is strict automatically |
| `CRON_SECRET` | Required for retention cleanup | Secret for the scheduled privacy-maintenance request |
| `RETENTION_APP_URL` | Required for the retention service | Public URL of the web service used by the Railway cron job |
| `DATA_RETENTION_DAYS` | Optional | Retention window for AI usage and tool-execution logs; defaults to `365` and is clamped to 30–3650 days |

## Implemented

- Responsive light/dark application shell with sidebar navigation.
- Overview dashboard with daily goal, streak, study time, level, and skill snapshot.
- Assistant, English Tutor, and Smart Learning modes.
- Supportive correction instructions, including corrected sentence, natural alternative, and concise Spanish explanation when relevant.
- Active learning focus on irregular verbs and contextual vocabulary across travel, daily life, work/technology, and international conversations.
- Auth.js credentials sign-in and registration with user-scoped data access.
- Persistent login-attempt limiting by normalized email, alongside registration and AI endpoint rate limits.
- Conversation and message persistence with ownership checks.
- Streaming assistant responses using the server-side OpenAI Responses API.
- Optional web research toggle; search is off by default, requires an explicit user action, and writes a scoped tool-execution audit record.
- Per-user web-research permission in Settings, enforced server-side before any search is approved or executed.
- Text-note assistance for `.txt`, `.md`, `.csv`, and `.json` attachments, inserted locally into the next user prompt.
- Voice practice: browser speech recognition, streamed tutor replies, server-side AI speech when configured, and browser speech fallback.
- Low-latency live voice via WebRTC and an ephemeral server-issued Realtime session key when OpenAI Realtime is configured; the prior turn-based voice flow remains available as fallback.
- Specialized pronunciation assessment adapter using Azure Speech when both Azure variables are configured; without them the UI reports that no score is available.
- An interactive irregular-verb deck with travel, daily life, work, technology, and international context filters.
- Spaced-review ratings (`Again`, `Hard`, `Good`, `Easy`) persisted through user-scoped vocabulary APIs when PostgreSQL is connected.
- Persistent PostgreSQL-backed rate limiting for registration and chat, with an in-memory fallback for local/offline development.
- Relational models for the learning engine, assessments, vocabulary reviews, pronunciation attempts, memory, tool connections, and audit records.
- Railway build/deploy settings and health check.
- Health check is intentionally degraded-but-usable during local development and strict in production, so Railway cannot accept a deployment missing required services.
- Initial check-in with grammar/context vocabulary questions, level calculation, and profile persistence.
- Adaptive lesson catalog persisted in PostgreSQL, ordered from the learner’s weaker skill and tracked through lesson attempts; it covers grammar, vocabulary, irregular verbs, listening, reading, writing, and speaking.
- Lesson cards expose separate Tutor launch and explicit “Mark practiced” actions, so completion is never inferred from merely opening a lesson.
- Periodic check-ins become due after seven recorded study sessions following the latest assessment.
- Travel role-play launcher for airport, hotel, and international work situations, connected to Tutor mode.
- Progress endpoint aggregating reviews, study minutes, latest assessment, and pronunciation records without inventing scores.
- Correction history is captured only when the tutor emits an explicit correction block and is surfaced in the grammar progress view.
- Privacy export, account deletion confirmation, and user-approved memory CRUD.
- User-approved memories can be created, edited, and deleted from Settings.
- Installable PWA manifest with scope, adaptive icon declarations, iOS metadata, service-worker registration, and offline shell fallback.
- Per-user AI usage events, monthly token totals, configurable budgets, and a server-side budget gate when pricing variables are configured.
- Study-session recording connected to assessments, vocabulary recall blocks, voice turns, and completed Tutor/Smart text turns so progress reflects completed activity.
- Protected retention endpoint at `POST /api/maintenance/retention` for scheduled deletion of old AI usage and tool-execution logs.
- Railway cron-service template in `railway.retention.toml` plus `scripts/run-retention.mjs`; configure that file as a separate Railway service with `RETENTION_APP_URL` and the same `CRON_SECRET` as the web service.

## Remaining work

Remaining production work is live credential/deployment verification. The app deliberately shows “not assessed” when no specialized pronunciation result exists.

Before a Railway deployment, run `npm run deploy:preflight` with the production environment variables loaded. It validates required configuration and deployment artifacts without printing secret values; a non-zero result means deployment should stop until the missing configuration is supplied.
