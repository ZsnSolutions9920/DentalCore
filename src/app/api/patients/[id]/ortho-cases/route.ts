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

    const cases = await prisma.orthoCase.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
        visits: { orderBy: { visitDate: "desc" } },
      },
    });

    return NextResponse.json({ success: true, data: cases });
  } catch (error) {
    logger.api("GET", "/api/patients/[id]/ortho-cases", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ortho cases" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id: patientId } = await params;
    const body = await request.json();

    const type = TYPES.has(body.type) ? body.type : "METAL";
    const arches = ARCHES.has(body.arches) ? body.arches : "BOTH";
    const status = STATUSES.has(body.status) ? body.status : "CONSULTATION";

    const created = await prisma.orthoCase.create({
      data: {
        patientId,
        doctorId: body.doctorId ?? null,
        type,
        arches,
        status,
        chiefComplaint: body.chiefComplaint ?? null,
        diagnosis: body.diagnosis ?? null,
        treatmentPlan: body.treatmentPlan ?? null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        estimatedEndDate: body.estimatedEndDate
          ? new Date(body.estimatedEndDate)
          : null,
        intervalWeeks:
          typeof body.intervalWeeks === "number" ? body.intervalWeeks : 4,
        totalCost: typeof body.totalCost === "number" ? body.totalCost : 0,
        paidAmount: typeof body.paidAmount === "number" ? body.paidAmount : 0,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    logger.api("POST", "/api/patients/[id]/ortho-cases", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ortho case" },
      { status: 500 }
    );
  }
}
