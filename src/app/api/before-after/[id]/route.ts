import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { logger } from "@/lib/logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.afterUrl !== undefined) data.afterUrl = body.afterUrl;
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.procedure !== undefined) data.procedure = body.procedure;
    if (body.toothFdi !== undefined)
      data.toothFdi =
        typeof body.toothFdi === "number" && body.toothFdi >= 11 && body.toothFdi <= 48
          ? body.toothFdi
          : null;
    if (body.takenAt !== undefined)
      data.takenAt = body.takenAt ? new Date(body.takenAt) : new Date();

    const updated = await prisma.beforeAfterImage.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.api("PUT", "/api/before-after/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { id } = await params;

    const existing = await prisma.beforeAfterImage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    // Best-effort: remove the actual files from disk too
    for (const url of [existing.beforeUrl, existing.afterUrl]) {
      if (!url || !url.startsWith("/uploads/")) continue;
      try {
        await unlink(join(process.cwd(), "public", url));
      } catch {
        // file may already be gone — ignore
      }
    }

    await prisma.beforeAfterImage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.api("DELETE", "/api/before-after/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
