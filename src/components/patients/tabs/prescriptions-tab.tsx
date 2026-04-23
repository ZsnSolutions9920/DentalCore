"use client";

import { useState } from "react";
import { Pill, Plus, Printer, Trash2, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SlidePanel } from "@/components/ui/slide-panel";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading";
import { usePatientPrescriptions, useCreatePatientPrescription, useDeletePrescription } from "@/hooks/use-queries";
import { useModuleEmit } from "@/modules/core/hooks";
import { SystemEvents } from "@/modules/core/events";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import type { Prescription } from "@/types";

interface RxRow {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export function PrescriptionsTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const emit = useModuleEmit("MOD-PRESCRIPTION");
  const { data: response, isLoading } = usePatientPrescriptions(patientId);
  const createRx = useCreatePatientPrescription(patientId);
  const deleteRx = useDeletePrescription(patientId);

  const [showCreate, setShowCreate] = useState(false);
  const [rows, setRows] = useState<RxRow[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const addRow = () => setRows((prev) => [...prev, {
    id: crypto.randomUUID(), medicineName: "", dosage: "", frequency: "", duration: "", route: "", instructions: "",
  }]);

  const updateRow = (id: string, field: keyof RxRow, value: string) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const handleCreate = async () => {
    const valid = rows.filter((r) => r.medicineName.trim());
    if (valid.length === 0) { setError("Add at least one medicine"); return; }
    setError("");
    try {
      await createRx.mutateAsync({
        doctorId: user?.id,
        notes: notes.trim() || undefined,
        items: valid.map((r) => ({
          medicineName: r.medicineName.trim(),
          dosage: r.dosage.trim() || undefined,
          frequency: r.frequency || undefined,
          duration: r.duration.trim() || undefined,
          route: r.route || undefined,
          instructions: r.instructions.trim() || undefined,
        })),
      });
      emit(SystemEvents.PRESCRIPTION_CREATED, {}, { patientId });
      setRows([]); setNotes(""); setShowCreate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create prescription");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this prescription?")) return;
    await deleteRx.mutateAsync(id);
  };

  const handlePrint = (id: string) => {
    window.open(`/api/prescriptions/${id}/print`, "_blank");
  };

  if (isLoading) return <LoadingSpinner />;

  const prescriptions = (response?.data || []) as Prescription[];

  return (
    <div data-id="PATIENT-PRESCRIPTIONS-TAB" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-stone-900">Prescriptions ({prescriptions.length})</h3>
        </div>
        <Button size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowCreate(true); if (rows.length === 0) addRow(); }}>
          New Prescription
        </Button>
      </div>

      {/* List */}
      {prescriptions.length > 0 ? (
        prescriptions.map((rx) => (
          <Card key={rx.id} padding="md">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-stone-900">
                    {formatDate(rx.createdAt)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{rx.doctorName}</Badge>
                  {rx.appointmentId && (
                    <Badge variant="default">
                      <ExternalLink className="w-2.5 h-2.5 mr-1" />
                      Linked
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handlePrint(rx.id)} title="Print prescription">
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(rx.id)} title="Deactivate">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Instructions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rx.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><span className="font-medium">{item.medicineName}</span></TableCell>
                      <TableCell>{item.dosage || "—"}</TableCell>
                      <TableCell>{item.frequency || "—"}</TableCell>
                      <TableCell>{item.duration || "—"}</TableCell>
                      <TableCell><span className="text-xs text-stone-500">{item.instructions || "—"}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rx.notes && (
                <div className="px-4 py-3 border-t border-stone-200">
                  <p className="text-xs text-stone-500"><span className="font-medium">Note:</span> {rx.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card padding="md">
          <CardContent>
            <p className="text-sm text-stone-500 text-center py-4">No prescriptions yet</p>
          </CardContent>
        </Card>
      )}

      {/* Create Prescription Slide Panel */}
      <SlidePanel
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setRows([]); setNotes(""); setError(""); }}
        title="New Prescription"
        subtitle="Add medicines for this patient"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowCreate(false); setRows([]); setNotes(""); setError(""); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRx.isPending || rows.filter((r) => r.medicineName.trim()).length === 0}>
              {createRx.isPending ? "Saving..." : "Save Prescription"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>
          )}

          {rows.map((row, idx) => (
            <div key={row.id} className="bg-stone-50 rounded-xl border border-stone-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-400">Medicine {idx + 1}</span>
                <button onClick={() => removeRow(row.id)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Input label="Medicine Name" required placeholder="e.g. Tretinoin Cream 0.025%" value={row.medicineName} onChange={(e) => updateRow(row.id, "medicineName", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Dosage" placeholder="e.g. Apply thin layer" value={row.dosage} onChange={(e) => updateRow(row.id, "dosage", e.target.value)} />
                <Select label="Frequency" placeholder="Select" value={row.frequency} onChange={(e) => updateRow(row.id, "frequency", e.target.value)}
                  options={[
                    { value: "OD", label: "OD — Once daily" },
                    { value: "BD", label: "BD — Twice daily" },
                    { value: "TDS", label: "TDS — Three times" },
                    { value: "QDS", label: "QDS — Four times" },
                    { value: "PRN", label: "PRN — As needed" },
                    { value: "STAT", label: "STAT — Immediately" },
                    { value: "HS", label: "HS — At bedtime" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Duration" placeholder="e.g. 2 weeks" value={row.duration} onChange={(e) => updateRow(row.id, "duration", e.target.value)} />
                <Select label="Route" placeholder="Select" value={row.route} onChange={(e) => updateRow(row.id, "route", e.target.value)}
                  options={[
                    { value: "Topical", label: "Topical" },
                    { value: "Oral", label: "Oral" },
                    { value: "Injection", label: "Injection" },
                    { value: "Inhalation", label: "Inhalation" },
                    { value: "Sublingual", label: "Sublingual" },
                  ]}
                />
              </div>
              <Input label="Instructions" placeholder="e.g. Apply at night, avoid sun" value={row.instructions} onChange={(e) => updateRow(row.id, "instructions", e.target.value)} />
            </div>
          ))}

          <Button variant="outline" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={addRow} className="w-full">
            Add Medicine
          </Button>

          <Input label="Prescription Notes" placeholder="Additional notes for this prescription..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </SlidePanel>
    </div>
  );
}
