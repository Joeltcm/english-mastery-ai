import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const localEnvPath = join(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) {
  for (const line of readFileSync(localEnvPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}
const required = ["DATABASE_URL", "AUTH_SECRET", "OPENAI_API_KEY"];
const missing = required.filter((name) => !process.env[name]);
const migrationRoot = join(process.cwd(), "prisma", "migrations");
const migrations = existsSync(migrationRoot) ? readdirSync(migrationRoot).filter((entry) => /^\d+_.+/.test(entry)) : [];
const checks = {
  requiredEnvironment: missing.length === 0,
  migrationsPresent: migrations.length >= 3,
  railwayWebConfig: existsSync(join(process.cwd(), "railway.toml")),
  railwayRetentionConfig: existsSync(join(process.cwd(), "railway.retention.toml")),
};

console.log(JSON.stringify({ checks, migrationCount: migrations.length, missingRequiredEnvironment: missing, optional: { azurePronunciation: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION), retentionSchedule: Boolean(process.env.CRON_SECRET && process.env.RETENTION_APP_URL) } }, null, 2));

if (missing.length || !checks.migrationsPresent || !checks.railwayWebConfig || !checks.railwayRetentionConfig) process.exit(1);
