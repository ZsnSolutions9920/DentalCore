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

    const images = await prisma.beforeAfterImage.findMany({
      where: { patientId: id },
      orderBy: { takenAt: "desc" },
    });

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    logger.api("GET", "/api/patients/[id]/before-after", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch images" },
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

    if (!body.beforeUrl || typeof body.beforeUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "beforeUrl is required" },
        { status: 400 }
      );
    }

    const created = await prisma.beforeAfterImage.create({
      data: {
        patientId,
        beforeUrl: body.beforeUrl,
        afterUrl: body.afterUrl ?? null,
        title: body.title ?? null,
        description: body.description ?? null,
        toothFdi:
          typeof body.toothFdi === "number" && body.toothFdi >= 11 && body.toothFdi <= 48
            ? body.toothFdi
            : null,
        procedure: body.procedure ?? null,
        takenAt: body.takenAt ? new Date(body.takenAt) : new Date(),
        uploadedById: auth.user.id,
        uploadedByName: auth.user.name ?? null,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    logger.api("POST", "/api/patients/[id]/before-after", error);
    return NextResponse.json(
      { success: false, error: "Failed to save image" },
      { status: 500 }
    );
  }
}
