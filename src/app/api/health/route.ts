import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "english-mastery-ai", databaseConfigured: Boolean(process.env.DATABASE_URL), openAIConfigured: Boolean(process.env.OPENAI_API_KEY), timestamp: new Date().toISOString() });
}
