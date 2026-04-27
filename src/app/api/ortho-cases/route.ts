import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dueWithinDays = Number(searchParams.get("dueWithinDays") || 0);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const cases = await prisma.orthoCase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, patientCode: true, phone: true },
        },
        doctor: { select: { id: true, name: true } },
        visits: {
          orderBy: { visitDate: "desc" },
          take: 1,
        },
      },
    });

    if (dueWithinDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + dueWithinDays);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = cases.filter((c) => {
        const next = c.visits[0]?.nextVisitDate;
        if (!next) return false;
        const nextDate = new Date(next);
        return nextDate >= today && nextDate <= cutoff;
      });
      return NextResponse.json({ success: true, data: filtered });
    }

    return NextResponse.json({ success: true, data: cases });
  } catch (error) {
    logger.api("GET", "/api/ortho-cases", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ortho cases" },
      { status: 500 }
    );
  }
}
