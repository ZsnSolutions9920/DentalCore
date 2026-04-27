"use client";

import { useState } from "react";
import {
  Phone,
  Search,
  CalendarPlus,
  PhoneCall,
  UserPlus,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  StatCard,
  Avatar,
} from "@/components/ui";
import { LeadStatus } from "@/types";
import { timeAgo } from "@/lib/utils";
import { useModuleAccess, useModuleEmit } from "@/modules/core/hooks";
import { SystemEvents } from "@/modules/core/events";
import { useLeads, useCallLogs, usePatients, useUpdateLead } from "@/hooks/use-queries";
import { LoadingSpinner } from "@/components/ui/loading";
import { NewLeadModal } from "@/components/call-center/new-lead-modal";

const statusConfig: Record<string, { label: string; variant: "primary" | "info" | "success" | "warning" | "danger" | "default" | "purple"; color: string }> = {
  [LeadStatus.NEW]: { label: "New", variant: "primary", color: "border-l-blue-500" },
  [LeadStatus.CONTACTED]: { label: "Contacted", variant: "info", color: "border-l-sky-500" },
  [LeadStatus.INTERESTED]: { label: "Interested", variant: "warning", color: "border-l-amber-500" },
  [LeadStatus.BOOKED]: { label: "Booked", variant: "success", color: "border-l-emerald-500" },
  [LeadStatus.FOLLOW_UP]: { label: "Follow Up", variant: "purple", color: "border-l-indigo-500" },
  [LeadStatus.NOT_INTERESTED]: { label: "Not Interested", variant: "danger", color: "border-l-red-400" },
};

const pipelineStages = [
  { status: LeadStatus.NEW, label: "New Leads" },
  { status: LeadStatus.CONTACTED, label: "Contacted" },
  { status: LeadStatus.INTERESTED, label: "Interested" },
  { status: LeadStatus.FOLLOW_UP, label: "Follow Up" },
  { status: LeadStatus.BOOKED, label: "Booked" },
];

export default function CallCenterPage() {
  const access = useModuleAccess("MOD-COMMUNICATION");
  const emit = useModuleEmit("MOD-COMMUNICATION");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const updateLead = useUpdateLead();

  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeads();
  const leads = (leadsResponse?.data || []) as Array<{ id: string; name: string; phone: string; email?: string; status: string; interest: string; source: string; notes?: string; callbackDate?: string; createdAt: string }>;

  const { data: callLogsResponse, isLoading: isLoadingCallLogs } = useCallLogs();
  const callLogs = (callLogsResponse?.data || []) as Array<{ id: string }>;

  const { data: patientsResponse, isLoading: isLoadingPatients } = usePatients();
  const allPatients = (patientsResponse?.data || []) as Array<{ id: string; firstName: string; lastName: string; phone: string }>;

  const newLeads = leads.filter((l) => l.status === LeadStatus.NEW).length;
  const todayCalls = callLogs.length;

  function handlePhoneSearch() {
    if (!phoneSearch.trim()) return;
    setHasSearched(true);
    const results = allPatients.filter(
      (p) =>
        p.phone.includes(phoneSearch) ||
        p.firstName.toLowerCase().includes(phoneSearch.toLowerCase()) ||
        p.lastName.toLowerCase().includes(phoneSearch.toLowerCase())
    );
    setSearchResults(results);
  }

  if (isLoadingLeads || isLoadingCallLogs || isLoadingPatients) {
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="CALL-LOOKUP">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Call Center</h1>
          <p className="text-sm text-stone-500 mt-1">Look up patients, manage leads, and track calls</p>
        </div>
        <Button iconLeft={<UserPlus className="w-4 h-4" />} onClick={() => setShowNewLeadModal(true)}>New Lead</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="New Leads" value={newLeads} icon={<UserPlus className="w-6 h-6" />} color="primary" />
        <StatCard label="Calls Today" value={todayCalls} icon={<PhoneCall className="w-6 h-6" />} color="info" />
        <StatCard label="Total Leads" value={leads.length} icon={<Phone className="w-6 h-6" />} color="success" />
      </div>

      {/* Large Phone Search */}
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Phone className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-stone-700">Quick Patient Lookup</p>
          <div className="flex w-full max-w-lg mx-auto gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                placeholder="Search by phone number or name..."
                className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <Button size="lg" onClick={handlePhoneSearch}>Search</Button>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="w-full max-w-lg animate-fade-in">
              {searchResults.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={`${patient.firstName} ${patient.lastName}`} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-stone-800">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-stone-400">{patient.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="soft" iconLeft={<PhoneCall className="w-3.5 h-3.5" />}>
                          Call
                        </Button>
                        <Button size="sm" variant="outline" iconLeft={<CalendarPlus className="w-3.5 h-3.5" />}>
                          Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-stone-400 text-sm mt-2">
                  No patients found. Would you like to create a new lead?
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Lead Pipeline */}
      <div>
        <p className="text-lg font-semibold text-stone-700 mb-3">Lead Pipeline</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {pipelineStages.map((stage) => {
            const count = leads.filter((l) => l.status === stage.status).length;
            const config = statusConfig[stage.status];
            return (
              <Card key={stage.status} padding="md" className={`border-l-4 ${config.color}`}>
                <p className="text-xs text-stone-500">{stage.label}</p>
                <p className="text-2xl font-bold text-stone-800 mt-1">{count}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lead Cards */}
      <div>
        <p className="text-lg font-semibold text-stone-700 mb-3">All Leads</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {leads.map((lead) => {
            const config = statusConfig[lead.status] || { label: lead.status, variant: "default" as const, color: "" };
            return (
              <Card key={lead.id} hover padding="lg" className={`border-l-4 animate-fade-in ${config.color}`}>
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} size="md" />
                      <div>
                        <p className="font-semibold text-stone-800 truncate min-w-0">{lead.name}</p>
                        <p className="text-xs text-stone-400 truncate">{lead.phone}</p>
                      </div>
                    </div>
                    <Badge variant={config.variant} dot>{config.label}</Badge>
                  </div>

                  {/* Interest + Source */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">{lead.interest}</Badge>
                    <Badge variant="default">{lead.source}</Badge>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <p className="text-sm text-stone-500 line-clamp-2">{lead.notes}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <span className="text-xs text-stone-400">{timeAgo(lead.createdAt)}</span>
                    <div className="flex gap-2">
                      {lead.status === LeadStatus.NEW && (
                        <Button
                          size="sm"
                          variant="soft"
                          iconLeft={<PhoneCall className="w-3.5 h-3.5" />}
                          onClick={() => {
                            updateLead.mutate({ id: lead.id, data: { status: LeadStatus.CONTACTED } });
                            emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.CONTACTED });
                          }}
                        >
                          Contacted
                        </Button>
                      )}
                      {lead.status === LeadStatus.CONTACTED && (
                        <>
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() => {
                              updateLead.mutate({ id: lead.id, data: { status: LeadStatus.INTERESTED } });
                              emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.INTERESTED });
                            }}
                          >
                            Interested
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateLead.mutate({ id: lead.id, data: { status: LeadStatus.NOT_INTERESTED } });
                              emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.NOT_INTERESTED });
                            }}
                          >
                            Not Interested
                          </Button>
                        </>
                      )}
                      {(lead.status === LeadStatus.INTERESTED || lead.status === LeadStatus.FOLLOW_UP) && (
                        <Button
                          size="sm"
                          variant="outline"
                          iconLeft={<CalendarPlus className="w-3.5 h-3.5" />}
                          onClick={() => {
                            updateLead.mutate({ id: lead.id, data: { status: LeadStatus.BOOKED } });
                            emit(SystemEvents.LEAD_UPDATED, { id: lead.id, status: LeadStatus.BOOKED });
                          }}
                        >
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* New Lead Modal */}
      <NewLeadModal isOpen={showNewLeadModal} onClose={() => setShowNewLeadModal(false)} />
    </div>
  );
}
