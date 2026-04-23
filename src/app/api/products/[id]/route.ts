/**
 * @system DentaCore ERP — Single Product API
 * @route PUT /api/products/:id — Update stock/details
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.sellPrice !== undefined && { sellPrice: body.sellPrice }),
        ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
        ...(body.reorderLevel !== undefined && { reorderLevel: body.reorderLevel }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.api("PUT", "/api/products/[id]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
