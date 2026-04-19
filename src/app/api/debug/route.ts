import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export async function GET() {
  try {
    await kv.set("test-key", { ping: "pong", time: Date.now() });
    const result = await kv.get("test-key");
    return NextResponse.json({
      success: true,
      result,
      env: {
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      env: {
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    });
  }
}