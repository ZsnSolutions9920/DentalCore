/**
 * @system DentaCore ERP - Patient Procedures API
 * @route GET /api/patients/:id/procedures - Get procedures
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id } = await params;

    const procedures = await prisma.procedure.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      include: {
        treatment: true,
        doctor: {
          select: { id: true, name: true, speciality: true },
        },
        appointment: {
          select: { id: true, appointmentCode: true, date: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: procedures });
  } catch (error) {
    logger.api("GET", "/api/patients/[id]/procedures", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch procedures" },
      { status: 500 }
    );
  }
}
