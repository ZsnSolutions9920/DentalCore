"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { SlidePanel } from "@/components/ui/slide-panel";
import { usePatients, useAppointments } from "@/hooks/use-queries";
import type { Patient, Appointment } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useModuleEmit } from "@/modules/core/hooks";
import { SystemEvents } from "@/modules/core/events";

interface LineItem {
  id: string;
  description: string;
  type: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const emit = useModuleEmit("MOD-BILLING");
  const { data: patientsResponse } = usePatients();
  const allPatients = (patientsResponse?.data || []) as Patient[];
  const { data: appointmentsResponse } = useAppointments();
  const allAppointments = (appointmentsResponse?.data || []) as Appointment[];

  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("FIXED");
  const [taxRate] = useState(7);
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", type: "CONSULTATION", quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        type: "CONSULTATION",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    discountType === "PERCENTAGE" ? subtotal * (discountValue / 100) : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  const patientAppointments = allAppointments.filter((a) => a.patientId === patientId);

  const handleSaveDraft = () => {
    onClose();
  };

  const handleCreate = () => {
    const selectedPatient = allPatients.find((p) => p.id === patientId);
    const patientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "";
    emit(SystemEvents.INVOICE_CREATED, { patientName, total }, { patientId });
    onClose();
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      subtitle="Generate a new invoice"
      width="xl"
      data-id="BILL-CREATE"
      footer={
        <>
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button onClick={handleCreate}>Create Invoice</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Patient & Appointment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Patient"
            required
            options={allPatients.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName} (${p.patientCode})`,
            }))}
            placeholder="Select patient"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setAppointmentId("");
            }}
          />
          <Select
            label="Linked Appointment (Optional)"
            options={patientAppointments.map((a) => ({
              value: a.id,
              label: `${a.appointmentCode} - ${a.date} ${a.startTime}`,
            }))}
            placeholder="Select appointment"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-900">Line Items</h3>
            <Button variant="ghost" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={addItem}>
              Add Row
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-36">Type</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-28">Unit Price</TableHead>
                <TableHead className="w-28">Total</TableHead>
                <TableHead className="w-12">{" "}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Item description"
                      className="w-full px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4318FF]"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(item.id, "type", e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4318FF] appearance-none cursor-pointer"
                    >
                      <option value="CONSULTATION">Consultation</option>
                      <option value="PROCEDURE">Procedure</option>
                      <option value="PRODUCT">Product</option>
                      <option value="PACKAGE">Package</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4318FF]"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4318FF]"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-stone-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="border-t border-stone-200 pt-4">
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-3">
                <span className="text-stone-500">Discount</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4318FF]"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                    className="px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4318FF] appearance-none cursor-pointer"
                  >
                    <option value="FIXED">$</option>
                    <option value="PERCENTAGE">%</option>
                  </select>
                  <span className="text-stone-900 min-w-[80px] text-right">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Tax ({taxRate}%)</span>
                <span className="text-stone-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                <span className="font-bold text-stone-900">Total</span>
                <span className="text-lg font-bold text-stone-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}
