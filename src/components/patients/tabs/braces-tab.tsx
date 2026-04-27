"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  CalendarPlus,
  CircleAlert,
  CheckCircle2,
  Clock,
  DollarSign,
  Trash2,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

type CaseStatus =
  | "CONSULTATION"
  | "RECORDS"
  | "PLANNING"
  | "ACTIVE"
  | "RETENTION"
  | "COMPLETED"
  | "CANCELLED";

type BraceType =
  | "METAL"
  | "CERAMIC"
  | "LINGUAL"
  | "CLEAR_ALIGNER"
  | "SELF_LIGATING";

type Arches = "UPPER" | "LOWER" | "BOTH";

type VisitType =
  | "BRACKET_PLACEMENT"
  | "ADJUSTMENT"
  | "WIRE_CHANGE"
  | "ELASTICS"
  | "REMOVAL"
  | "RETAINER_FITTING"
  | "PROGRESS_CHECK"
  | "EMERGENCY";

interface OrthoVisit {
  id: string;
  caseId: string;
  type: VisitType;
  visitDate: string;
  performedByName: string | null;
  wireUpper: string | null;
  wireLower: string | null;
  elastics: string | null;
  notes: string | null;
  complications: string | null;
  nextVisitDate: string | null;
}

interface OrthoCase {
  id: string;
  patientId: string;
  doctorId: string | null;
  type: BraceType;
  arches: Arches;
  status: CaseStatus;
  chiefComplaint: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  startDate: string | null;
  estimatedEndDate: string | null;
  actualEndDate: string | null;
  intervalWeeks: number;
  totalCost: number;
  paidAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: { id: string; name: string; speciality?: string } | null;
  visits: OrthoVisit[];
}

const STATUS_LABEL: Record<CaseStatus, string> = {
  CONSULTATION: "Consultation",
  RECORDS: "Diagnostic records",
  PLANNING: "Treatment planning",
  ACTIVE: "Active treatment",
  RETENTION: "Retention",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANT: Record<
  CaseStatus,
  "default" | "primary" | "warning" | "success" | "danger" | "info"
> = {
  CONSULTATION: "info",
  RECORDS: "info",
  PLANNING: "warning",
  ACTIVE: "primary",
  RETENTION: "warning",
  COMPLETED: "success",
  CANCELLED: "default",
};

const TYPE_LABEL: Record<BraceType, string> = {
  METAL: "Metal",
  CERAMIC: "Ceramic",
  LINGUAL: "Lingual",
  CLEAR_ALIGNER: "Clear aligners",
  SELF_LIGATING: "Self-ligating",
};

const ARCH_LABEL: Record<Arches, string> = {
  UPPER: "Upper arch",
  LOWER: "Lower arch",
  BOTH: "Both arches",
};

const VISIT_LABEL: Record<VisitType, string> = {
  BRACKET_PLACEMENT: "Bracket placement",
  ADJUSTMENT: "Adjustment",
  WIRE_CHANGE: "Wire change",
  ELASTICS: "Elastics change",
  REMOVAL: "Bracket removal",
  RETAINER_FITTING: "Retainer fitting",
  PROGRESS_CHECK: "Progress check",
  EMERGENCY: "Emergency visit",
};

export function BracesTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const queryKey = ["patients", patientId, "orthoCases"] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/ortho-cases`);
      const json = await res.json();
      return (json?.data ?? []) as OrthoCase[];
    },
    enabled: !!patientId,
  });

  const cases = data ?? [];

  const [showNewCase, setShowNewCase] = useState(false);
  const [editingCase, setEditingCase] = useState<OrthoCase | null>(null);
  const [visitForCase, setVisitForCase] = useState<OrthoCase | null>(null);

  const createCase = useMutation({
    mutationFn: async (input: NewCaseInput) => {
      const res = await fetch(`/api/patients/${patientId}/ortho-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateCase = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<NewCaseInput> & { status?: CaseStatus };
    }) => {
      const res = await fetch(`/api/ortho-cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteCase = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ortho-cases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const addVisit = useMutation({
    mutationFn: async ({
      caseId,
      input,
    }: {
      caseId: string;
      input: NewVisitInput;
    }) => {
      const res = await fetch(`/api/ortho-cases/${caseId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("save visit failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  const activeCase = cases.find((c) =>
    ["CONSULTATION", "RECORDS", "PLANNING", "ACTIVE", "RETENTION"].includes(
      c.status
    )
  );

  return (
    <div data-id="PATIENT-BRACES-TAB" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Braces / Orthodontics</h2>
          <p className="text-xs text-stone-500">
            Track orthodontic cases, adjustments, and retention.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          iconLeft={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowNewCase(true)}
        >
          New case
        </Button>
      </div>

      {cases.length === 0 && (
        <Card>
          <CardContent>
            <div className="py-10 text-center">
              <p className="text-sm text-stone-500 mb-3">
                No orthodontic case yet.
              </p>
              <Button
                size="sm"
                variant="primary"
                iconLeft={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowNewCase(true)}
              >
                Start a case
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {cases.map((c) => (
        <CaseCard
          key={c.id}
          c={c}
          isActive={c.id === activeCase?.id}
          onEdit={() => setEditingCase(c)}
          onAddVisit={() => setVisitForCase(c)}
          onDelete={() => {
            if (confirm("Delete this orthodontic case and all its visits?")) {
              deleteCase.mutate(c.id);
            }
          }}
          onAdvance={(status) =>
            updateCase.mutate({ id: c.id, input: { status } })
          }
        />
      ))}

      <NewCaseModal
        open={showNewCase}
        onClose={() => setShowNewCase(false)}
        onSubmit={async (input) => {
          await createCase.mutateAsync(input);
          setShowNewCase(false);
        }}
        saving={createCase.isPending}
      />

      <NewCaseModal
        open={!!editingCase}
        existing={editingCase ?? undefined}
        onClose={() => setEditingCase(null)}
        onSubmit={async (input) => {
          if (!editingCase) return;
          await updateCase.mutateAsync({ id: editingCase.id, input });
          setEditingCase(null);
        }}
        saving={updateCase.isPending}
      />

      <AddVisitModal
        c={visitForCase}
        onClose={() => setVisitForCase(null)}
        onSubmit={async (input) => {
          if (!visitForCase) return;
          await addVisit.mutateAsync({ caseId: visitForCase.id, input });
          setVisitForCase(null);
        }}
        saving={addVisit.isPending}
      />
    </div>
  );
}

function CaseCard({
  c,
  isActive,
  onEdit,
  onAddVisit,
  onDelete,
  onAdvance,
}: {
  c: OrthoCase;
  isActive: boolean;
  onEdit: () => void;
  onAddVisit: () => void;
  onDelete: () => void;
  onAdvance: (status: CaseStatus) => void;
}) {
  const balance = c.totalCost - c.paidAmount;
  const lastVisit = c.visits[0];
  const nextVisitDate = lastVisit?.nextVisitDate;
  const daysUntilNext = useMemo(() => {
    if (!nextVisitDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const next = new Date(nextVisitDate);
    next.setHours(0, 0, 0, 0);
    return Math.round((next.getTime() - now.getTime()) / 86_400_000);
  }, [nextVisitDate]);

  const STATUS_FLOW: CaseStatus[] = [
    "CONSULTATION",
    "RECORDS",
    "PLANNING",
    "ACTIVE",
    "RETENTION",
    "COMPLETED",
  ];
  const flowIndex = STATUS_FLOW.indexOf(c.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-stone-900">
                {TYPE_LABEL[c.type]} braces · {ARCH_LABEL[c.arches]}
              </h3>
              <Badge variant={STATUS_VARIANT[c.status]} className="text-[10px]">
                {STATUS_LABEL[c.status]}
              </Badge>
              {isActive && c.status === "ACTIVE" && (
                <Badge variant="primary" className="text-[10px]">
                  In treatment
                </Badge>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {c.doctor?.name ? `Dr. ${c.doctor.name}` : "Unassigned"}
              {" · "}
              {c.startDate
                ? `Started ${formatDate(c.startDate)}`
                : `Created ${formatDate(c.createdAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              title="Edit case"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
              title="Delete case"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress flow */}
        {flowIndex >= 0 && (
          <div className="flex items-center gap-1 mb-4">
            {STATUS_FLOW.map((s, i) => {
              const reached = i <= flowIndex;
              return (
                <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      reached ? "bg-blue-500" : "bg-stone-200"
                    )}
                  />
                  {i === STATUS_FLOW.length - 1 && (
                    <CheckCircle2
                      className={cn(
                        "w-3.5 h-3.5",
                        reached ? "text-blue-500" : "text-stone-300"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Key facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Fact
            label="Estimated end"
            value={
              c.estimatedEndDate ? formatDate(c.estimatedEndDate) : "—"
            }
            icon={<Calendar className="w-3.5 h-3.5" />}
          />
          <Fact
            label="Next visit"
            value={
              nextVisitDate
                ? `${formatDate(nextVisitDate)}${
                    daysUntilNext != null
                      ? ` (${
                          daysUntilNext === 0
                            ? "today"
                            : daysUntilNext > 0
                            ? `in ${daysUntilNext}d`
                            : `${-daysUntilNext}d overdue`
                        })`
                      : ""
                  }`
                : "Not scheduled"
            }
            icon={<Clock className="w-3.5 h-3.5" />}
            warn={daysUntilNext != null && daysUntilNext < 0}
          />
          <Fact
            label="Total cost"
            value={formatCurrency(c.totalCost)}
            icon={<DollarSign className="w-3.5 h-3.5" />}
          />
          <Fact
            label="Balance due"
            value={formatCurrency(balance)}
            icon={<DollarSign className="w-3.5 h-3.5" />}
            warn={balance > 0}
          />
        </div>

        {(c.chiefComplaint || c.diagnosis || c.treatmentPlan || c.notes) && (
          <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-xs">
            {c.chiefComplaint && (
              <DetailRow label="Chief complaint" value={c.chiefComplaint} />
            )}
            {c.diagnosis && <DetailRow label="Diagnosis" value={c.diagnosis} />}
            {c.treatmentPlan && (
              <DetailRow label="Plan" value={c.treatmentPlan} />
            )}
            {c.notes && <DetailRow label="Notes" value={c.notes} />}
          </div>
        )}

        {/* Status advance */}
        {flowIndex >= 0 && flowIndex < STATUS_FLOW.length - 1 && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2">
            <span className="text-xs text-stone-500">Advance to:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAdvance(STATUS_FLOW[flowIndex + 1])}
            >
              {STATUS_LABEL[STATUS_FLOW[flowIndex + 1]]}
            </Button>
          </div>
        )}

        {/* Visits */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-stone-700">
              Visit history ({c.visits.length})
            </h4>
            <Button
              size="sm"
              variant="outline"
              iconLeft={<CalendarPlus className="w-3.5 h-3.5" />}
              onClick={onAddVisit}
            >
              Add visit
            </Button>
          </div>
          {c.visits.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No visits recorded.</p>
          ) : (
            <ol className="space-y-2">
              {c.visits.map((v) => (
                <li
                  key={v.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-stone-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-stone-900">
                        {VISIT_LABEL[v.type]}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {formatDate(v.visitDate)}
                      </span>
                      {v.performedByName && (
                        <span className="text-[11px] text-stone-400">
                          · {v.performedByName}
                        </span>
                      )}
                    </div>
                    {(v.wireUpper || v.wireLower) && (
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Wires:
                        {v.wireUpper && ` upper ${v.wireUpper}`}
                        {v.wireUpper && v.wireLower && ","}
                        {v.wireLower && ` lower ${v.wireLower}`}
                      </div>
                    )}
                    {v.elastics && (
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Elastics: {v.elastics}
                      </div>
                    )}
                    {v.notes && (
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        {v.notes}
                      </div>
                    )}
                    {v.complications && (
                      <div className="text-[11px] text-red-600 mt-0.5 flex items-center gap-1">
                        <CircleAlert className="w-3 h-3" />
                        {v.complications}
                      </div>
                    )}
                    {v.nextVisitDate && (
                      <div className="text-[11px] text-blue-600 mt-1">
                        Next: {formatDate(v.nextVisitDate)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  value,
  icon,
  warn,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-stone-50 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-semibold mt-0.5",
          warn ? "text-red-600" : "text-stone-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-stone-400 font-medium">{label}: </span>
      <span className="text-stone-700">{value}</span>
    </div>
  );
}

interface NewCaseInput {
  type: BraceType;
  arches: Arches;
  status: CaseStatus;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  startDate: string;
  estimatedEndDate: string;
  intervalWeeks: number;
  totalCost: number;
  paidAmount: number;
  notes: string;
}

function NewCaseModal({
  open,
  existing,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  existing?: OrthoCase;
  onClose: () => void;
  onSubmit: (input: NewCaseInput) => Promise<void> | void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NewCaseInput>(() => buildInitial(existing));
  const syncKey = `${existing?.id ?? "new"}-${open}`;
  const [prevKey, setPrevKey] = useState(syncKey);
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open) setForm(buildInitial(existing));
  }

  if (!open) return null;
  const isEdit = !!existing;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? "Edit orthodontic case" : "New orthodontic case"}
      subtitle="Type, arches, plan, costs"
      size="lg"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={saving}
            onClick={() => onSubmit(form)}
          >
            {isEdit ? "Save changes" : "Create case"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Type"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as BraceType })
          }
          options={(Object.keys(TYPE_LABEL) as BraceType[]).map((t) => ({
            value: t,
            label: TYPE_LABEL[t],
          }))}
        />
        <Select
          label="Arches"
          value={form.arches}
          onChange={(e) =>
            setForm({ ...form, arches: e.target.value as Arches })
          }
          options={(Object.keys(ARCH_LABEL) as Arches[]).map((a) => ({
            value: a,
            label: ARCH_LABEL[a],
          }))}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as CaseStatus })
          }
          options={(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
        />
        <Input
          label="Adjustment interval (weeks)"
          type="number"
          min={1}
          max={12}
          value={form.intervalWeeks}
          onChange={(e) =>
            setForm({
              ...form,
              intervalWeeks: Number(e.target.value) || 4,
            })
          }
        />
        <Input
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <Input
          label="Estimated end date"
          type="date"
          value={form.estimatedEndDate}
          onChange={(e) =>
            setForm({ ...form, estimatedEndDate: e.target.value })
          }
        />
        <Input
          label="Total cost"
          type="number"
          min={0}
          step="0.01"
          value={form.totalCost}
          onChange={(e) =>
            setForm({ ...form, totalCost: Number(e.target.value) || 0 })
          }
        />
        <Input
          label="Paid"
          type="number"
          min={0}
          step="0.01"
          value={form.paidAmount}
          onChange={(e) =>
            setForm({ ...form, paidAmount: Number(e.target.value) || 0 })
          }
        />
      </div>
      <div className="mt-4 space-y-3">
        <Input
          label="Chief complaint"
          value={form.chiefComplaint}
          onChange={(e) =>
            setForm({ ...form, chiefComplaint: e.target.value })
          }
          placeholder="e.g. crowding, overbite, esthetic concern"
        />
        <Textarea
          label="Diagnosis"
          rows={2}
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
        />
        <Textarea
          label="Treatment plan"
          rows={3}
          value={form.treatmentPlan}
          onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
        />
        <Textarea
          label="Notes"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </Modal>
  );
}

function buildInitial(existing?: OrthoCase): NewCaseInput {
  return {
    type: existing?.type ?? "METAL",
    arches: existing?.arches ?? "BOTH",
    status: existing?.status ?? "CONSULTATION",
    chiefComplaint: existing?.chiefComplaint ?? "",
    diagnosis: existing?.diagnosis ?? "",
    treatmentPlan: existing?.treatmentPlan ?? "",
    startDate: existing?.startDate
      ? new Date(existing.startDate).toISOString().slice(0, 10)
      : "",
    estimatedEndDate: existing?.estimatedEndDate
      ? new Date(existing.estimatedEndDate).toISOString().slice(0, 10)
      : "",
    intervalWeeks: existing?.intervalWeeks ?? 4,
    totalCost: existing?.totalCost ?? 0,
    paidAmount: existing?.paidAmount ?? 0,
    notes: existing?.notes ?? "",
  };
}

interface NewVisitInput {
  type: VisitType;
  visitDate: string;
  wireUpper: string;
  wireLower: string;
  elastics: string;
  notes: string;
  complications: string;
  nextVisitDate: string;
}

function AddVisitModal({
  c,
  onClose,
  onSubmit,
  saving,
}: {
  c: OrthoCase | null;
  onClose: () => void;
  onSubmit: (input: NewVisitInput) => Promise<void> | void;
  saving: boolean;
}) {
  const open = !!c;
  const [form, setForm] = useState<NewVisitInput>(buildVisitInitial(c));
  const syncKey = `${c?.id ?? "none"}-${open}`;
  const [prevKey, setPrevKey] = useState(syncKey);
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open) setForm(buildVisitInitial(c));
  }
  if (!c) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Record visit"
      subtitle={`${TYPE_LABEL[c.type]} braces · ${ARCH_LABEL[c.arches]}`}
      size="lg"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={saving}
            onClick={() => onSubmit(form)}
          >
            Save visit
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Visit type"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as VisitType })
          }
          options={(Object.keys(VISIT_LABEL) as VisitType[]).map((t) => ({
            value: t,
            label: VISIT_LABEL[t],
          }))}
        />
        <Input
          label="Date"
          type="date"
          value={form.visitDate}
          onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
        />
        <Input
          label="Upper wire"
          value={form.wireUpper}
          onChange={(e) => setForm({ ...form, wireUpper: e.target.value })}
          placeholder="e.g. 0.016 NiTi"
        />
        <Input
          label="Lower wire"
          value={form.wireLower}
          onChange={(e) => setForm({ ...form, wireLower: e.target.value })}
          placeholder="e.g. 0.016 NiTi"
        />
        <Input
          label="Elastics"
          value={form.elastics}
          onChange={(e) => setForm({ ...form, elastics: e.target.value })}
          placeholder='e.g. "Class II 1/4 inch heavy"'
        />
        <Input
          label="Next visit date"
          type="date"
          value={form.nextVisitDate}
          onChange={(e) => setForm({ ...form, nextVisitDate: e.target.value })}
        />
      </div>
      <div className="mt-4 space-y-3">
        <Textarea
          label="Notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <Textarea
          label="Complications (if any)"
          rows={2}
          value={form.complications}
          onChange={(e) => setForm({ ...form, complications: e.target.value })}
        />
      </div>
    </Modal>
  );
}

function buildVisitInitial(c: OrthoCase | null): NewVisitInput {
  const today = new Date().toISOString().slice(0, 10);
  const interval = c?.intervalWeeks ?? 4;
  const next = new Date();
  next.setDate(next.getDate() + interval * 7);
  return {
    type: "ADJUSTMENT",
    visitDate: today,
    wireUpper: "",
    wireLower: "",
    elastics: "",
    notes: "",
    complications: "",
    nextVisitDate: next.toISOString().slice(0, 10),
  };
}
