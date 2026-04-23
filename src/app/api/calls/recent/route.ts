/**
 * @system DentaCore ERP — Recent Calls API
 * @route GET /api/calls/recent — Get recent call logs
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (agentId) where.userId = agentId;

    const calls = await prisma.callLog.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, phone: true, status: true } },
        patient: { select: { id: true, firstName: true, lastName: true, patientCode: true, phone: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: calls });
  } catch (error) {
    logger.api("GET", "/api/calls/recent", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
