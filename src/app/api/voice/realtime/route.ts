import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Live provider audio is disabled. Use the microphone button for local speech practice with DeepSeek." }, { status: 410 });
}
