import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";

const FDI_VALID = new Set([
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
]);

const STATUS_VALID = new Set(["PROBLEM", "UNDER_TREATMENT", "TREATED", "MISSING"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id } = await params;

    const records = await prisma.toothRecord.findMany({
      where: { patientId: id },
      orderBy: { fdi: "asc" },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    logger.api("GET", "/api/patients/[id]/tooth-records", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tooth records" },
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

    const { id: patientId } = await params;
    const body = await request.json();

    const fdi = Number(body.fdi);
    if (!FDI_VALID.has(fdi)) {
      return NextResponse.json(
        { success: false, error: "Invalid FDI tooth number" },
        { status: 400 }
      );
    }

    const status = String(body.status || "PROBLEM");
    if (!STATUS_VALID.has(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const conditions = Array.isArray(body.conditions)
      ? JSON.stringify(body.conditions)
      : body.conditions ?? null;
    const treatment = body.treatment ?? null;
    const notes = body.notes ?? null;

    const record = await prisma.toothRecord.upsert({
      where: { patientId_fdi: { patientId, fdi } },
      update: {
        status,
        conditions,
        treatment,
        notes,
        updatedById: auth.user.id,
      },
      create: {
        patientId,
        fdi,
        status,
        conditions,
        treatment,
        notes,
        updatedById: auth.user.id,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    logger.api("PUT", "/api/patients/[id]/tooth-records", error);
    return NextResponse.json(
      { success: false, error: "Failed to save tooth record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const fdi = Number(searchParams.get("fdi"));

    if (!FDI_VALID.has(fdi)) {
      return NextResponse.json(
        { success: false, error: "Invalid FDI tooth number" },
        { status: 400 }
      );
    }

    await prisma.toothRecord.deleteMany({
      where: { patientId, fdi },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.api("DELETE", "/api/patients/[id]/tooth-records", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tooth record" },
      { status: 500 }
    );
  }
}
