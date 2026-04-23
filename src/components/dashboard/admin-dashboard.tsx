"use client";

import {
  Calendar, Users, CreditCard, DollarSign, UserPlus, Receipt,
  BarChart3, UserCog, Brain, Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useAppointments } from "@/hooks/use-queries";
import { timeAgo, getClinicToday, CLINIC_TZ } from "@/lib/utils";
import { appointmentStatusColors } from "@/lib/constants";
import Link from "next/link";
import { useModuleStore } from "@/modules/core/store";
import { AddPatientModal } from "@/components/patients/add-patient-modal";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { CreateInvoiceModal } from "@/components/billing/create-invoice-modal";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

// Extract patient/doctor name from appointment (handles nested API format)
function getAptPatientName(apt: Record<string, unknown>): string {
  if (apt.patientName) return String(apt.patientName);
  const p = apt.patient as Record<string, unknown> | undefined;
  if (p?.firstName) return `${p.firstName} ${p.lastName || ""}`.trim();
  return "Patient";
}
function getAptDoctorName(apt: Record<string, unknown>): string {
  if (apt.doctorName) return String(apt.doctorName);
  const d = apt.doctor as Record<string, unknown> | undefined;
  if (d?.name) return String(d.name);
  return "Doctor";
}

const quickActions = [
  { label: "New Patient", icon: <UserPlus className="w-5 h-5" />, href: "/patients/new", dataId: "PATIENT-PROFILE-CREATE", bg: "bg-teal-50", text: "text-teal-600" },
  { label: "Book Appointment", icon: <Calendar className="w-5 h-5" />, href: "/appointments", dataId: "APPT-CREATE", bg: "bg-emerald-50", text: "text-emerald-600" },
  { label: "Create Invoice", icon: <Receipt className="w-5 h-5" />, href: "/billing", dataId: "BILL-CREATE", bg: "bg-amber-50", text: "text-amber-600" },
  { label: "AI Assistant", icon: <Brain className="w-5 h-5" />, href: "/ai", dataId: "AI-TRANSCRIBE-START", bg: "bg-indigo-50", text: "text-indigo-600" },
  { label: "Staff", icon: <UserCog className="w-5 h-5" />, href: "/admin/users", dataId: "ADMIN-USERS", bg: "bg-rose-50", text: "text-rose-600" },
  { label: "Reports", icon: <BarChart3 className="w-5 h-5" />, href: "/admin/reports", dataId: "ADMIN-REPORTS", bg: "bg-sky-50", text: "text-sky-600" },
];

export function AdminDashboard() {
  const { activities, unreadCount, waitingQueue, counters } = useModuleStore();
  const { user } = useAuth();
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = new Date().toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: CLINIC_TZ });

  // API data
  const { data: statsData, isLoading: statsLoading, isError: statsError } = useDashboardStats("admin");
  const stats = (statsData?.data as Record<string, unknown>) || {};
  const todayAppointments = (stats.todayAppointments as number) || 0;
  const activePatients = (stats.activePatients as number) || 0;
  const pendingBills = (stats.pendingBills as number) || 0;
  const revenue = (stats.revenue as number) || 0;

  const today = getClinicToday();
  const { data: aptsData, isLoading: aptsLoading, isError: aptsError } = useAppointments({ date: today });
  const todayApts = (Array.isArray(aptsData?.data) ? aptsData.data : []).slice(0, 6) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="DASH-ADMIN">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-4 sm:p-6 text-white shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-5 h-5 text-teal-200" />
          <p className="text-teal-100 text-sm">Welcome back</p>
        </div>
        <h1 className="text-lg sm:text-xl font-semibold">{greeting}, {user?.name || "there"}</h1>
        <p className="text-teal-100 mt-1 text-sm">{todayLabel} &mdash; Here&apos;s your clinic at a glance.</p>
      </div>

      {/* Error banner */}
      {(statsError || aptsError) && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          Unable to load some dashboard data. Please try refreshing.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Today's Appointments" value={statsLoading ? 0 : todayAppointments} icon={<Calendar className="w-6 h-6" />} trend={12} trendLabel="vs last week" color="primary" />
        <StatCard label="Active Patients" value={statsLoading ? 0 : activePatients.toLocaleString()} icon={<Users className="w-6 h-6" />} trend={5} trendLabel="this month" color="success" />
        <StatCard label="Pending Bills" value={statsLoading ? 0 : pendingBills} icon={<CreditCard className="w-6 h-6" />} color="warning" />
        <StatCard label="Revenue" value={statsLoading ? "Rs 0" : `Rs ${revenue.toLocaleString()}`} icon={<DollarSign className="w-6 h-6" />} trend={18} trendLabel="vs last month" color="info" />
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-stone-900">Today&apos;s Schedule</h2>
            <Link href="/appointments" className="text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {aptsLoading ? (
              <div className="text-sm text-stone-400 py-8 text-center">Loading appointments...</div>
            ) : todayApts.length === 0 ? (
              <div className="text-sm text-stone-400 py-8 text-center">No appointments scheduled for today.</div>
            ) : (
              todayApts.map((apt) => (
                <div
                  key={apt.id as string}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="min-w-[48px] sm:min-w-[56px] text-center">
                    <p className="text-sm font-semibold text-stone-900">{(apt.startTime as string) || "—"}</p>
                    <p className="text-xs text-stone-400">{(apt.endTime as string) || "—"}</p>
                  </div>
                  <div className="w-px h-10 bg-stone-100" />
                  <Avatar name={getAptPatientName(apt)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{getAptPatientName(apt)}</p>
                    <p className="text-xs text-stone-500">{getAptDoctorName(apt)}</p>
                  </div>
                  <Badge variant="info">{((apt.type as string) || "").replace("_", " ")}</Badge>
                  <Badge
                    variant={appointmentStatusColors[(apt.status as string) || ""] as "success" | "warning" | "danger" | "info" | "default"}
                  >
                    {((apt.status as string) || "").replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
            {quickActions.map((action) =>
              ["PATIENT-PROFILE-CREATE", "APPT-CREATE", "BILL-CREATE"].includes(action.dataId) ? (
                <button
                  key={action.label}
                  data-id={action.dataId}
                  onClick={() => {
                    if (action.dataId === "PATIENT-PROFILE-CREATE") setShowAddPatient(true);
                    else if (action.dataId === "APPT-CREATE") setShowBookAppointment(true);
                    else if (action.dataId === "BILL-CREATE") setShowCreateInvoice(true);
                  }}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.text} group-hover:scale-105 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-stone-700 text-center">{action.label}</span>
                </button>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  data-id={action.dataId}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.text} group-hover:scale-105 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-stone-700 text-center">{action.label}</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-stone-900">Recent Activity</h2>
        {activities.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Live Activity</p>
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start gap-2 text-sm text-stone-600 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>{act.message}</span>
              </div>
            ))}
          </div>
        )}
        {activities.length === 0 && (
          <Card className="rounded-2xl border-stone-100 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm text-stone-400 text-center py-4">No recent activity to display.</p>
            </CardContent>
          </Card>
        )}
        {waitingQueue.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
            <span className="font-medium">{waitingQueue.length}</span> patient{waitingQueue.length !== 1 ? "s" : ""} in waiting queue
          </div>
        )}
        {unreadCount > 0 && (
          <div className="mt-2 p-3 bg-teal-50 rounded-xl text-sm text-teal-700">
            <span className="font-medium">{unreadCount}</span> unread notification{unreadCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Slide Panels */}
      <AddPatientModal isOpen={showAddPatient} onClose={() => setShowAddPatient(false)} />
      <CreateAppointmentModal isOpen={showBookAppointment} onClose={() => setShowBookAppointment(false)} />
      <CreateInvoiceModal isOpen={showCreateInvoice} onClose={() => setShowCreateInvoice(false)} />
    </div>
  );
}
