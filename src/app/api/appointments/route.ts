/**
 * @system DentaCore ERP - Appointments List & Creation API
 * @route GET /api/appointments - List appointments with filters
 * @route POST /api/appointments - Create appointment
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clinicDayRange } from "@/lib/utils";
import { requireAuth } from "@/lib/require-auth";
import { createAppointmentSchema, validate } from "@/lib/validations";

import { logger } from "@/lib/logger";
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const patientId = searchParams.get("patientId");
    const type = searchParams.get("type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (date) {
      const { gte, lt } = clinicDayRange(date);
      where.date = { gte, lt };
    }
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientCode: true, phone: true, profileImage: true } },
        doctor: { select: { id: true, name: true, speciality: true, avatar: true } },
        branch: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true, number: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    logger.api("GET", "/api/appointments", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth({ roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST", "ASSISTANT"] });
    if (auth.response) return auth.response;

    const body = await request.json();
    const v = validate(createAppointmentSchema, body);
    if (!v.success) {
      return NextResponse.json({ success: false, error: v.error }, { status: 400 });
    }

    const d = v.data;

    const appointment = await prisma.$transaction(async (tx) => {
      const count = await tx.appointment.count();
      const appointmentCode = `APT-${String(count + 1).padStart(4, "0")}`;

      const appt = await tx.appointment.create({
        data: {
          appointmentCode,
          patientId: d.patientId,
          doctorId: d.doctorId,
          branchId: d.branchId,
          roomId: d.roomId || null,
          date: new Date(d.date),
          startTime: d.startTime,
          endTime: d.endTime,
          durationMinutes: d.durationMinutes || 30,
          type: d.type || "CONSULTATION",
          status: "SCHEDULED",
          notes: d.notes || null,
          priority: d.priority || "NORMAL",
          workflowStage: "BOOKED",
          createdById: auth.user.id,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
          doctor: { select: { id: true, name: true, speciality: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.id,
          action: "CREATE",
          module: "APPOINTMENT",
          entityType: "Appointment",
          entityId: appt.id,
          details: JSON.stringify({ appointmentCode: appt.appointmentCode }),
        },
      });

      return appt;
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    logger.api("POST", "/api/appointments", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
