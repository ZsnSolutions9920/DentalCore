"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  FileText,
  Search,
  AudioLines,
  Sparkles,
  Square,
  Brain,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Select,
  Badge,
  Input,
} from "@/components/ui";
import { usePatients } from "@/hooks/use-queries";
import type { Patient, ConsultationNote } from "@/types";
import { formatDate } from "@/lib/utils";
import { useModuleAccess } from "@/modules/core/hooks";

export default function AIToolsPage() {
  const access = useModuleAccess("MOD-AI-TRANSCRIPTION");
  const [activeTab, setActiveTab] = useState("transcribe");

  const tabs = [
    { id: "transcribe", label: "Transcribe", icon: Mic },
    { id: "summarize", label: "Summarize", icon: Sparkles },
    { id: "search", label: "Smart Search", icon: Search },
  ];

  if (!access.canView) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        You don&apos;t have access to this module.
      </div>
    );
  }

  return (
    <div data-id="AI-TRANSCRIBE" className="animate-fade-in space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">AI Assistant</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          AI-powered transcription, summarization, and clinical insights
        </p>
      </div>

      {/* Pill-style tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 rounded-2xl w-fit overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "transcribe" && <TranscribeTab />}
        {activeTab === "summarize" && <SummarizeTab />}
        {activeTab === "search" && <SmartSearchTab />}
      </div>
    </div>
  );
}

function TranscribeTab() {
  const { data: patientsResponse, isLoading: patientsLoading } = usePatients();
  const patients = (patientsResponse?.data || []) as Patient[];
  const [patientId, setPatientId] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setSeconds(0);
    setTranscript("");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setTranscript(
      "Doctor: How has your skin been?\nPatient: Much better since starting the treatment..."
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left: Controls */}
      <Card padding="md" className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <CardContent className="p-6">
          <Select
            label="Patient"
            options={patients.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName} (${p.patientCode})`,
            }))}
            placeholder={patientsLoading ? "Loading patients..." : "Select patient for this session..."}
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />

          <div className="flex flex-col items-center gap-5 py-12">
            {/* Pulsing mic button */}
            <div className="relative">
              {isRecording && (
                <>
                  <div className="absolute inset-0 w-28 h-28 -m-2 rounded-full bg-red-400/20 animate-ping" />
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-400/10 animate-pulse" />
                </>
              )}
              <button
                onClick={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                disabled={!patientId}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "bg-red-500 text-white shadow-xl shadow-red-500/30"
                    : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-xl shadow-indigo-500/30"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-3xl font-mono font-bold text-stone-900 tracking-wider">
                {formatTimer(seconds)}
              </p>
              <p className="text-sm text-stone-400 mt-1">
                {isRecording
                  ? "Recording in progress..."
                  : "Tap to start recording"}
              </p>
            </div>

            {isRecording && (
              <Button
                variant="danger"
                iconLeft={<Square className="w-4 h-4" />}
                onClick={handleStopRecording}
              >
                Stop & Process
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right: Transcript */}
      <Card padding="md" className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-stone-900">Transcript</h2>
          </div>
        </CardHeader>
        <CardContent>
          {transcript ? (
            <div className="bg-stone-50 rounded-2xl p-5 max-h-[400px] overflow-y-auto">
              <pre className="text-sm text-stone-800 whitespace-pre-wrap font-sans leading-relaxed">
                {transcript}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <AudioLines className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="text-sm text-stone-400 max-w-[240px]">
                {isRecording
                  ? "Listening... Transcript will appear when recording stops."
                  : "Start a recording to see the live transcript here."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummarizeTab() {
  // TODO: Replace with API hook when consultation notes endpoint is available
  const consultationNotes: ConsultationNote[] = [];
  const [selectedNote, setSelectedNote] = useState("");
  const note = consultationNotes.find((n) => n.id === selectedNote);

  return (
    <div className="space-y-6 max-w-3xl">
      <Card padding="md" className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <CardContent className="p-6">
          <Select
            label="Select Consultation"
            options={consultationNotes.map((n) => ({
              value: n.id,
              label: `${n.doctorName} - ${n.chiefComplaint} (${formatDate(
                n.createdAt
              )})`,
            }))}
            placeholder="Choose a consultation to summarize..."
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
          />
        </CardContent>
      </Card>

      {note && (
        <Card className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-fade-in">
          {/* Gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-teal-400 via-indigo-400 to-indigo-500" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-semibold text-stone-900">
                AI-Generated Summary
              </h2>
              <Badge variant="purple">AI</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="bg-stone-50 rounded-2xl p-6 space-y-4">
              {[
                { label: "Chief Complaint", value: note.chiefComplaint },
                { label: "Symptoms", value: note.symptoms },
                { label: "Examination", value: note.examination },
                { label: "Diagnosis", value: note.diagnosis },
                { label: "Treatment Plan", value: note.treatmentPlan },
                { label: "Advice", value: note.advice },
                ...(note.followUpDate
                  ? [
                      {
                        label: "Follow-Up",
                        value: `${formatDate(note.followUpDate)}${
                          note.followUpNotes
                            ? ` - ${note.followUpNotes}`
                            : ""
                        }`,
                      },
                    ]
                  : []),
              ].map((section) => (
                <div key={section.label}>
                  <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                    {section.label}
                  </h3>
                  <p className="text-sm text-stone-800 leading-relaxed">
                    {section.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!note && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="text-sm text-stone-400">
            Select a consultation to generate an AI summary
          </p>
        </div>
      )}
    </div>
  );
}

function SmartSearchTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { title: string; description: string; type: string }[]
  >([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setResults([
      {
        title: "Olivia Harper - RCT & Crown History",
        description:
          "Patient had RCT on #36 (2026-03-28) for irreversible pulpitis. Temporary filling in place. Scheduled for crown prep in 2 weeks.",
        type: "Patient",
      },
      {
        title: "RCT + Crown Protocol - Endodontic Guidelines",
        description:
          "Post-RCT crown placement within 4 weeks reduces fracture risk by 70%. Zirconia preferred for molars; PFM for bridges; document isolation.",
        type: "Protocol",
      },
      {
        title: "Dental Treatment Outcomes - Q1 2026",
        description:
          "92% RCT success rate at 6 months. Most common follow-ups: crown fracture (5%), periapical persistence (3%). Zirconia crown retention > 98%.",
        type: "Report",
      },
    ]);
  };

  const typeColors: Record<string, "info" | "success" | "warning"> = {
    Patient: "info",
    Protocol: "success",
    Report: "warning",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Large search input */}
      <Card className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-400 to-teal-400" />
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Ask anything... e.g. 'patients due for RCT follow-up'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                iconLeft={<Search className="w-4 h-4" />}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="!py-3 !text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              iconLeft={<Sparkles className="w-4 h-4" />}
              className="!rounded-xl"
            >
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <Card
              key={index}
              hover
              padding="lg"
              className="bg-white rounded-2xl border border-stone-100 shadow-sm animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm text-stone-900">
                      {result.title}
                    </h3>
                    <Badge variant={typeColors[result.type] || "default"}>
                      {result.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {result.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !query && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="text-sm text-stone-400">
            Search across patients, protocols, and clinical records
          </p>
        </div>
      )}
    </div>
  );
}
