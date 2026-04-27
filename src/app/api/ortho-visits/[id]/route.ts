import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.type !== undefined) data.type = body.type;
    if (body.visitDate !== undefined)
      data.visitDate = body.visitDate ? new Date(body.visitDate) : new Date();
    if (body.wireUpper !== undefined) data.wireUpper = body.wireUpper;
    if (body.wireLower !== undefined) data.wireLower = body.wireLower;
    if (body.elastics !== undefined) data.elastics = body.elastics;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.complications !== undefined)
      data.complications = body.complications;
    if (body.nextVisitDate !== undefined)
      data.nextVisitDate = body.nextVisitDate
        ? new Date(body.nextVisitDate)
        : null;

    const updated = await prisma.orthoVisit.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.api("PUT", "/api/ortho-visits/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update visit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id } = await params;
    await prisma.orthoVisit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.api("DELETE", "/api/ortho-visits/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete visit" },
      { status: 500 }
    );
  }
}
