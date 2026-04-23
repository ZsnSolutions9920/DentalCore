"use client";

import { useState } from "react";
import { useModuleAccess } from "@/modules/core/hooks";
import { Settings, Save, Bell, CreditCard, CalendarDays, Clock, Play, Loader2 } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Checkbox,
  Select,
} from "@/components/ui";

const tabs = [
  { label: "General", value: "general", icon: Settings },
  { label: "Notifications", value: "notifications", icon: Bell },
  { label: "Billing", value: "billing", icon: CreditCard },
  { label: "Appointments", value: "appointments", icon: CalendarDays },
  { label: "Reminders", value: "reminders", icon: Clock },
];

export default function AdminSettingsPage() {
  const access = useModuleAccess("MOD-BRANCH");
  const [activeTab, setActiveTab] = useState("general");

  // Reminders tab state
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [appointmentTiming, setAppointmentTiming] = useState("24");
  const [followUpAlerts, setFollowUpAlerts] = useState(true);
  const [followUpDays, setFollowUpDays] = useState("3");
  const [packageExpiryAlerts, setPackageExpiryAlerts] = useState(true);
  const [packageExpiryDays, setPackageExpiryDays] = useState("7");
  const [invoiceOverdue, setInvoiceOverdue] = useState(false);
  const [invoicePastDueAlert, setInvoicePastDueAlert] = useState(true);
  const [runningReminders, setRunningReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRunReminders = async () => {
    setRunningReminders(true);
    setReminderResult(null);
    try {
      const res = await fetch("/api/cron/reminders", { method: "POST" });
      const data = await res.json();
      setReminderResult({
        success: res.ok,
        message: res.ok
          ? data.message || "Reminders processed successfully."
          : data.error || "Failed to run reminders.",
      });
    } catch {
      setReminderResult({ success: false, message: "Network error. Could not reach the server." });
    } finally {
      setRunningReminders(false);
    }
  };

  if (!access.canView) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        You don&apos;t have access to this module.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="ADMIN-SETTINGS">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Settings</h1>
            <p className="text-sm text-stone-500 mt-0.5">Configure your clinic preferences</p>
          </div>
        </div>
        <Button iconLeft={<Save className="w-4 h-4" />}>Save Changes</Button>
      </div>

      {/* Pill Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
                activeTab === tab.value
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
          <Card padding="lg" className="max-w-2xl">
            <p className="font-semibold text-stone-700 mb-4">Clinic Information</p>
            <div className="space-y-4">
              <Input label="Clinic Name" defaultValue="DentaCore Dental Clinic" />
              <Input label="Phone" defaultValue="(555) 100-0001" />
              <Input label="Email" defaultValue="info@dentacore.com" />
              <Input label="Website" defaultValue="https://dentacore.com" />
            </div>
          </Card>
          <Card padding="lg" className="max-w-2xl">
            <p className="font-semibold text-stone-700 mb-4">Address</p>
            <div className="space-y-4">
              <Input label="Street Address" defaultValue="123 Medical Plaza" />
              <Input label="City" defaultValue="Downtown" />
              <Input label="State" defaultValue="CA" />
              <Input label="Zip Code" defaultValue="90210" />
            </div>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <Card padding="lg">
            <p className="font-semibold text-stone-700 mb-4">Email Notifications</p>
            <div className="space-y-3">
              <Checkbox checked={true} label="New appointment bookings" />
              <Checkbox checked={true} label="Appointment cancellations" />
              <Checkbox checked={true} label="Payment received" />
              <Checkbox checked={false} label="Daily summary report" />
              <Checkbox checked={true} label="New patient registration" />
            </div>
          </Card>
          <Card padding="lg">
            <p className="font-semibold text-stone-700 mb-4">SMS Notifications</p>
            <div className="space-y-3">
              <Checkbox checked={true} label="Appointment reminders (24h before)" />
              <Checkbox checked={true} label="Appointment reminders (1h before)" />
              <Checkbox checked={false} label="Follow-up reminders" />
              <Checkbox checked={false} label="Birthday greetings" />
            </div>
          </Card>
        </div>
      )}

      {/* Billing */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <Card padding="lg">
            <p className="font-semibold text-stone-700 mb-4">Payment Settings</p>
            <div className="space-y-4">
              <Input label="Default Tax Rate (%)" defaultValue="7" type="number" />
              <Input label="Invoice Prefix" defaultValue="INV-2026" />
              <Input label="Payment Terms (days)" defaultValue="30" type="number" />
            </div>
          </Card>
          <Card padding="lg">
            <p className="font-semibold text-stone-700 mb-4">Payment Methods</p>
            <div className="space-y-3">
              <Checkbox checked={true} label="Cash" />
              <Checkbox checked={true} label="Credit/Debit Card" />
              <Checkbox checked={true} label="Bank Transfer" />
              <Checkbox checked={true} label="Digital Wallet" />
              <Checkbox checked={false} label="Insurance" />
            </div>
          </Card>
        </div>
      )}

      {/* Appointments */}
      {activeTab === "appointments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <Card padding="lg">
            <p className="font-semibold text-stone-700 mb-4">Scheduling</p>
            <div className="space-y-4">
              <Input label="Default Slot Duration (min)" defaultValue="30" type="number" />
              <Input label="Buffer Between Appointments (min)" defaultValue="5" type="number" />
              <Input label="Max Advance Booking (days)" defaultValue="90" type="number" />
            </div>
          </Card>
          <Card padding="lg">
            <p className="font-semibold text-stone-700 mb-4">Working Hours</p>
            <div className="space-y-4">
              <Input label="Opens At" defaultValue="08:00" type="time" />
              <Input label="Closes At" defaultValue="18:00" type="time" />
              <div className="pt-2">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Working Days</p>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                    <button
                      key={day}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        i < 6
                          ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reminders */}
      {activeTab === "reminders" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Appointment Reminders */}
            <Card padding="lg">
              <p className="font-semibold text-stone-700 mb-4">Appointment Reminders</p>
              <div className="space-y-4">
                <Checkbox
                  checked={appointmentReminders}
                  onChange={(v) => setAppointmentReminders(v)}
                  label="Enable appointment reminders"
                />
                <Select
                  label="Send reminder before appointment"
                  value={appointmentTiming}
                  onChange={(e) => setAppointmentTiming(e.target.value)}
                  disabled={!appointmentReminders}
                  options={[
                    { value: "1", label: "1 hour before" },
                    { value: "2", label: "2 hours before" },
                    { value: "4", label: "4 hours before" },
                    { value: "12", label: "12 hours before" },
                    { value: "24", label: "24 hours before" },
                  ]}
                />
              </div>
            </Card>

            {/* Follow-Up Reminders */}
            <Card padding="lg">
              <p className="font-semibold text-stone-700 mb-4">Follow-Up Reminders</p>
              <div className="space-y-4">
                <Checkbox
                  checked={followUpAlerts}
                  onChange={(v) => setFollowUpAlerts(v)}
                  label="Enable overdue follow-up alerts"
                />
                <Select
                  label="Auto-notify doctor when follow-up is overdue by"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(e.target.value)}
                  disabled={!followUpAlerts}
                  options={[
                    { value: "1", label: "1 day" },
                    { value: "2", label: "2 days" },
                    { value: "3", label: "3 days" },
                    { value: "7", label: "7 days" },
                  ]}
                />
              </div>
            </Card>

            {/* Package Expiry */}
            <Card padding="lg">
              <p className="font-semibold text-stone-700 mb-4">Package Expiry</p>
              <div className="space-y-4">
                <Checkbox
                  checked={packageExpiryAlerts}
                  onChange={(v) => setPackageExpiryAlerts(v)}
                  label="Enable package expiry alerts"
                />
                <Select
                  label="Alert before expiry"
                  value={packageExpiryDays}
                  onChange={(e) => setPackageExpiryDays(e.target.value)}
                  disabled={!packageExpiryAlerts}
                  options={[
                    { value: "3", label: "3 days before" },
                    { value: "7", label: "7 days before" },
                    { value: "14", label: "14 days before" },
                    { value: "30", label: "30 days before" },
                  ]}
                />
              </div>
            </Card>

            {/* Invoice Reminders */}
            <Card padding="lg">
              <p className="font-semibold text-stone-700 mb-4">Invoice Reminders</p>
              <div className="space-y-4">
                <Checkbox
                  checked={invoiceOverdue}
                  onChange={(v) => setInvoiceOverdue(v)}
                  label="Auto-mark overdue invoices"
                />
                <Checkbox
                  checked={invoicePastDueAlert}
                  onChange={(v) => setInvoicePastDueAlert(v)}
                  label="Alert when invoice is past due"
                />
              </div>
            </Card>
          </div>

          {/* Manual Trigger */}
          <Card padding="lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-stone-700">Manual Trigger</p>
                <p className="text-sm text-stone-500 mt-0.5">
                  Run all configured reminders immediately instead of waiting for the scheduled cron.
                </p>
              </div>
              <Button
                onClick={handleRunReminders}
                disabled={runningReminders}
                iconLeft={
                  runningReminders
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Play className="w-4 h-4" />
                }
              >
                {runningReminders ? "Running..." : "Run Reminders Now"}
              </Button>
            </div>
            {reminderResult && (
              <div
                className={`mt-4 px-4 py-3 rounded-xl text-sm ${
                  reminderResult.success
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {reminderResult.message}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
