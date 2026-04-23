/**
 * @system DentaCore ERP - Leads API
 * @route GET /api/leads - List leads with filters
 * @route POST /api/leads - Create lead
 */
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
    const source = searchParams.get("source");
    const branchId = searchParams.get("branchId");
    const assignedToId = searchParams.get("assignedToId");
    const search = searchParams.get("search")?.toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (branchId) where.branchId = branchId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { interest: { contains: search, mode: "insensitive" } },
      ];
    }

    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true, code: true } },
          convertedPatient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: leads,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    logger.api("GET", "/api/leads", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        source: body.source,
        status: "NEW",
        interest: body.interest || null,
        assignedToId: body.assignedToId,
        branchId: body.branchId,
        notes: body.notes || null,
        callbackDate: body.callbackDate ? new Date(body.callbackDate) : null,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    logger.api("POST", "/api/leads", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
