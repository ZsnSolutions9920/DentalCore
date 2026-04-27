import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";

const VISIT_TYPES = new Set([
  "BRACKET_PLACEMENT",
  "ADJUSTMENT",
  "WIRE_CHANGE",
  "ELASTICS",
  "REMOVAL",
  "RETAINER_FITTING",
  "PROGRESS_CHECK",
  "EMERGENCY",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id: caseId } = await params;
    const body = await request.json();

    const type = VISIT_TYPES.has(body.type) ? body.type : "ADJUSTMENT";

    const visit = await prisma.orthoVisit.create({
      data: {
        caseId,
        type,
        visitDate: body.visitDate ? new Date(body.visitDate) : new Date(),
        performedById: auth.user.id,
        performedByName: auth.user.name ?? null,
        wireUpper: body.wireUpper ?? null,
        wireLower: body.wireLower ?? null,
        elastics: body.elastics ?? null,
        notes: body.notes ?? null,
        complications: body.complications ?? null,
        nextVisitDate: body.nextVisitDate ? new Date(body.nextVisitDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: visit }, { status: 201 });
  } catch (error) {
    logger.api("POST", "/api/ortho-cases/[id]/visits", error);
    return NextResponse.json(
      { success: false, error: "Failed to record visit" },
      { status: 500 }
    );
  }
}
