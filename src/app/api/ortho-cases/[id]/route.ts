import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";

const TYPES = new Set([
  "METAL",
  "CERAMIC",
  "LINGUAL",
  "CLEAR_ALIGNER",
  "SELF_LIGATING",
]);
const ARCHES = new Set(["UPPER", "LOWER", "BOTH"]);
const STATUSES = new Set([
  "CONSULTATION",
  "RECORDS",
  "PLANNING",
  "ACTIVE",
  "RETENTION",
  "COMPLETED",
  "CANCELLED",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id } = await params;

    const ortho = await prisma.orthoCase.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
        visits: { orderBy: { visitDate: "desc" } },
        patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
      },
    });

    if (!ortho) {
      return NextResponse.json(
        { success: false, error: "Ortho case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ortho });
  } catch (error) {
    logger.api("GET", "/api/ortho-cases/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ortho case" },
      { status: 500 }
    );
  }
}

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
    if (body.type !== undefined && TYPES.has(body.type)) data.type = body.type;
    if (body.arches !== undefined && ARCHES.has(body.arches))
      data.arches = body.arches;
    if (body.status !== undefined && STATUSES.has(body.status))
      data.status = body.status;
    if (body.doctorId !== undefined) data.doctorId = body.doctorId;
    if (body.chiefComplaint !== undefined)
      data.chiefComplaint = body.chiefComplaint;
    if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis;
    if (body.treatmentPlan !== undefined)
      data.treatmentPlan = body.treatmentPlan;
    if (body.startDate !== undefined)
      data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.estimatedEndDate !== undefined)
      data.estimatedEndDate = body.estimatedEndDate
        ? new Date(body.estimatedEndDate)
        : null;
    if (body.actualEndDate !== undefined)
      data.actualEndDate = body.actualEndDate
        ? new Date(body.actualEndDate)
        : null;
    if (typeof body.intervalWeeks === "number")
      data.intervalWeeks = body.intervalWeeks;
    if (typeof body.totalCost === "number") data.totalCost = body.totalCost;
    if (typeof body.paidAmount === "number") data.paidAmount = body.paidAmount;
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await prisma.orthoCase.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.api("PUT", "/api/ortho-cases/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update ortho case" },
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
    await prisma.orthoCase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.api("DELETE", "/api/ortho-cases/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete ortho case" },
      { status: 500 }
    );
  }
}
