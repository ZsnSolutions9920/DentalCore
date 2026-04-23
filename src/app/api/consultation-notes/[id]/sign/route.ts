import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/lib/require-auth";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id } = await params;
    const note = await prisma.consultationNote.update({
      where: { id },
      data: { isSigned: true, signedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to sign note" }, { status: 500 });
  }
}
