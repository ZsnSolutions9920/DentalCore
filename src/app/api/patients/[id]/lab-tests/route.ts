/**
 * @system DentaCore ERP - Patient Lab Tests API
 * @route GET /api/patients/:id/lab-tests - Get patient lab tests
 * @route POST /api/patients/:id/lab-tests - Order lab test
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

    const tests = await prisma.labTest.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: {
          select: { id: true, name: true, speciality: true },
        },
        appointment: {
          select: { id: true, appointmentCode: true, date: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tests });
  } catch (error) {
    logger.api("GET", "/api/patients/[id]/lab-tests", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lab tests" },
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

    const { id } = await params;
    const body = await request.json();

    const test = await prisma.labTest.create({
      data: {
        patientId: id,
        doctorId: body.doctorId,
        appointmentId: body.appointmentId,
        testName: body.testName,
        testCode: body.testCode,
        priority: body.priority ?? "NORMAL",
        notes: body.notes,
      },
      include: {
        doctor: {
          select: { id: true, name: true, speciality: true },
        },
        appointment: {
          select: { id: true, appointmentCode: true, date: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: test },
      { status: 201 }
    );
  } catch (error) {
    logger.api("POST", "/api/patients/[id]/lab-tests", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lab test" },
      { status: 500 }
    );
  }
}
