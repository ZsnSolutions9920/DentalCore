"use client";

import { useState } from "react";
import {
  FlaskConical,
  Plus,
  Eye,
  Download,
  Calendar,
  User,
  Stethoscope,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  SearchInput,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useModuleAccess } from "@/modules/core/hooks";
import { useLabTests } from "@/hooks/use-queries";
import { LoadingSpinner } from "@/components/ui/loading";

const labStatusColors: Record<
  string,
  "default" | "warning" | "info" | "success" | "danger"
> = {
  REQUESTED: "warning",
  SAMPLE_COLLECTED: "info",
  PROCESSING: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const labStatusLabels: Record<string, string> = {
  REQUESTED: "Requested",
  SAMPLE_COLLECTED: "Sample Collected",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function LabResultsPage() {
  const access = useModuleAccess("MOD-CONSULTATION");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const { data: labTestsResponse, isLoading } = useLabTests();
  const labTests = (labTestsResponse?.data || []) as Array<{ id: string; testName: string; patientName?: string; doctorName: string; status: string; createdAt: string }>;

  const filters = [
    "ALL",
    "REQUESTED",
    "SAMPLE_COLLECTED",
    "PROCESSING",
    "COMPLETED",
  ];

  const filtered = labTests.filter((test) => {
    const matchesSearch =
      test.testName.toLowerCase().includes(search.toLowerCase()) ||
      (test.patientName || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      activeFilter === "ALL" || test.status === activeFilter;
    return matchesSearch && matchesStatus;
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
    <div data-id="PATIENT-TAB-LABS" className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Dental Imaging & Lab
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            X-rays, OPG, CBCT scans, and dental lab work (crowns, aligners, dentures)
          </p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />}>Order Imaging / Lab Work</Button>
      </div>

      {/* Search + Filter Chips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <SearchInput
          placeholder="Search tests or patients..."
          value={search}
          onChange={setSearch}
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeFilter === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {f === "ALL"
                ? "All"
                : labStatusLabels[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Test Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((test) => (
          <Card
            key={test.id}
            padding="lg"
            hover
            className="bg-white rounded-2xl border border-stone-100 shadow-sm animate-fade-in"
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {test.testName}
                  </p>
                  <p className="text-xs text-stone-400">
                    {test.id.toUpperCase()}
                  </p>
                </div>
              </div>
              <Badge variant={labStatusColors[test.status]} dot>
                {labStatusLabels[test.status] || test.status}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-700">{test.patientName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-500">{test.doctorName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-500">
                  {formatDate(test.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
              <Button
                variant="soft"
                size="sm"
                iconLeft={<Eye className="w-3.5 h-3.5" />}
              >
                View
              </Button>
              {test.status === "COMPLETED" && (
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={<Download className="w-3.5 h-3.5" />}
                >
                  Download
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FlaskConical className="w-12 h-12 text-stone-200 mx-auto mb-3" />
          <p className="text-sm text-stone-400">No lab tests found</p>
        </div>
      )}
    </div>
  );
}
