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

Open <http://localhost:3000>. The `/api/health` endpoint reports whether the database, Auth.js secret, and OpenAI credentials are configured. The dashboard can render without credentials, but account creation and AI chat require the corresponding services.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run deploy:preflight
npm audit --omit=dev --audit-level=high
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
| `OPENAI_VISION_MODEL` | Optional | Vision-capable model for image analysis; falls back to `OPENAI_MODEL` |
| `OPENAI_REALTIME_MODEL` | Optional | Low-latency Realtime model; defaults to `gpt-realtime` |
| `AZURE_SPEECH_KEY` | Optional | Server-only Azure Speech key for specialized pronunciation assessment |
| `AZURE_SPEECH_REGION` | Optional | Azure Speech resource region |
| `AI_DEFAULT_MONTHLY_BUDGET_USD` | Optional | Default per-user estimated AI budget; defaults to `5` |
| `OPENAI_INPUT_COST_PER_MILLION_USD` | Optional | Current input-token price used for budget estimates |
| `OPENAI_OUTPUT_COST_PER_MILLION_USD` | Optional | Current output-token price used for budget estimates |
| `OPENAI_TTS_COST_PER_MILLION_CHAR_USD` | Optional | TTS character price used for optional voice-cost estimates |
| `OPENAI_REALTIME_COST_PER_MINUTE_USD` | Optional | Realtime voice minute price used for optional voice-cost estimates |
| `NEXT_PUBLIC_APP_URL` | Optional | Public application URL |
| `HEALTHCHECK_STRICT` | Optional | Set to `true` to require PostgreSQL and OpenAI for a healthy deployment response; production mode is strict automatically |
| `CRON_SECRET` | Required for retention cleanup | Secret for the scheduled privacy-maintenance request |
| `RETENTION_APP_URL` | Required for the retention service | Public URL of the web service used by the Railway cron job |
| `DATA_RETENTION_DAYS` | Optional | Retention window for AI usage and tool-execution logs; defaults to `365` and is clamped to 30–3650 days |

## Railway deployment checklist

1. Create a private Railway project with a PostgreSQL service and connect the repository to a web service.
2. Add the required variables to the web service: `DATABASE_URL` (normally injected by Railway), `AUTH_SECRET`, and `OPENAI_API_KEY`. Add the optional voice, pronunciation, pricing, and public URL variables only when their providers are configured.
3. Use the committed `railway.toml`; its build command generates Prisma and Next.js, while its start command runs `prisma migrate deploy` before `next start`.
4. Set `HEALTHCHECK_STRICT=true` and confirm `/api/health` reports `ready` before sharing the URL. A `degraded` response is expected only for local development without services.
5. Add a second Railway service using `railway.retention.toml`, set the same `CRON_SECRET` on both services, and set `RETENTION_APP_URL` to the web service URL.
6. Configure the private Git remote and run `npm run deploy:preflight` with the production environment loaded. The preflight checks the remote, required variables, migrations, and Railway files; a non-zero result is a deployment stop signal and does not claim that deployment succeeded.

## Implemented

- Responsive light/dark application shell with sidebar navigation.
- Overview dashboard with daily goal, streak, study time, level, and skill snapshot.
- Agent Assistant, English Tutor, and Smart Learning modes. Agent Assistant understands safe natural-language commands such as “show my progress”, “open my learning path”, “start tutor practice”, and “open settings” in typed chat, browser dictation, and live Realtime voice.
- Agent Assistant image analysis for JPG, PNG, WEBP, and GIF files up to 3 MB. Images are sent only for the current response and are not stored in conversation history; the assistant can describe visible content, read English text, explain exercises, and extract contextual vocabulary.
- Supportive correction instructions, including corrected sentence, natural alternative, and concise Spanish explanation when relevant.
- Active learning focus on irregular verbs and contextual vocabulary across travel, daily life, work/technology, and international conversations.
- Auth.js credentials sign-in and registration with user-scoped data access.
- Persistent login-attempt limiting by normalized email, alongside registration and AI endpoint rate limits.
- JWT sessions revalidate account existence so deleted accounts lose access without waiting for token expiry.
- Conversation and message persistence with ownership checks.
- Streaming assistant responses using the server-side OpenAI Responses API.
- Optional web research toggle; search is off by default, requires an explicit user action, and writes a scoped tool-execution audit record.
- Per-user web-research permission in Settings, enforced server-side before any search is approved or executed.
- Text-note assistance for `.txt`, `.md`, `.csv`, and `.json` attachments, inserted locally into the next user prompt with a 1 MB limit and untrusted-content delimiters; files are not uploaded by the browser.
- Voice practice: browser speech recognition, streamed tutor replies, server-side AI speech when configured, and browser speech fallback.
- Low-latency live voice via WebRTC and an ephemeral server-issued Realtime session key when OpenAI Realtime is configured, with input transcription shown in the review panel; the prior turn-based voice flow remains available as fallback.
- Realtime voice transcripts are persisted as user-scoped conversation messages in arrival order, so live sessions are available in conversation history and privacy exports.
- Specialized pronunciation assessment adapter using Azure Speech when both Azure variables are configured; without them the UI reports that no score is available.
- An interactive irregular-verb deck with travel, daily life, work, technology, and international context filters.
- The recall deck also includes contextual phrases and environment vocabulary such as boarding passes, deadlines, backups, small talk, and follow-ups.
- Spaced-review ratings (`Again`, `Hard`, `Good`, `Easy`) persisted through user-scoped vocabulary APIs when PostgreSQL is connected.
- Persistent PostgreSQL-backed rate limiting for authentication, learning updates, privacy exports, voice, and chat, with an in-memory fallback for local/offline development.
- Catalog synchronization for lessons and vocabulary is rate-limited as well because those reads seed or update per-user records.
- Relational models for the learning engine, assessments, vocabulary reviews, pronunciation attempts, memory, tool connections, and audit records.
- Railway build/deploy settings and health check.
- Production-oriented security headers, including MIME, framing, referrer, and microphone policy controls.
- Health check is intentionally degraded-but-usable during local development and strict in production, so Railway cannot accept a deployment missing required services.
- Initial check-in with grammar/context vocabulary questions, level calculation, and profile persistence.
- Adaptive lesson catalog persisted in PostgreSQL, ordered from the learner’s weaker skill and tracked through lesson attempts; it covers grammar, vocabulary, irregular verbs, listening, reading, writing, and speaking.
- Lesson cards expose separate Tutor launch and explicit “Mark practiced” actions, so completion is never inferred from merely opening a lesson.
- Periodic check-ins become due after seven recorded study sessions following the latest assessment.
- Travel role-play launcher for airport, hotel, and international work situations, connected to Tutor mode.
- Progress endpoint aggregating reviews, study minutes, seven-day study rhythm, latest assessment, and pronunciation records without inventing scores; daily boundaries and recorded study streaks follow the learner's browser time zone.
- Correction history is captured only when the tutor emits an explicit correction block and is surfaced in the grammar progress view.
- Saved corrections can be marked as practiced and reopened from the progress view.
- Privacy export, typed account deletion confirmation, and user-approved memory CRUD.
- Privacy export includes conversations, lesson attempts, learning data, tool audit records, and per-user AI usage events without secrets.
- User-approved memories can be created, edited, and deleted from Settings.
- Installable PWA manifest with PNG icons for desktop/Android, a 180px Apple touch icon, iOS metadata, service-worker registration, public-asset caching, and offline shell fallback without caching authenticated HTML.
- Per-user AI usage events, monthly token totals, configurable budgets, and a server-side budget gate when pricing variables are configured.
- TTS and Realtime voice sessions are included in per-user AI usage history; both voice paths respect the monthly budget when their optional pricing variables are configured.
- Study-session recording connected to assessments, vocabulary recall blocks, voice turns, and completed Tutor/Smart text turns so progress reflects completed activity.
- Study-session writes accept only known activity types and cap each client-reported record at 60 minutes to protect progress integrity.
- Study-session metadata is also limited to short, bounded JSON records to prevent oversized client-supplied progress payloads.
- Protected retention endpoint at `POST /api/maintenance/retention` for scheduled deletion of old AI usage and tool-execution logs.
- Railway cron-service template in `railway.retention.toml` plus `scripts/run-retention.mjs`; configure that file as a separate Railway service with `RETENTION_APP_URL` and the same `CRON_SECRET` as the web service.

## Remaining work

Remaining production work is live credential/deployment verification. This checkout currently has no configured Git remote, so private GitHub repository setup and Railway deployment still require the owner’s repository access and production credentials. The app deliberately shows “not assessed” when no specialized pronunciation result exists.

Before a Railway deployment, run `npm run deploy:preflight` with the production environment variables loaded. It validates required configuration and deployment artifacts without printing secret values; a non-zero result means deployment should stop until the missing configuration is supplied.
