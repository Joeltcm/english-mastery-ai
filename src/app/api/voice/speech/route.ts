import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Server-side speech is disabled. English Mastery uses your device voice locally to avoid external audio charges." }, { status: 410 });
}
