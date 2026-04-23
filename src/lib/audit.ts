import { prisma } from "@/lib/prisma";

/**
 * Log an audit event. Call this in API routes after critical actions.
 */
export async function logAudit(params: {
  userId: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    // Don't let audit failures break the main request
    console.error("Audit log failed:", err);
  }
}
