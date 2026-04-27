"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Smile, Filter, Trash2, X as XIcon, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

type ToothStatus = "PROBLEM" | "UNDER_TREATMENT" | "TREATED" | "MISSING";

interface ToothRecord {
  id: string;
  patientId: string;
  fdi: number;
  status: ToothStatus;
  conditions: string | null;
  treatment: string | null;
  notes: string | null;
  updatedAt: string;
}

const CONDITIONS = [
  "Cavity",
  "Fracture",
  "Infection",
  "Discoloration",
  "Sensitivity",
  "Plaque/Tartar",
  "Gum Disease",
  "Wear",
  "Chipped",
  "Impacted",
];

const TREATMENTS = [
  "",
  "Filling",
  "Root Canal",
  "Crown",
  "Extraction",
  "Bridge",
  "Implant",
  "Cleaning",
  "Whitening",
  "Veneer",
  "Sealant",
  "Bonding",
];

const STATUS_LABEL: Record<ToothStatus, string> = {
  PROBLEM: "Problem",
  UNDER_TREATMENT: "Under treatment",
  TREATED: "Treated",
  MISSING: "Missing",
};

const STATUS_STYLES: Record<ToothStatus, string> = {
  PROBLEM: "bg-red-100 border-red-400 text-red-700 hover:bg-red-200",
  UNDER_TREATMENT:
    "bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200",
  TREATED:
    "bg-emerald-100 border-emerald-500 text-emerald-700 hover:bg-emerald-200",
  MISSING:
    "bg-stone-200 border-stone-400 text-stone-400 hover:bg-stone-300 line-through",
};

const STATUS_DOT: Record<ToothStatus, string> = {
  PROBLEM: "bg-red-500",
  UNDER_TREATMENT: "bg-amber-500",
  TREATED: "bg-emerald-500",
  MISSING: "bg-stone-500",
};

function parseConditions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String);
  } catch {
    /* fall through */
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

// ---------- SVG Arch Chart ----------

const UPPER_FDIS = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_FDIS = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const ARCH_W = 760;
const ARCH_H = 480;
const ARCH_CX = 380;
const ARCH_RX = 320;
const ARCH_RY = 170;
const UPPER_CY = 60; // ellipse center for upper arch (above the teeth)
const LOWER_CY = 420; // ellipse center for lower arch (below the teeth)

function toothType(fdi: number): "incisor" | "canine" | "premolar" | "molar" {
  const d = fdi % 10;
  if (d === 1 || d === 2) return "incisor";
  if (d === 3) return "canine";
  if (d === 4 || d === 5) return "premolar";
  return "molar";
}

function toothSize(type: ReturnType<typeof toothType>) {
  switch (type) {
    case "incisor":
      return { w: 30, h: 56 };
    case "canine":
      return { w: 28, h: 60 };
    case "premolar":
      return { w: 34, h: 54 };
    case "molar":
      return { w: 40, h: 56 };
  }
}

// Tooth path drawn with crown at TOP (y=0..h*0.4) and root at BOTTOM (y=h*0.4..h)
// Origin at top-left of bounding box. Width w, height h.
function toothPath(
  type: ReturnType<typeof toothType>,
  w: number,
  h: number
): string {
  const crownY = h * 0.42;
  const rootInset = w * 0.18;
  // Body: rounded crown corners, narrow at root
  const body =
    `M ${w * 0.12} 2 ` +
    `Q 0 4 0 ${w * 0.3} ` +
    `L 0 ${crownY} ` +
    `L ${rootInset} ${h - 4} ` +
    `Q ${rootInset} ${h} ${w / 2} ${h} ` +
    `Q ${w - rootInset} ${h} ${w - rootInset} ${h - 4} ` +
    `L ${w} ${crownY} ` +
    `L ${w} ${w * 0.3} ` +
    `Q ${w} 4 ${w - w * 0.12} 2 ` +
    `Z`;
  // Crown surface details (added as separate path returned in second value via array)
  return body + " " + crownDetailPath(type, w, h);
}

function crownDetailPath(
  type: ReturnType<typeof toothType>,
  w: number,
  h: number
): string {
  // Subtle indentations on the crown to suggest tooth anatomy
  const top = 6;
  switch (type) {
    case "incisor":
      // single horizontal incisal edge hint
      return `M ${w * 0.2} ${top + 1} L ${w * 0.8} ${top + 1}`;
    case "canine":
      // a small downward tip (cusp) at the top
      return `M ${w * 0.5} ${top - 1} L ${w * 0.35} ${top + 4} L ${w * 0.5} ${top + 8} L ${w * 0.65} ${top + 4} Z`;
    case "premolar":
      // two cusp circles near the top
      return (
        `M ${w * 0.3} ${top + 2} a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0 ` +
        `M ${w * 0.7 - 6} ${top + 2} a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`
      );
    case "molar":
      // four cusps
      return (
        `M ${w * 0.22} ${top + 2} a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0 ` +
        `M ${w * 0.5 - 2.5} ${top + 2} a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0 ` +
        `M ${w * 0.78 - 5} ${top + 2} a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0 ` +
        `M ${w * 0.5 - 2.5} ${top + 9} a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0`
      );
  }
}

function archPosition(index: number, upper: boolean) {
  const t = index / 15;
  const theta = Math.PI * (1 - t);
  const x = ARCH_CX + ARCH_RX * Math.cos(theta);
  const y = upper
    ? UPPER_CY + ARCH_RY * Math.sin(theta)
    : LOWER_CY - ARCH_RY * Math.sin(theta);
  return { x, y };
}

// Status → SVG fill/stroke
const STATUS_FILL: Record<ToothStatus, { fill: string; stroke: string; text: string }> = {
  PROBLEM: { fill: "#fecaca", stroke: "#dc2626", text: "#991b1b" },
  UNDER_TREATMENT: { fill: "#fde68a", stroke: "#d97706", text: "#92400e" },
  TREATED: { fill: "#a7f3d0", stroke: "#059669", text: "#065f46" },
  MISSING: { fill: "#d6d3d1", stroke: "#57534e", text: "#44403c" },
};
const NEUTRAL_FILL = { fill: "#f5f5f4", stroke: "#78716c", text: "#44403c" };

interface ToothSvgProps {
  fdi: number;
  upper: boolean;
  cx: number;
  cy: number;
  record?: ToothRecord;
  onClick: (fdi: number) => void;
  hidden?: boolean;
  applyMode?: boolean;
  isApplySource?: boolean;
}

function ToothSvg({
  fdi,
  upper,
  cx,
  cy,
  record,
  onClick,
  hidden,
  applyMode,
  isApplySource,
}: ToothSvgProps) {
  if (hidden) return null;
  const type = toothType(fdi);
  const { w, h } = toothSize(type);
  const status = record?.status;
  const colors = status ? STATUS_FILL[status] : NEUTRAL_FILL;
  const conditions = record ? parseConditions(record.conditions) : [];

  const tooltipParts: string[] = [`Tooth ${fdi}`];
  if (status) tooltipParts.push(STATUS_LABEL[status]);
  if (conditions.length) tooltipParts.push(conditions.join(", "));
  if (record?.treatment) tooltipParts.push(`Tx: ${record.treatment}`);
  const tooltip = tooltipParts.join(" · ");

  // For upper jaw: crown faces DOWN (toward bite line). The icon path has crown at top
  // by default, so we flip the upper teeth vertically. Anchor point is the crown side
  // sitting on the curve.
  const half = w / 2;
  const tx = cx - half;
  // For upper, the icon's crown side (originally top) needs to be at the bottom (near bite line).
  // We flip with scale(1,-1) about the icon's vertical center, then translate.
  // Easier: place icon so crown (top of unflipped) ends up at curve y; flip moves it.
  // Approach: translate to (tx, cy) for upper, then apply scale(1,-1) — that flips the icon
  // upward so its now-bottom (originally top, which is the crown) is at y=cy and root extends up to y=cy-h.
  // Then we shift up by 0 so crown is exactly at cy.
  // For lower: crown (top of unflipped) should be at curve y, root extends down. translate(tx, cy).

  const labelOffset = 14; // text offset from root tip
  const labelX = cx;
  const labelY = upper ? cy - h - labelOffset : cy + h + labelOffset;

  const dotR = 4.5;
  // status dot near root tip
  const dotCx = cx + half - 3;
  const dotCy = upper ? cy - h + 4 : cy + h - 4;

  const applyTargetable = applyMode && !isApplySource;
  const groupClass = isApplySource
    ? "dental-tooth dental-tooth-source"
    : applyTargetable
    ? "dental-tooth dental-tooth-target"
    : "dental-tooth";

  return (
    <g
      role="button"
      onClick={() => onClick(fdi)}
      style={{ cursor: applyTargetable ? "copy" : "pointer" }}
      className={groupClass}
    >
      <title>{applyTargetable ? `${tooltip} — click to copy` : tooltip}</title>
      <g
        transform={
          upper
            ? `translate(${tx} ${cy}) scale(1 -1)`
            : `translate(${tx} ${cy})`
        }
      >
        <path
          d={toothPath(type, w, h).split(" Z ")[0] + " Z"}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <path
          d={crownDetailPath(type, w, h)}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        {type === "canine" && (
          <path
            d={crownDetailPath("canine", w, h)}
            fill={colors.stroke}
            fillOpacity={0.35}
          />
        )}
        {/* Apply-mode source outline */}
        {isApplySource && (
          <path
            d={toothPath(type, w, h).split(" Z ")[0] + " Z"}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2.5}
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        )}
      </g>
      {status && (
        <circle
          cx={dotCx}
          cy={dotCy}
          r={dotR}
          fill={colors.stroke}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      )}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill={status ? colors.text : "#78716c"}
        style={{ userSelect: "none" }}
      >
        {fdi}
      </text>
    </g>
  );
}

interface DentalArchSvgProps {
  recordsByFdi: Map<number, ToothRecord>;
  onSelect: (fdi: number) => void;
  filterFlagged: boolean;
  applyMode?: boolean;
  applySourceFdi?: number | null;
}

function DentalArchSvg({
  recordsByFdi,
  onSelect,
  filterFlagged,
  applyMode,
  applySourceFdi,
}: DentalArchSvgProps) {
  // Build curved arch path strings for label placement
  // Upper label arc: above the upper teeth (smaller ry)
  const upperLabelPathL = describeArc(ARCH_CX, UPPER_CY - 18, ARCH_RX - 30, ARCH_RY + 70, Math.PI, Math.PI * 1.42);
  const upperLabelPathR = describeArc(ARCH_CX, UPPER_CY - 18, ARCH_RX - 30, ARCH_RY + 70, Math.PI * 1.58, Math.PI * 2);
  const lowerLabelPathL = describeArc(ARCH_CX, LOWER_CY + 18, ARCH_RX - 30, ARCH_RY + 70, Math.PI * 0.58, Math.PI, true);
  const lowerLabelPathR = describeArc(ARCH_CX, LOWER_CY + 18, ARCH_RX - 30, ARCH_RY + 70, 0, Math.PI * 0.42, true);

  return (
    <svg
      viewBox={`0 0 ${ARCH_W} ${ARCH_H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Dental arch chart"
    >
      <defs>
        <path id="upper-label-l" d={upperLabelPathL} />
        <path id="upper-label-r" d={upperLabelPathR} />
        <path id="lower-label-l" d={lowerLabelPathL} />
        <path id="lower-label-r" d={lowerLabelPathR} />
        <style>{`
          .dental-tooth { transition: transform 120ms ease-out, filter 120ms ease-out; transform-box: fill-box; transform-origin: center; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,0.12)); }
          .dental-tooth:hover { transform: scale(1.08); filter: drop-shadow(0 3px 6px rgba(0,0,0,0.22)); }
          .dental-tooth-target { filter: drop-shadow(0 1px 1.5px rgba(13,148,136,0.25)); }
          .dental-tooth-target:hover { transform: scale(1.12); filter: drop-shadow(0 0 0 3px rgba(13,148,136,0.35)) drop-shadow(0 3px 6px rgba(13,148,136,0.35)); }
          .dental-tooth-source { filter: drop-shadow(0 0 0 2px rgba(13,148,136,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.12)); }
        `}</style>
      </defs>

      {/* Bite line */}
      <line
        x1={40}
        x2={ARCH_W - 40}
        y1={ARCH_H / 2}
        y2={ARCH_H / 2}
        stroke="#e7e5e4"
        strokeDasharray="4 6"
        strokeWidth={1}
      />
      {/* Mid line (left/right separator) */}
      <line
        x1={ARCH_CX}
        x2={ARCH_CX}
        y1={32}
        y2={ARCH_H - 32}
        stroke="#e7e5e4"
        strokeDasharray="2 4"
        strokeWidth={1}
      />

      {/* Quadrant labels along curves */}
      <text fontSize={11} fontWeight={700} fill="#a8a29e" letterSpacing="0.12em">
        <textPath href="#upper-label-l" startOffset="10%">UPPER RIGHT · Q1</textPath>
      </text>
      <text fontSize={11} fontWeight={700} fill="#a8a29e" letterSpacing="0.12em">
        <textPath href="#upper-label-r" startOffset="38%">UPPER LEFT · Q2</textPath>
      </text>
      <text fontSize={11} fontWeight={700} fill="#a8a29e" letterSpacing="0.12em">
        <textPath href="#lower-label-l" startOffset="52%">LOWER RIGHT · Q4</textPath>
      </text>
      <text fontSize={11} fontWeight={700} fill="#a8a29e" letterSpacing="0.12em">
        <textPath href="#lower-label-r" startOffset="10%">LOWER LEFT · Q3</textPath>
      </text>

      {/* Upper teeth */}
      {UPPER_FDIS.map((fdi, i) => {
        const { x, y } = archPosition(i, true);
        const rec = recordsByFdi.get(fdi);
        const hidden = filterFlagged && !rec;
        return (
          <ToothSvg
            key={fdi}
            fdi={fdi}
            upper
            cx={x}
            cy={y}
            record={rec}
            onClick={onSelect}
            hidden={hidden}
            applyMode={applyMode}
            isApplySource={applySourceFdi === fdi}
          />
        );
      })}

      {/* Lower teeth */}
      {LOWER_FDIS.map((fdi, i) => {
        const { x, y } = archPosition(i, false);
        const rec = recordsByFdi.get(fdi);
        const hidden = filterFlagged && !rec;
        return (
          <ToothSvg
            key={fdi}
            fdi={fdi}
            upper={false}
            cx={x}
            cy={y}
            record={rec}
            onClick={onSelect}
            hidden={hidden}
            applyMode={applyMode}
            isApplySource={applySourceFdi === fdi}
          />
        );
      })}
    </svg>
  );
}

// Build an SVG arc path for label placement.
// (cx, cy): ellipse center. rx, ry: radii. theta1..theta2 in radians. flip: reverse path direction so text reads correctly.
function describeArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  theta1: number,
  theta2: number,
  flip = false
): string {
  const p1 = { x: cx + rx * Math.cos(theta1), y: cy + ry * Math.sin(theta1) };
  const p2 = { x: cx + rx * Math.cos(theta2), y: cy + ry * Math.sin(theta2) };
  const largeArc = Math.abs(theta2 - theta1) > Math.PI ? 1 : 0;
  const sweep = flip ? 0 : 1;
  const start = flip ? p2 : p1;
  const end = flip ? p1 : p2;
  return `M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

export function DentalChartTab({
  patientId,
  onExit,
}: {
  patientId: string;
  onExit?: () => void;
}) {
  const qc = useQueryClient();
  const queryKey = ["patients", patientId, "toothRecords"] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/tooth-records`);
      const json = await res.json();
      return (json?.data ?? []) as ToothRecord[];
    },
    enabled: !!patientId,
  });

  const records = data ?? [];
  const recordsByFdi = useMemo(() => {
    const m = new Map<number, ToothRecord>();
    for (const r of records) m.set(r.fdi, r);
    return m;
  }, [records]);

  const [selectedFdi, setSelectedFdi] = useState<number | null>(null);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [applyTemplate, setApplyTemplate] = useState<ToothRecord | null>(null);

  const upsert = useMutation({
    mutationFn: async (input: {
      fdi: number;
      status: ToothStatus;
      conditions: string[];
      treatment: string;
      notes: string;
    }) => {
      const res = await fetch(`/api/patients/${patientId}/tooth-records`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("save failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (fdi: number) => {
      const res = await fetch(
        `/api/patients/${patientId}/tooth-records?fdi=${fdi}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("delete failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  // Lock body scroll while fullscreen + Esc to exit
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedFdi != null) return; // edit modal handles its own Esc
        if (applyTemplate) {
          setApplyTemplate(null);
          return;
        }
        onExit?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onExit, selectedFdi, applyTemplate]);

  const handleToothClick = (fdi: number) => {
    if (applyTemplate) {
      if (fdi === applyTemplate.fdi) return;
      upsert.mutate({
        fdi,
        status: applyTemplate.status,
        conditions: parseConditions(applyTemplate.conditions),
        treatment: applyTemplate.treatment ?? "",
        notes: applyTemplate.notes ?? "",
      });
      return;
    }
    setSelectedFdi(fdi);
  };

  const flaggedCount = records.length;
  const counts = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ToothStatus, number>
  );

  return (
    <div
      data-id="PATIENT-DENTAL-CHART-TAB"
      className="fixed inset-0 z-40 bg-white flex flex-col"
    >
      {/* Top bar */}
      <div className="shrink-0 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 cursor-pointer"
              aria-label="Exit dental chart"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="w-px h-5 bg-stone-200 hidden sm:block" />
          <div className="flex items-center gap-2 min-w-0">
            <Smile className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-base font-semibold text-stone-900 truncate">
              Dental Chart
            </h2>
            <Badge variant="default" className="text-[10px] shrink-0">
              FDI
            </Badge>
            {flaggedCount > 0 && (
              <Badge variant="primary" className="text-[10px] shrink-0">
                {flaggedCount} recorded
              </Badge>
            )}
          </div>

          {/* Legend (desktop) */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-stone-500 ml-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Problem
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Under
              treatment
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
              Treated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-400" /> Missing
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant={filterFlagged ? "primary" : "outline"}
              iconLeft={<Filter className="w-3.5 h-3.5" />}
              onClick={() => setFilterFlagged((f) => !f)}
            >
              <span className="hidden sm:inline">
                {filterFlagged ? "Showing flagged" : "Show only flagged"}
              </span>
              <span className="sm:hidden">
                {filterFlagged ? "Flagged" : "All"}
              </span>
            </Button>
            {onExit && (
              <button
                onClick={onExit}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 cursor-pointer"
                aria-label="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Legend (mobile) */}
        <div className="lg:hidden flex items-center gap-3 px-4 sm:px-6 pb-2 text-[11px] text-stone-500 overflow-x-auto">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Problem
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Under tx
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Treated
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400" /> Missing
          </span>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* Chart area */}
          <div className="flex-1 min-w-0 overflow-auto bg-gradient-to-b from-stone-50 via-white to-stone-50">
            {applyTemplate && (
              <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
                <Copy className="w-4 h-4 text-blue-700 shrink-0" />
                <div className="text-xs text-blue-900 min-w-0">
                  <span className="font-semibold">
                    Copying tooth {applyTemplate.fdi}
                  </span>
                  <span className="text-blue-700">
                    {" "}
                    ({STATUS_LABEL[applyTemplate.status]}
                    {parseConditions(applyTemplate.conditions).length > 0 &&
                      ` · ${parseConditions(applyTemplate.conditions).join(
                        ", "
                      )}`}
                    {applyTemplate.treatment && ` · Tx: ${applyTemplate.treatment}`}
                    ) — click teeth to apply
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  iconLeft={<Check className="w-3.5 h-3.5" />}
                  onClick={() => setApplyTemplate(null)}
                  className="ml-auto shrink-0"
                >
                  Done
                </Button>
              </div>
            )}
            <div className="max-w-[1100px] mx-auto px-3 sm:px-8 py-4 sm:py-8">
              <DentalArchSvg
                recordsByFdi={recordsByFdi}
                onSelect={handleToothClick}
                filterFlagged={filterFlagged}
                applyMode={!!applyTemplate}
                applySourceFdi={applyTemplate?.fdi ?? null}
              />

              {/* Counts strip */}
              {flaggedCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-6 text-xs justify-center">
                  {(
                    [
                      "PROBLEM",
                      "UNDER_TREATMENT",
                      "TREATED",
                      "MISSING",
                    ] as ToothStatus[]
                  )
                    .filter((s) => counts[s])
                    .map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-sm"
                      >
                        <span
                          className={cn("w-2 h-2 rounded-full", STATUS_DOT[s])}
                        />
                        {STATUS_LABEL[s]}:{" "}
                        <span className="font-semibold">{counts[s]}</span>
                      </span>
                    ))}
                </div>
              )}

              <p className="text-center text-xs text-stone-400 mt-4">
                Click any tooth to record findings
              </p>
            </div>
          </div>

          {/* Recorded list (sidebar on desktop, bottom sheet on mobile) */}
          {flaggedCount > 0 && (
            <aside className="shrink-0 lg:w-80 border-t lg:border-t-0 lg:border-l border-stone-200 bg-white overflow-y-auto max-h-[40vh] lg:max-h-none">
              <div className="px-4 py-3 border-b border-stone-100 sticky top-0 bg-white z-10">
                <h3 className="text-sm font-semibold text-stone-900">
                  Recorded teeth
                </h3>
                <p className="text-[11px] text-stone-400">
                  Click an entry to edit
                </p>
              </div>
              <div className="p-3 space-y-2">
                {records.map((r) => {
                  const conds = parseConditions(r.conditions);
                  const isActiveSource = applyTemplate?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "group relative flex items-start gap-3 p-3 rounded-lg transition-colors",
                        isActiveSource
                          ? "bg-blue-50 ring-1 ring-blue-300"
                          : "bg-stone-50 hover:bg-stone-100"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedFdi(r.fdi)}
                        className="absolute inset-0 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label={`Edit tooth ${r.fdi}`}
                      />
                      <div
                        className={cn(
                          "relative w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold border-2 shrink-0",
                          STATUS_STYLES[r.status]
                        )}
                      >
                        {r.fdi}
                      </div>
                      <div className="relative min-w-0 flex-1 pointer-events-none">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-stone-900">
                            Tooth {r.fdi}
                          </span>
                          <Badge
                            variant={
                              r.status === "TREATED"
                                ? "success"
                                : r.status === "UNDER_TREATMENT"
                                ? "warning"
                                : r.status === "MISSING"
                                ? "default"
                                : "danger"
                            }
                            className="text-[10px]"
                          >
                            {STATUS_LABEL[r.status]}
                          </Badge>
                        </div>
                        {conds.length > 0 && (
                          <div className="text-xs text-stone-500 mt-0.5">
                            {conds.join(", ")}
                          </div>
                        )}
                        {r.treatment && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            Treatment: {r.treatment}
                          </div>
                        )}
                        {r.notes && (
                          <div className="text-xs text-stone-500 mt-0.5 italic">
                            {r.notes}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setApplyTemplate(isActiveSource ? null : r);
                        }}
                        className={cn(
                          "relative shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300",
                          isActiveSource
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                        )}
                        title={
                          isActiveSource
                            ? "Stop copying"
                            : "Copy this record to other teeth"
                        }
                      >
                        {isActiveSource ? (
                          <>
                            <Check className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}
        </div>
      )}

      <ToothEditModal
        fdi={selectedFdi}
        existing={selectedFdi != null ? recordsByFdi.get(selectedFdi) : undefined}
        onClose={() => setSelectedFdi(null)}
        onSave={async (input) => {
          await upsert.mutateAsync(input);
          setSelectedFdi(null);
        }}
        onClear={async (fdi) => {
          await remove.mutateAsync(fdi);
          setSelectedFdi(null);
        }}
        saving={upsert.isPending}
        clearing={remove.isPending}
      />
    </div>
  );
}

interface ToothEditModalProps {
  fdi: number | null;
  existing?: ToothRecord;
  onClose: () => void;
  onSave: (input: {
    fdi: number;
    status: ToothStatus;
    conditions: string[];
    treatment: string;
    notes: string;
  }) => Promise<void> | void;
  onClear: (fdi: number) => Promise<void> | void;
  saving: boolean;
  clearing: boolean;
}

function ToothEditModal({
  fdi,
  existing,
  onClose,
  onSave,
  onClear,
  saving,
  clearing,
}: ToothEditModalProps) {
  const isOpen = fdi != null;
  const [status, setStatus] = useState<ToothStatus>("PROBLEM");
  const [conditions, setConditions] = useState<string[]>([]);
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [customCondition, setCustomCondition] = useState("");

  // re-sync when modal opens or FDI changes
  const syncKey = `${fdi}-${existing?.id ?? "new"}-${isOpen}`;
  const [prevKey, setPrevKey] = useState(syncKey);
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (isOpen) {
      setStatus(existing?.status ?? "PROBLEM");
      setConditions(parseConditions(existing?.conditions ?? null));
      setTreatment(existing?.treatment ?? "");
      setNotes(existing?.notes ?? "");
      setCustomCondition("");
    }
  }

  if (fdi == null) return null;

  const toggleCondition = (c: string) => {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const addCustom = () => {
    const v = customCondition.trim();
    if (!v) return;
    if (!conditions.includes(v)) setConditions([...conditions, v]);
    setCustomCondition("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tooth ${fdi}`}
      subtitle="Update status, conditions, treatment, and notes"
      size="lg"
      footer={
        <>
          {existing && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => onClear(fdi)}
              loading={clearing}
              disabled={saving}
              className="mr-auto text-red-600 hover:bg-red-50"
            >
              Clear record
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={clearing}
            onClick={() =>
              onSave({ fdi, status, conditions, treatment, notes })
            }
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">
            Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              ["PROBLEM", "UNDER_TREATMENT", "TREATED", "MISSING"] as ToothStatus[]
            ).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer",
                  status === s
                    ? STATUS_STYLES[s]
                    : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">
            Conditions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((c) => {
              const on = conditions.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer",
                    on
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                  )}
                >
                  {c}
                </button>
              );
            })}
            {conditions
              .filter((c) => !CONDITIONS.includes(c))
              .map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 border border-blue-300 text-blue-700"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => toggleCondition(c)}
                    className="p-0.5 rounded-full hover:bg-blue-100 cursor-pointer"
                  >
                    <XIcon className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add custom condition…"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addCustom}>
              Add
            </Button>
          </div>
        </div>

        {/* Treatment */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">
            Planned / current treatment
          </label>
          <Select
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            options={TREATMENTS.map((t) => ({
              value: t,
              label: t || "— None —",
            }))}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Clinical notes, observations, history…"
          />
        </div>
      </div>
    </Modal>
  );
}
