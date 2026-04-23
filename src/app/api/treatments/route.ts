/**
 * @system DentaCore ERP - Treatments Catalog API
 * @route GET /api/treatments - List treatments
 * @route POST /api/treatments - Create treatment
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
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const search = searchParams.get("search")?.toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (category) where.category = category;
    if (active === "true") where.isActive = true;
    else if (active === "false") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const treatments = await prisma.treatment.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: treatments });
  } catch (error) {
    logger.api("GET", "/api/treatments", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch treatments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await request.json();

    const treatment = await prisma.treatment.create({
      data: {
        name: body.name,
        code: body.code || null,
        category: body.category,
        description: body.description || null,
        duration: body.duration,
        basePrice: body.basePrice,
        preInstructions: body.preInstructions || null,
        postInstructions: body.postInstructions || null,
        contraindications: body.contraindications || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: treatment }, { status: 201 });
  } catch (error) {
    logger.api("POST", "/api/treatments", error);
    return NextResponse.json(
      { success: false, error: "Failed to create treatment" },
      { status: 500 }
    );
  }
}
