"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Plus,
  List,
  CalendarDays,
  Clock,
  UserCheck,
  Hourglass,
  CheckCircle,
  MapPin,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  AppointmentStatus,
  AppointmentType,
  UserRole,
} from "@/types";
import { useAppointments, useStaff } from "@/hooks/use-queries";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  appointmentStatusColors,
  appointmentTypeLabels,
} from "@/lib/constants";
import { CalendarView } from "@/components/appointments/calendar-view";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";
import { useModuleAccess } from "@/modules/core/hooks";
import { CLINIC_TZ, getClinicToday, shiftDay } from "@/lib/utils";
import type { Appointment } from "@/types";

const typeBadgeConfig: Record<string, { variant: "primary" | "success" | "warning" | "info" | "danger" | "default"; label: string }> = {
  CONSULTATION: { variant: "primary", label: "Consultation" },
  PROCEDURE: { variant: "success", label: "Procedure" },
  FOLLOW_UP: { variant: "warning", label: "Follow-Up" },
  REVIEW: { variant: "info", label: "Review" },
  EMERGENCY: { variant: "danger", label: "Emergency" },
};

export default function AppointmentsPage() {
  const access = useModuleAccess("MOD-APPOINTMENT");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(getClinicToday());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointmentsResponse, isLoading: isLoadingAppointments } = useAppointments({ date: selectedDate });
  const rawAppointments = (appointmentsResponse?.data || []) as Array<Record<string, unknown>>;
  const allAppointments = useMemo<Appointment[]>(() => {
    return rawAppointments.map((a) => {
      const patient = a.patient as { firstName?: string; lastName?: string } | undefined;
      const doctor = a.doctor as { name?: string } | undefined;
      const room = a.room as { name?: string; number?: string } | undefined;
      return {
        ...a,
        patientName:
          (a.patientName as string) ||
          [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
          "Unknown patient",
        doctorName: (a.doctorName as string) || doctor?.name || "Unassigned",
        roomName: (a.roomName as string) || room?.name || room?.number || "",
      } as unknown as Appointment;
    });
  }, [rawAppointments]);

  const { data: staffResponse, isLoading: isLoadingStaff } = useStaff();
  const staffUsers = (staffResponse?.data || []) as Array<{ id: string; name: string; role: string }>;
  const doctors = staffUsers.filter((u) => u.role === UserRole.DOCTOR);

  const todayAppointments = allAppointments;

  const filteredAppointments = useMemo(() => {
    return todayAppointments.filter((a) => {
      if (doctorFilter && a.doctorId !== doctorFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [todayAppointments, doctorFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = todayAppointments.length;
    const checkedIn = todayAppointments.filter(
      (a) => a.status === AppointmentStatus.CHECKED_IN
    ).length;
    const waiting = todayAppointments.filter(
      (a) => a.status === AppointmentStatus.WAITING
    ).length;
    const completed = todayAppointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED
    ).length;
    return { total, checkedIn, waiting, completed };
  }, [todayAppointments]);

  const statusBadgeVariant = (status: string) =>
    (appointmentStatusColors[status] || "default") as
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "default"
      | "primary";

  const sorted = [...filteredAppointments].sort((a, b) =>
    (a.startTime || "").localeCompare(b.startTime || "")
  );

  const todayFormatted = new Date(`${selectedDate}T12:00:00+05:00`).toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: CLINIC_TZ,
  });

  if (isLoadingAppointments || isLoadingStaff) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  if (!access.canView) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        You don&apos;t have access to this module.
      </div>
    );
  }

  return (
    <div data-id="APPT-LIST" className="flex flex-col space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Appointments
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="primary">
                <Calendar className="w-3 h-3 mr-1" />
                Today
              </Badge>
              <span className="text-sm text-stone-500">{todayFormatted}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-stone-100 rounded-2xl p-1 border border-stone-200/60">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                view === "list"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                view === "calendar"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </div>
          {access.canCreate && (
            <Button
              iconLeft={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              New Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Today"
          value={stats.total}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          label="Checked In"
          value={stats.checkedIn}
          icon={<UserCheck className="w-5 h-5" />}
          color="info"
        />
        <StatCard
          label="Waiting"
          value={stats.waiting}
          icon={<Hourglass className="w-5 h-5" />}
          color="warning"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-700">Date</label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setSelectedDate(shiftDay(selectedDate, -1))}
              className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button
              type="button"
              aria-label="Next day"
              onClick={() => setSelectedDate(shiftDay(selectedDate, 1))}
              className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {selectedDate !== getClinicToday() && (
              <button
                type="button"
                onClick={() => setSelectedDate(getClinicToday())}
                className="px-3 py-2.5 text-sm font-medium bg-white border border-stone-200 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        </div>
        <Select
          label="Doctor"
          placeholder="All Doctors"
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          options={doctors.map((d) => ({ value: d.id, label: d.name }))}
        />
        <Select
          label="Type"
          placeholder="All Types"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={Object.entries(appointmentTypeLabels).map(([v, l]) => ({
            value: v,
            label: l,
          }))}
        />
        <Select
          label="Status"
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={Object.values(AppointmentStatus).map((s) => ({
            value: s,
            label: s.replace(/_/g, " "),
          }))}
        />
        {(doctorFilter || typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setDoctorFilter("");
              setTypeFilter("");
              setStatusFilter("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium pb-2.5 cursor-pointer transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="flex flex-col gap-3">
          {sorted.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-stone-400" />
              </div>
              <p className="text-stone-500 text-sm font-medium">
                No appointments match the selected filters.
              </p>
              <p className="text-stone-400 text-xs mt-1">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}

          {sorted.map((appt) => {
            const typeConfig = typeBadgeConfig[appt.type] || { variant: "default" as const, label: appt.type };
            return (
              <Card
                key={appt.id}
                hover
                onClick={() => setSelectedAppointment(appt)}
                className="group transition-all duration-200 hover:shadow-md hover:border-blue-200/60"
              >
                <div className="flex items-center gap-3 sm:gap-5 p-4 sm:p-5 flex-wrap sm:flex-nowrap">
                  {/* Time Block */}
                  <div className="flex-shrink-0 w-16 sm:w-20 text-center">
                    <div className="bg-blue-50 rounded-2xl px-3 py-2.5 border border-blue-100/60">
                      <p className="text-lg font-bold text-blue-700 leading-tight tracking-tight">
                        {appt.startTime}
                      </p>
                      <p className="text-[10px] text-blue-500 font-medium mt-0.5">
                        {appt.endTime}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-14 bg-stone-200/70 flex-shrink-0" />

                  {/* Patient Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar name={appt.patientName} size="lg" />
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate">
                        {appt.patientName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
                        <Stethoscope className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{appt.doctorName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Type & Room */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={typeConfig.variant}>
                      {typeConfig.label}
                    </Badge>
                    {appt.roomName && (
                      <Badge variant="default">
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        {appt.roomName}
                      </Badge>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    <Badge variant={statusBadgeVariant(appt.status)} dot>
                      {appt.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <CalendarView onSelectAppointment={setSelectedAppointment} />
      )}

      {/* Create Modal */}
      <CreateAppointmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Detail Slideover */}
      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
