"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, DoorOpen,
  Plus, Clock, User, Stethoscope, AlertTriangle, Search, Ban, Zap, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading";
import { SlidePanel } from "@/components/ui/slide-panel";
import { SearchInput } from "@/components/ui/search-input";
import { useCalendar, useStaff, useBranches, usePatients, usePatient, useCreateAppointment, usePatientAppointments, useTreatments, useAvailableSlots, useBlockSlot, useUnblockSlot } from "@/hooks/use-queries";
import { useModuleAccess, useModuleEmit } from "@/modules/core/hooks";
import { SystemEvents } from "@/modules/core/events";
import { useAuth } from "@/lib/auth-context";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";
import { cn, getClinicToday, toClinicDay, CLINIC_TZ } from "@/lib/utils";
import type { Patient, Appointment } from "@/types";

type ViewMode = "day" | "week" | "doctor" | "room";

interface SlotInfo {
  time: string;
  endTime: string;
  status: string;
  appointment?: Record<string, unknown>;
  blocked?: Record<string, unknown>;
}

interface DoctorCalendar {
  doctor: { id: string; name: string; speciality?: string };
  slots: SlotInfo[];
  isOnLeave: boolean;
  leaveReason?: string;
}

interface RoomCalendar {
  room: { id: string; name: string; type: string; status: string };
  slots: SlotInfo[];
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  available: { bg: "bg-white hover:bg-blue-50", border: "border-stone-100 hover:border-blue-300", text: "text-stone-300" },
  booked: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  checked_in: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  in_progress: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  completed: { bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-400" },
  blocked: { bg: "bg-stone-100", border: "border-stone-200", text: "text-stone-400" },
  unavailable: { bg: "bg-stone-50", border: "border-transparent", text: "text-stone-300" },
  no_show: { bg: "bg-red-50", border: "border-red-200", text: "text-red-400" },
  cancelled: { bg: "bg-red-50/50", border: "border-red-100", text: "text-red-300" },
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric", timeZone: CLINIC_TZ });
}

function getWeekDates(date: string): string[] {
  const d = new Date(date + "T00:00:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return toClinicDay(dd);
  });
}

export default function CalendarPage() {
  const access = useModuleAccess("MOD-APPOINTMENT");
  const [view, setView] = useState<ViewMode>("room");
  const [selectedDate, setSelectedDate] = useState(getClinicToday());
  const [doctorFilter, setDoctorFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [bookingSlot, setBookingSlot] = useState<{ time: string; endTime: string; doctorId: string; doctorName: string; date: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const unblockSlot = useUnblockSlot();

  // Week dates
  const weekDates = useMemo(() => view === "week" ? getWeekDates(selectedDate) : [selectedDate], [view, selectedDate]);

  // Calendar data
  const calendarParams: Record<string, string> = { date: weekDates[0], view };
  if (weekDates.length > 1) calendarParams.endDate = weekDates[weekDates.length - 1];
  if (doctorFilter) calendarParams.doctorId = doctorFilter;
  if (branchFilter) calendarParams.branchId = branchFilter;

  const { data: calResponse, isLoading } = useCalendar(calendarParams);
  const calendarData = (calResponse?.data || {}) as Record<string, { doctors: DoctorCalendar[]; rooms: RoomCalendar[] }>;
  const summary = (calResponse?.summary || {}) as Record<string, number>;

  // Filters data
  const { data: staffRes } = useStaff();
  const doctors = ((staffRes?.data || []) as { id: string; name: string; role: string }[]).filter((u) => u.role === "DOCTOR");
  const { data: branchRes } = useBranches();
  const branches = ((branchRes?.data || []) as { id: string; name: string }[]);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + (view === "week" ? delta * 7 : delta));
    setSelectedDate(toClinicDay(d));
  };

  const today = getClinicToday();

  if (!access.canView) {
    return <div className="flex items-center justify-center py-20 text-stone-500">You don&apos;t have access to this module.</div>;
  }

  return (
    <div className="space-y-4" data-id="MOD-CALENDAR">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-stone-900">Clinic Calendar</h1>
            <p className="text-xs text-stone-400">Scheduling workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconLeft={<Zap className="w-3.5 h-3.5" />} onClick={() => setShowAvailability(!showAvailability)}>
            {showAvailability ? "Hide" : "Find Available"}
          </Button>
          <Button variant="outline" size="sm" iconLeft={<Ban className="w-3.5 h-3.5" />} onClick={() => setShowBlockForm(!showBlockForm)}>
            Block Slot
          </Button>
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setBookingSlot({ time: "09:00", endTime: "09:30", doctorId: "", doctorName: "", date: selectedDate })}>
            Book
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-xl border border-stone-100 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.availableSlots || 0}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Available Slots</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.bookedSlots || 0}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Booked</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-3 text-center">
          <p className="text-2xl font-bold text-stone-600">{summary.doctorCount || 0}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Doctors</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{summary.availableRooms || 0}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Rooms Available</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap">
        {/* Date Nav */}
        <div className="flex items-center gap-1.5 bg-white rounded-xl border border-stone-200 p-1">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-4 h-4 text-stone-500" /></button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-1.5 text-sm font-medium text-stone-900 bg-transparent border-none outline-none cursor-pointer" />
          <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-stone-100 cursor-pointer"><ChevronRight className="w-4 h-4 text-stone-500" /></button>
          {selectedDate !== today && (
            <button onClick={() => setSelectedDate(today)} className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">Today</button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-0.5 bg-stone-100 rounded-xl p-1">
          {([
            { value: "room", label: "Rooms", icon: <DoorOpen className="w-3.5 h-3.5" /> },
            { value: "doctor", label: "Doctors", icon: <User className="w-3.5 h-3.5" /> },
            { value: "day", label: "All", icon: <Clock className="w-3.5 h-3.5" /> },
            { value: "week", label: "Week", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
          ] as { value: ViewMode; label: string; icon: React.ReactNode }[]).map((v) => (
            <button key={v.value} onClick={() => setView(v.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                view === v.value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Select placeholder="All Doctors" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
          options={[{ value: "", label: "All Doctors" }, ...doctors.map((d) => ({ value: d.id, label: d.name }))]} />
        {branches.length > 1 && (
          <Select placeholder="All Branches" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            options={[{ value: "", label: "All Branches" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} />
        )}
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Mobile Agenda View */}
          <div className="md:hidden">
            <AgendaView
              data={calendarData[selectedDate]}
              date={selectedDate}
              onAppointmentClick={(appt) => setSelectedAppointment(appt as unknown as Appointment)}
            />
          </div>
          {/* Desktop Grid View */}
          <div className="hidden md:block">
            {(view === "day" || view === "doctor") ? (
              <DayGrid
                data={calendarData[selectedDate]}
                date={selectedDate}
                showDoctors={true}
                showRooms={view === "day"}
                onSlotClick={(time, endTime, colId, colName, colType) => {
                  if (colType === "doctor") setBookingSlot({ time, endTime, doctorId: colId, doctorName: colName, date: selectedDate });
                }}
                onAppointmentClick={(appt) => setSelectedAppointment(appt as unknown as Appointment)}
                onUnblock={(id) => unblockSlot.mutate(id)}
              />
            ) : view === "room" ? (
              <DayGrid data={calendarData[selectedDate]} date={selectedDate} showDoctors={false} showRooms={true}
                onSlotClick={(time, endTime) => setBookingSlot({ time, endTime, doctorId: "", doctorName: "", date: selectedDate })}
                onAppointmentClick={(appt) => setSelectedAppointment(appt as unknown as Appointment)}
                onUnblock={(id) => unblockSlot.mutate(id)} />
            ) : (
              <WeekGrid data={calendarData} dates={weekDates} />
            )}
          </div>
        </>
      )}

      {/* Availability Finder */}
      {showAvailability && (
        <AvailabilityPanel
          onBook={(slot) => setBookingSlot({ time: slot.time, endTime: slot.endTime, doctorId: slot.doctorId, doctorName: slot.doctorName, date: slot.date })}
        />
      )}

      {/* Block Slot Form */}
      {showBlockForm && (
        <BlockSlotForm doctors={doctors} onClose={() => setShowBlockForm(false)} selectedDate={selectedDate} />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-500">
        {[
          { status: "available", label: "Available" },
          { status: "booked", label: "Booked" },
          { status: "checked_in", label: "Checked In" },
          { status: "in_progress", label: "In Progress" },
          { status: "completed", label: "Completed" },
          { status: "blocked", label: "Blocked" },
        ].map((s) => (
          <div key={s.status} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded", STATUS_COLORS[s.status]?.bg, "border", STATUS_COLORS[s.status]?.border)} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Book Panel */}
      <QuickBookPanel
        slot={bookingSlot}
        onClose={() => setBookingSlot(null)}
        doctors={doctors}
      />

      {/* Appointment Detail Slideover */}
      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}

// ---- Day Grid Component ----

function DayGrid({ data, date, showDoctors, showRooms, onSlotClick, onAppointmentClick, onUnblock }: {
  data?: { doctors: DoctorCalendar[]; rooms: RoomCalendar[] };
  date: string;
  showDoctors: boolean;
  showRooms: boolean;
  onSlotClick?: (time: string, endTime: string, colId: string, colName: string, colType: "doctor" | "room") => void;
  onAppointmentClick?: (appointment: Record<string, unknown>) => void;
  onUnblock?: (blockId: string) => void;
}) {
  if (!data) return <div className="text-center text-stone-400 py-8">No data for this date</div>;

  const columns = [
    ...(showDoctors ? data.doctors.map((d) => ({ id: d.doctor.id, label: d.doctor.name, sub: d.doctor.speciality || "", slots: d.slots, isOnLeave: d.isOnLeave, type: "doctor" as const })) : []),
    ...(showRooms ? data.rooms.map((r) => ({ id: r.room.id, label: r.room.name, sub: r.room.type, slots: r.slots, isOnLeave: false, type: "room" as const })) : []),
  ];

  if (columns.length === 0) return <div className="text-center text-stone-400 py-8">No doctors or rooms found</div>;

  // Time labels from the first column's slots
  const timeLabels = columns[0]?.slots.map((s) => s.time) || [];

  // Current time indicator
  const now = new Date();
  const currentDateStr = toClinicDay(now);
  const isToday = date === currentDateStr;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid border-b border-stone-100 sticky top-0 bg-white z-10"
            style={{ gridTemplateColumns: `80px repeat(${columns.length}, 1fr)` }}>
            <div className="px-3 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider border-r border-stone-100">
              Time
            </div>
            {columns.map((col) => (
              <div key={col.id} className="px-3 py-3 text-center border-r border-stone-50 last:border-r-0">
                <div className="flex items-center justify-center gap-1.5">
                  {col.type === "doctor" ? <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> : <DoorOpen className="w-3.5 h-3.5 text-violet-500" />}
                  <span className="text-sm font-semibold text-stone-900 truncate">{col.label}</span>
                </div>
                {col.sub && <p className="text-[10px] text-stone-400 mt-0.5">{col.sub}</p>}
                {col.isOnLeave && <Badge variant="danger" className="mt-1 text-[10px]">On Leave</Badge>}
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {/* Current time line */}
            {isToday && nowMinutes >= 480 && nowMinutes <= 1080 && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${((nowMinutes - 480) / 30) * 48}px` }}>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 border-t-2 border-red-400 border-dashed" />
                </div>
              </div>
            )}

            {timeLabels.map((time, ti) => (
              <div key={time} className="grid border-b border-stone-50"
                style={{ gridTemplateColumns: `80px repeat(${columns.length}, 1fr)` }}>
                {/* Time label */}
                <div className="px-3 py-2.5 text-xs font-medium text-stone-400 border-r border-stone-100 flex items-center h-12">
                  {time}
                </div>
                {/* Slots */}
                {columns.map((col) => {
                  const slot = col.slots[ti];
                  if (!slot) return <div key={col.id} className="h-12" />;
                  const colors = STATUS_COLORS[slot.status] || STATUS_COLORS.available;
                  const appt = slot.appointment;

                  return (
                    <div key={col.id} className={cn(
                      "border-r border-stone-50 last:border-r-0 h-12 px-1 py-0.5 transition-all",
                      colors.bg, "border-l-2", colors.border,
                      (slot.status === "available" || appt) && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (slot.status === "available" && onSlotClick) {
                        onSlotClick(slot.time, slot.endTime, col.id, col.label, col.type);
                      } else if (appt && onAppointmentClick) {
                        onAppointmentClick(appt);
                      }
                    }}>
                      {appt ? (
                        <div className="h-full flex flex-col justify-center px-2 min-w-0">
                          <p className={cn("text-xs font-medium truncate", colors.text)}>
                            {String(appt.patientName)}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">
                            {String(appt.type).replace("_", " ")} · {String(appt.status).replace("_", " ")}
                          </p>
                        </div>
                      ) : slot.status === "blocked" ? (
                        <div className="h-full flex items-center justify-between px-2 group/block">
                          <p className="text-[10px] text-stone-400 truncate">
                            {String(slot.blocked?.reason || slot.blocked?.type || "Blocked")}
                          </p>
                          {slot.blocked?.id != null && onUnblock && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm("Unblock this slot?")) onUnblock(String(slot.blocked?.id)); }}
                              className="opacity-0 group-hover/block:opacity-100 p-0.5 text-red-400 hover:text-red-600 cursor-pointer transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : slot.status === "available" ? (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Week Grid Component ----

function WeekGrid({ data, dates }: { data: Record<string, { doctors: DoctorCalendar[] }>; dates: string[] }) {
  // Show a simplified week view — one row per doctor, columns per day
  const allDoctors = data[dates[0]]?.doctors || [];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid border-b border-stone-100 sticky top-0 bg-white z-10"
            style={{ gridTemplateColumns: `140px repeat(${dates.length}, 1fr)` }}>
            <div className="px-3 py-3 text-xs font-semibold text-stone-400 uppercase border-r border-stone-100">Doctor</div>
            {dates.map((d) => {
              const isToday = d === getClinicToday();
              return (
                <div key={d} className={cn("px-2 py-3 text-center border-r border-stone-50 last:border-r-0", isToday && "bg-blue-50/30")}>
                  <p className={cn("text-xs font-semibold", isToday ? "text-blue-700" : "text-stone-700")}>{formatDateLabel(d)}</p>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {allDoctors.map((doc) => (
            <div key={doc.doctor.id} className="grid border-b border-stone-50"
              style={{ gridTemplateColumns: `140px repeat(${dates.length}, 1fr)` }}>
              <div className="px-3 py-3 border-r border-stone-100 flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{doc.doctor.name}</p>
                  <p className="text-[10px] text-stone-400">{doc.doctor.speciality || ""}</p>
                </div>
              </div>
              {dates.map((dateKey) => {
                const dayDoc = data[dateKey]?.doctors.find((dd) => dd.doctor.id === doc.doctor.id);
                if (!dayDoc) return <div key={dateKey} className="py-3 px-2 border-r border-stone-50" />;

                const available = dayDoc.slots.filter((s) => s.status === "available").length;
                const booked = dayDoc.slots.filter((s) => ["booked", "checked_in", "in_progress"].includes(s.status)).length;
                const total = dayDoc.slots.filter((s) => s.status !== "unavailable").length;
                const isToday = dateKey === getClinicToday();
                const load = total > 0 ? Math.round((booked / total) * 100) : 0;

                return (
                  <div key={dateKey} className={cn("py-2.5 px-2 border-r border-stone-50 last:border-r-0", isToday && "bg-blue-50/20")}>
                    {dayDoc.isOnLeave ? (
                      <div className="text-center">
                        <Badge variant="danger" className="text-[10px]">Leave</Badge>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-stone-900">{booked}</span>
                          <span className="text-[10px] text-stone-400">/ {total}</span>
                        </div>
                        {/* Load bar */}
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full rounded-full transition-all",
                            load > 80 ? "bg-red-400" : load > 50 ? "bg-amber-400" : "bg-blue-400"
                          )} style={{ width: `${load}%` }} />
                        </div>
                        <p className="text-[10px] text-stone-400">{available} free</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Quick Book Panel ----

function QuickBookPanel({ slot, onClose, doctors }: {
  slot: { time: string; endTime: string; doctorId: string; doctorName: string; date: string } | null;
  onClose: () => void;
  doctors: { id: string; name: string }[];
}) {
  const { user } = useAuth();
  const emit = useModuleEmit("MOD-APPOINTMENT");
  const createAppointment = useCreateAppointment();

  // Patient search via API
  const [patientSearch, setPatientSearch] = useState("");
  const pSearchParams = patientSearch.length >= 2 ? { search: patientSearch } : undefined;
  const { data: patientsRes } = usePatients(pSearchParams);
  const searchResults = ((patientsRes?.data || []) as Patient[]);
  const [patientId, setPatientId] = useState("");
  const { data: singlePatientRes } = usePatient(patientId);
  const singlePatient = (singlePatientRes?.data || null) as Patient | null;
  const selectedPatient = searchResults.find((p) => p.id === patientId) || singlePatient;

  // Selections
  const [doctorId, setDoctorId] = useState(slot?.doctorId || "");
  const [type, setType] = useState("CONSULTATION");
  const [duration, setDuration] = useState("30");
  const [selectedTime, setSelectedTime] = useState(slot?.time || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Treatments
  const { data: treatmentsRes } = useTreatments();
  const treatments = ((treatmentsRes?.data || []) as { id: string; name: string; category: string; duration: number }[]);

  // Patient history
  const { data: patientApptsRes } = usePatientAppointments(patientId);
  const patientAppts = ((patientApptsRes?.data || []) as { status: string }[]);
  const hasVisitHistory = patientAppts.some((a) => a.status === "COMPLETED" || a.status === "IN_PROGRESS");

  const appointmentTypes = [
    { v: "CONSULTATION", l: "Consultation", d: "30", always: true },
    { v: "PROCEDURE", l: "Procedure", d: "45", always: true },
    { v: "FOLLOW_UP", l: "Follow-Up", d: "20", always: false },
    { v: "REVIEW", l: "Review", d: "15", always: false },
    { v: "EMERGENCY", l: "Emergency", d: "30", always: true },
  ].filter((t) => t.always || hasVisitHistory);

  // Calendar data for the day — used to compute available time slots per doctor
  const calParams: Record<string, string> = { date: slot?.date || getClinicToday(), view: "day" };
  const { data: calRes } = useCalendar(calParams);
  const dayData = (calRes?.data || {})[slot?.date || ""] as { doctors: DoctorCalendar[] } | undefined;

  // Build set of busy times for selected doctor
  const busyTimes = new Set<string>();
  if (doctorId && dayData?.doctors) {
    const dc = dayData.doctors.find((d) => d.doctor.id === doctorId);
    dc?.slots.forEach((s) => {
      if (s.status === "booked" || s.status === "checked_in" || s.status === "in_progress" || s.status === "blocked") {
        busyTimes.add(s.time);
      }
    });
  }

  // Build set of busy doctors per time slot (for showing availability count)
  const busyDoctorsByTime: Record<string, Set<string>> = {};
  if (dayData?.doctors) {
    dayData.doctors.forEach((dc) => {
      dc.slots.forEach((s) => {
        if (s.status === "booked" || s.status === "checked_in" || s.status === "in_progress") {
          if (!busyDoctorsByTime[s.time]) busyDoctorsByTime[s.time] = new Set();
          busyDoctorsByTime[s.time].add(dc.doctor.id);
        }
      });
    });
  }

  // 30-min time slots 08:00–18:00
  const timeSlots: string[] = [];
  for (let h = 8; h < 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  // Available doctors at currently selected time
  const busyAtSelectedTime = busyDoctorsByTime[selectedTime] || new Set();
  const availableDoctorsAtTime = doctors.filter((d) => !busyAtSelectedTime.has(d.id));

  // Sync when slot changes
  const [prevSlot, setPrevSlot] = useState(slot);
  if (slot !== prevSlot) {
    setPrevSlot(slot);
    if (slot) {
      setDoctorId(slot.doctorId);
      setSelectedTime(slot.time || "");
      setPatientId(""); setPatientSearch("");
      setType("CONSULTATION"); setDuration("30");
      setNotes(""); setError(""); setSuccess(false);
    }
  }

  const fmtTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  const handleBook = async () => {
    if (!patientId) { setError("Select a patient"); return; }
    if (!doctorId) { setError("Select a doctor"); return; }
    if (!selectedTime) { setError("Select a time"); return; }
    setError("");

    const durMins = parseInt(duration) || 30;
    const [h, m] = selectedTime.split(":").map(Number);
    const endH = h + Math.floor((m + durMins) / 60);
    const endM = (m + durMins) % 60;
    const endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    try {
      await createAppointment.mutateAsync({
        patientId, doctorId,
        branchId: user?.branchId || undefined,
        date: slot?.date || getClinicToday(),
        startTime: selectedTime, endTime,
        durationMinutes: durMins,
        type, priority: "NORMAL",
        notes: notes.trim() || undefined,
        createdById: user?.id || undefined,
      });
      const doc = doctors.find((d) => d.id === doctorId);
      emit(SystemEvents.APPOINTMENT_BOOKED, {
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "",
        doctorName: doc?.name || "", date: slot?.date,
      }, { patientId });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to book");
    }
  };

  const dateLabel = slot ? new Date(slot.date + "T00:00:00").toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric", timeZone: CLINIC_TZ }) : "";
  const selectedDoc = doctors.find((d) => d.id === doctorId);

  return (
    <SlidePanel isOpen={!!slot} onClose={onClose} title="Book Appointment"
      subtitle={dateLabel} width="md"
      footer={success ? undefined : (
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBook} disabled={createAppointment.isPending || !patientId || !doctorId || !selectedTime}>
            {createAppointment.isPending ? "Booking..." : "Book Now"}
          </Button>
        </>
      )}>
      {success ? (
        <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">Booked!</h3>
          <p className="text-sm text-stone-500 mt-1">
            {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ""} — {selectedTime ? fmtTime(selectedTime) : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5 animate-fade-in">{error}</div>}

          {/* Step 1: Patient */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">1</div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Patient</span>
            </div>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3.5 py-3 bg-blue-50 rounded-xl border border-blue-200">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-xs text-stone-500">{selectedPatient.patientCode} · {selectedPatient.phone}</p>
                </div>
                <button onClick={() => { setPatientId(""); setPatientSearch(""); }} className="text-xs text-red-500 hover:underline cursor-pointer">Change</button>
              </div>
            ) : (
              <div className="relative">
                <SearchInput placeholder="Search name, phone, or ID..." value={patientSearch} onChange={setPatientSearch} debounceMs={300} />
                {searchResults.length > 0 && patientSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-stone-200 shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.slice(0, 8).map((p) => (
                      <button key={p.id} onClick={() => { setPatientId(p.id); setPatientSearch(""); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-stone-50 text-left cursor-pointer border-b border-stone-50 last:border-b-0">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">{p.firstName?.[0]}{p.lastName?.[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-stone-400">{p.patientCode} · {p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Doctor */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">2</div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Doctor</span>
            </div>
            {selectedDoc ? (
              <div className="flex items-center justify-between px-3.5 py-3 bg-violet-50 rounded-xl border border-violet-200">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-violet-500" />
                  <p className="text-sm font-semibold text-stone-900">{selectedDoc.name}</p>
                </div>
                <button onClick={() => { setDoctorId(""); setSelectedTime(""); }} className="text-xs text-red-500 hover:underline cursor-pointer">Change</button>
              </div>
            ) : (
              <Select placeholder="Select doctor" value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setSelectedTime(""); }}
                options={doctors.map((d) => ({ value: d.id, label: d.name }))} />
            )}
          </div>

          {/* Step 3: Type & Treatment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600">3</div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Type</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {appointmentTypes.map((t) => (
                <button key={t.v} onClick={() => { setType(t.v); setDuration(t.d); }}
                  className={cn(
                    "py-2 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer",
                    type === t.v ? "border-amber-300 bg-amber-50 text-amber-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                  )}>{t.l}</button>
              ))}
            </div>
            {type === "PROCEDURE" && treatments.length > 0 && (
              <Select placeholder="Select treatment (optional)" value="" onChange={(e) => {
                const t = treatments.find((tr) => tr.id === e.target.value);
                if (t) { setDuration(String(t.duration || 30)); setNotes(t.name); }
              }} options={treatments.map((t) => ({ value: t.id, label: `${t.name} (${t.duration || 30}min)` }))} />
            )}
            <div className="flex gap-1.5 mt-2">
              {["15", "20", "30", "45", "60"].map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer",
                    duration === d ? "border-amber-300 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-400"
                  )}>{d}m</button>
              ))}
            </div>
          </div>

          {/* Step 4: Time — dynamic based on doctor availability */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">4</div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Time {doctorId && busyTimes.size > 0 && <span className="text-stone-300 normal-case font-normal">({busyTimes.size} slots busy)</span>}
              </span>
            </div>
            {!doctorId ? (
              <p className="text-xs text-stone-400 text-center py-3 bg-stone-50 rounded-xl">Select a doctor first to see available times</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {timeSlots.map((t) => {
                  const isBusy = busyTimes.has(t);
                  return (
                    <button key={t} onClick={() => !isBusy && setSelectedTime(t)} disabled={isBusy}
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium transition-all",
                        isBusy ? "bg-red-50 text-red-300 line-through cursor-not-allowed" :
                        selectedTime === t ? "bg-blue-600 text-white shadow-sm cursor-pointer" :
                        "bg-stone-50 text-stone-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                      )}>{fmtTime(t)}</button>
                  );
                })}
              </div>
            )}
          </div>

          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}
    </SlidePanel>
  );
}

// ---- Availability Panel ----

function AvailabilityPanel({ onBook }: {
  onBook: (slot: { date: string; time: string; endTime: string; doctorId: string; doctorName: string }) => void;
}) {
  const [searchType, setSearchType] = useState("CONSULTATION");
  const { data: res, isLoading } = useAvailableSlots({ type: searchType, limit: "6" });
  const slots = ((res?.data || []) as { date: string; time: string; endTime: string; doctorId: string; doctorName: string; speciality: string }[]);

  const fmtTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-stone-900">Next Available Slots</span>
          </div>
          <div className="flex gap-1">
            {["CONSULTATION", "PROCEDURE", "FOLLOW_UP"].map((t) => (
              <button key={t} onClick={() => setSearchType(t)}
                className={cn("px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all",
                  searchType === t ? "bg-blue-500 text-white" : "bg-white text-stone-500 border border-stone-200"
                )}>{t.replace("_", " ")}</button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <p className="text-xs text-stone-400 py-4 text-center">Searching...</p>
        ) : slots.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">No available slots found in the next 14 days</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((s, i) => (
              <button key={i} onClick={() => onBook(s)}
                className="bg-white rounded-xl border border-stone-200 p-3 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                <p className="text-sm font-bold text-stone-900 group-hover:text-blue-700">{fmtTime(s.time)}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {new Date(s.date + "T00:00:00").toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric", timeZone: CLINIC_TZ })}
                </p>
                <p className="text-[11px] text-blue-600 font-medium mt-1 truncate">{s.doctorName}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ---- Mobile Agenda View ----

function AgendaView({ data, date, onAppointmentClick }: {
  data?: { doctors: DoctorCalendar[]; rooms: RoomCalendar[] };
  date: string;
  onAppointmentClick?: (appointment: Record<string, unknown>) => void;
}) {
  if (!data) return <div className="text-center text-stone-400 py-8">No appointments for this date</div>;

  // Collect all appointments across doctors, grouped by hour
  const appointmentsByHour: Record<string, { time: string; endTime: string; patientName: string; doctorName: string; type: string; status: string; room?: string; raw: Record<string, unknown> }[]> = {};

  for (const doc of data.doctors) {
    for (const slot of doc.slots) {
      if (!slot.appointment) continue;
      const appt = slot.appointment;
      const hour = slot.time.split(":")[0];
      const hourKey = `${hour}:00`;
      if (!appointmentsByHour[hourKey]) appointmentsByHour[hourKey] = [];
      appointmentsByHour[hourKey].push({
        time: slot.time,
        endTime: slot.endTime,
        patientName: String(appt.patientName || "Unknown"),
        doctorName: doc.doctor.name,
        type: String(appt.type || ""),
        status: String(appt.status || ""),
        room: appt.roomName ? String(appt.roomName) : undefined,
        raw: appt,
      });
    }
  }

  const sortedHours = Object.keys(appointmentsByHour).sort();

  const fmtTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  const fmtHour = (t: string) => {
    const h = parseInt(t.split(":")[0], 10);
    return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
  };

  const statusBadgeVariant = (status: string): "default" | "info" | "warning" | "success" | "danger" => {
    switch (status) {
      case "booked": return "info";
      case "checked_in": return "warning";
      case "in_progress": return "success";
      case "completed": return "default";
      case "no_show": case "cancelled": return "danger";
      default: return "default";
    }
  };

  if (sortedHours.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 text-center">
        <CalendarIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-400">No appointments for {formatDateLabel(date)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedHours.map((hour) => (
        <div key={hour}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{fmtHour(hour)}</span>
            <div className="flex-1 border-t border-stone-100" />
          </div>
          <div className="space-y-2">
            {appointmentsByHour[hour].map((appt, i) => {
              const colors = STATUS_COLORS[appt.status] || STATUS_COLORS.booked;
              return (
                <button
                  key={`${hour}-${i}`}
                  onClick={() => onAppointmentClick?.(appt.raw)}
                  className={cn(
                    "w-full text-left bg-white rounded-xl border p-3 transition-all active:scale-[0.98] cursor-pointer",
                    colors.border
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900 truncate">{appt.patientName}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{fmtTime(appt.time)} – {fmtTime(appt.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-stone-500">
                        <Stethoscope className="w-3 h-3 shrink-0" />
                        <span className="truncate">{appt.doctorName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-stone-400 font-medium">{appt.type.replace("_", " ")}</span>
                        {appt.room && (
                          <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
                            <DoorOpen className="w-2.5 h-2.5" /> {appt.room}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(appt.status)} className="text-[10px] shrink-0">
                      {appt.status.replace("_", " ")}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Block Slot Form ----

function BlockSlotForm({ doctors, onClose, selectedDate }: {
  doctors: { id: string; name: string }[];
  onClose: () => void;
  selectedDate: string;
}) {
  const blockSlot = useBlockSlot();
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("14:00");
  const [blockType, setBlockType] = useState("BREAK");
  const [reason, setReason] = useState("");

  const handleBlock = async () => {
    await blockSlot.mutateAsync({
      doctorId: doctorId || undefined,
      date, startTime, endTime,
      type: blockType,
      reason: reason.trim() || undefined,
    });
    onClose();
  };

  return (
    <Card className="border-stone-300 bg-stone-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-900">Block Time Slot</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-lg cursor-pointer"><X className="w-4 h-4 text-stone-400" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Select placeholder="Doctor (optional)" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
            options={[{ value: "", label: "All / Clinic-wide" }, ...doctors.map((d) => ({ value: d.id, label: d.name }))]} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex gap-1.5">
            <Input placeholder="Start" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input placeholder="End" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <Select value={blockType} onChange={(e) => setBlockType(e.target.value)}
            options={[
              { value: "BREAK", label: "Break" }, { value: "LUNCH", label: "Lunch" },
              { value: "PRAYER", label: "Prayer" }, { value: "MEETING", label: "Meeting" },
              { value: "MAINTENANCE", label: "Maintenance" }, { value: "LEAVE", label: "Leave" },
              { value: "EMERGENCY_HOLD", label: "Emergency Hold" }, { value: "MANUAL", label: "Manual Block" },
            ]} />
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="flex-1" />
          <Button size="sm" onClick={handleBlock} disabled={blockSlot.isPending}>
            {blockSlot.isPending ? "Blocking..." : "Block"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
