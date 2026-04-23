import { NextResponse } from "next/server";
import { authenticate, createToken } from "@/lib/auth";
import { loginSchema, validate } from "@/lib/validations";

import { logger } from "@/lib/logger";
const COOKIE_NAME = "dentacore-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await request.json();
    const v = validate(loginSchema, body);
    if (!v.success) {
      return NextResponse.json({ success: false, error: v.error }, { status: 400 });
    }

    const user = await authenticate(v.data.email, v.data.password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Clear rate limit on success
    loginAttempts.delete(ip);

    const token = await createToken(user);
    const response = NextResponse.json({ success: true, data: { user } });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error("Login failed", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
