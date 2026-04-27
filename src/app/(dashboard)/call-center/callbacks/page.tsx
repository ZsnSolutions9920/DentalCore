"use client";

import {
  PhoneForwarded,
  Phone,
  Clock,
  CalendarDays,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  Avatar,
  StatCard,
} from "@/components/ui";
import { LeadStatus } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { useModuleAccess, useModuleEmit } from "@/modules/core/hooks";
import { SystemEvents } from "@/modules/core/events";
import { useLeads, useUpdateLead } from "@/hooks/use-queries";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CallbacksPage() {
  const access = useModuleAccess("MOD-COMMUNICATION");

  const emit = useModuleEmit("MOD-COMMUNICATION");
  const updateLead = useUpdateLead();
  const { data: leadsResponse, isLoading } = useLeads();
  const allLeads = (leadsResponse?.data || []) as Array<{ id: string; name: string; phone: string; email?: string; status: string; interest: string; source: string; notes?: string; callbackDate?: string; createdAt: string }>;

  // Leads with callback dates
  const callbackLeads = allLeads.filter((l) => l.callbackDate);
  const todayCallbacks = callbackLeads.filter((l) => {
    const cbDate = new Date(l.callbackDate!).toDateString();
    const today = new Date().toDateString();
    return cbDate === today;
  });
  const upcomingCallbacks = callbackLeads.filter((l) => {
    const cbDate = new Date(l.callbackDate!);
    return cbDate > new Date();
  });

  if (isLoading) {
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="CALL-CALLBACK">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
          <PhoneForwarded className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Callbacks</h1>
          <p className="text-sm text-stone-500 mt-0.5">Scheduled calls that need your attention</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Callbacks" value={callbackLeads.length} icon={<PhoneForwarded className="w-6 h-6" />} color="primary" />
        <StatCard label="Due Today" value={todayCallbacks.length} icon={<Clock className="w-6 h-6" />} color="warning" />
        <StatCard label="Upcoming" value={upcomingCallbacks.length} icon={<CalendarDays className="w-6 h-6" />} color="info" />
      </div>

      {/* Callback Cards */}
      <div className="space-y-3">
        {callbackLeads.map((lead) => {
          const cbDate = new Date(lead.callbackDate!);
          const isToday = cbDate.toDateString() === new Date().toDateString();
          const isPast = cbDate < new Date();

          return (
            <Card
              key={lead.id}
              hover
              padding="lg"
              className={`animate-fade-in border-l-4 ${
                isPast && !isToday
                  ? "border-l-red-400"
                  : isToday
                  ? "border-l-amber-400"
                  : "border-l-blue-400"
              }`}
            >
              <div className="flex flex-col gap-4">
                {/* Person */}
                <div className="flex items-center gap-3">
                  <Avatar name={lead.name} size="lg" />
                  <div>
                    <p className="font-semibold text-stone-800 truncate min-w-0">{lead.name}</p>
                    <p className="text-sm text-stone-500 truncate">{lead.phone}</p>
                    {lead.email && (
                      <p className="text-xs text-stone-400">{lead.email}</p>
                    )}
                  </div>
                </div>

                {/* Interest + Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">{lead.interest}</Badge>
                    {isPast && !isToday && <Badge variant="danger">Overdue</Badge>}
                    {isToday && <Badge variant="warning">Today</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-stone-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(lead.callbackDate!)} at {formatTime(lead.callbackDate!)}</span>
                  </div>
                  {lead.notes && (
                    <p className="text-sm text-stone-500 line-clamp-2">{lead.notes}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1"
                    iconLeft={<Phone className="w-5 h-5" />}
                    onClick={() => {
                      updateLead.mutate({ id: lead.id, data: { status: LeadStatus.CONTACTED } });
                      emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.CONTACTED });
                    }}
                  >
                    Call Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      updateLead.mutate({ id: lead.id, data: { status: LeadStatus.INTERESTED } });
                      emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.INTERESTED });
                    }}
                  >
                    Interested
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      updateLead.mutate({ id: lead.id, data: { status: LeadStatus.NOT_INTERESTED } });
                      emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.NOT_INTERESTED });
                    }}
                  >
                    Not Interested
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {callbackLeads.length === 0 && (
        <Card padding="lg">
          <p className="text-center text-stone-400 py-8">No callbacks scheduled. Nice work!</p>
        </Card>
      )}
    </div>
  );
}
