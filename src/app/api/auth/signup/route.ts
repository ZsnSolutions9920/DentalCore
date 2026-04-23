import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema, validate } from "@/lib/validations";

import { logger } from "@/lib/logger";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const v = validate(signupSchema, body);
    if (!v.success) {
      return NextResponse.json({ success: false, error: v.error }, { status: 400 });
    }
    const { name, email, password } = v.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      return NextResponse.json(
        { success: false, error: "No active branch found" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "RECEPTIONIST", branchId: branch.id },
      include: { branch: true },
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch.name,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({ success: true, data: { user: sessionUser } }, { status: 201 });
  } catch (error) {
    logger.error("Signup failed", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
