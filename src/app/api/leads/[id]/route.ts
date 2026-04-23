/**
 * @system DentaCore ERP - Single Lead API
 * @route GET /api/leads/:id - Get lead details
 * @route PUT /api/leads/:id - Update lead
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
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
        convertedPatient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
        callLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    logger.api("GET", "/api/leads/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead" },
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

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.source && { source: body.source }),
        ...(body.status && { status: body.status }),
        ...(body.interest !== undefined && { interest: body.interest }),
        ...(body.assignedToId && { assignedToId: body.assignedToId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.convertedPatientId !== undefined && { convertedPatientId: body.convertedPatientId || null }),
        ...(body.callbackDate !== undefined && { callbackDate: body.callbackDate ? new Date(body.callbackDate) : null }),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    logger.api("PUT", "/api/leads/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
