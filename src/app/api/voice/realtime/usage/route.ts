import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ recorded: false, estimatedCostUsd: 0, message: "Local browser speech does not create provider usage." }, { status: 410 });
}
