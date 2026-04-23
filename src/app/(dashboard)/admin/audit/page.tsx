"use client";

import { useState } from "react";
import { useModuleAccess } from "@/modules/core/hooks";
import {
  FileText,
  User,
  Globe,
  Clock,
  LogIn,
  FilePlus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Card,
  Badge,
  SearchInput,
} from "@/components/ui";
import { useAuditLog } from "@/hooks/use-queries";
import type { AuditLog } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <FilePlus className="w-4 h-4" />,
  UPDATE: <Edit className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />,
  LOGIN: <LogIn className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-600",
  UPDATE: "bg-sky-100 text-sky-600",
  DELETE: "bg-red-100 text-red-600",
  LOGIN: "bg-teal-100 text-teal-600",
};

const actionBadge: Record<string, "success" | "info" | "danger" | "primary"> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  LOGIN: "primary",
};

export default function AuditLogPage() {
  const access = useModuleAccess("MOD-ADMIN");
  const [search, setSearch] = useState("");
  const { data: auditResponse, isLoading } = useAuditLog();
  const auditLogs = (auditResponse?.data || []) as AuditLog[];

  if (!access.canView) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        You don&apos;t have access to this module.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        Loading audit log...
      </div>
    );
  }

  const filtered = auditLogs.filter(
    (log) =>
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="AUTH-AUDIT-LOG">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
          <FileText className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Audit Log</h1>
          <p className="text-sm text-stone-500 mt-0.5">Everything that happened, in order</p>
        </div>
      </div>

      {/* Search */}
      <SearchInput placeholder="Search by user, action, or module..." onChange={setSearch} />

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-stone-200 hidden sm:block" />

        <div className="space-y-3 sm:space-y-4">
          {filtered.map((log) => (
            <div key={log.id} className="relative flex gap-3 sm:gap-4 animate-fade-in">
              {/* Timeline dot */}
              <div
                className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  actionColors[log.action] || "bg-stone-100 text-stone-600"
                }`}
              >
                {actionIcons[log.action] || <FileText className="w-4 h-4" />}
              </div>

              {/* Card */}
              <Card padding="md" className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-medium text-stone-800 truncate min-w-0">{log.details}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{log.userName}</span>
                      </div>
                      <Badge variant={actionBadge[log.action] || "default"}>
                        {log.action}
                      </Badge>
                      <Badge variant="default">{log.module}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400 shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(log.createdAt)} {formatTime(log.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{log.ipAddress}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <Card padding="lg">
          <p className="text-center text-stone-400 py-8">No audit entries found.</p>
        </Card>
      )}
    </div>
  );
}
