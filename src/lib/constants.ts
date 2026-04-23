// ============================================================
// DentaCore ERP - System Constants & IDs
// ============================================================

// ---- Design Tokens (Clean Dental Palette) ----
export const colors = {
  primary: "#0284C7",       // Sky-600 (dental blue)
  primaryLight: "#E0F2FE",  // Sky-100
  accent: "#6366F1",        // Indigo (AI features)
  accentLight: "#EEF2FF",
  success: "#10B981",       // Emerald (healthy / preventive)
  successLight: "#ECFDF5",
  warning: "#F59E0B",       // Amber
  warningLight: "#FFFBEB",
  danger: "#EF4444",        // Red (extractions, alerts)
  dangerLight: "#FEF2F2",
  info: "#3B82F6",          // Blue
  infoLight: "#EFF6FF",
  bg: "#F8FAFC",            // Slate-50 (clinical white)
  surface: "#FFFFFF",
  textPrimary: "#0F172A",   // Slate-900
  textSecondary: "#64748B", // Slate-500
  textMuted: "#94A3B8",     // Slate-400
  border: "#E2E8F0",        // Slate-200
  borderLight: "#F1F5F9",   // Slate-100
  sidebar: "#FFFFFF",
  sidebarHover: "#F0F9FF",  // Sky-50
  sidebarActive: "#0284C7", // Sky-600
} as const;

// ---- System Module IDs ----
export const MODULE_IDS = {
  // Auth
  AUTH_LOGIN: "AUTH-LOGIN",
  AUTH_ROLE_MGMT: "AUTH-ROLE-MGMT",
  AUTH_PERMISSION_MGMT: "AUTH-PERMISSION-MGMT",
  AUTH_AUDIT_LOG: "AUTH-AUDIT-LOG",

  // Dashboards
  DASH_ADMIN: "DASH-ADMIN",
  DASH_DOCTOR: "DASH-DENTIST",
  DASH_RECEPTION: "DASH-RECEPTION",
  DASH_BILLING: "DASH-BILLING",
  DASH_CALLCENTER: "DASH-CALLCENTER",
  DASH_ASSISTANT: "DASH-ASSISTANT",

  // Patient
  PATIENT_LIST: "PATIENT-LIST",
  PATIENT_PROFILE: "PATIENT-PROFILE",
  PATIENT_PROFILE_CREATE: "PATIENT-PROFILE-CREATE",
  PATIENT_PROFILE_EDIT: "PATIENT-PROFILE-EDIT",
  PATIENT_TAB_OVERVIEW: "PATIENT-TAB-OVERVIEW",
  PATIENT_TAB_APPOINTMENTS: "PATIENT-TAB-APPOINTMENTS",
  PATIENT_TAB_MEDICAL_HISTORY: "PATIENT-TAB-MEDICAL-HISTORY",
  PATIENT_TAB_SKIN_HISTORY: "PATIENT-TAB-ORAL-HEALTH",
  PATIENT_TAB_NOTES: "PATIENT-TAB-NOTES",
  PATIENT_TAB_PROCEDURES: "PATIENT-TAB-PROCEDURES",
  PATIENT_TAB_PRESCRIPTIONS: "PATIENT-TAB-PRESCRIPTIONS",
  PATIENT_TAB_IMAGES: "PATIENT-TAB-IMAGES",
  PATIENT_TAB_LABS: "PATIENT-TAB-IMAGING",
  PATIENT_TAB_DOCS: "PATIENT-TAB-DOCS",
  PATIENT_TAB_BILLING: "PATIENT-TAB-BILLING",
  PATIENT_TAB_PACKAGES: "PATIENT-TAB-PACKAGES",
  PATIENT_TAB_COMMS: "PATIENT-TAB-COMMS",
  PATIENT_TAB_FOLLOWUPS: "PATIENT-TAB-FOLLOWUPS",
  PATIENT_TAB_AI_TRANSCRIPTS: "PATIENT-TAB-AI-TRANSCRIPTS",

  // Appointments
  APPT_LIST: "APPT-LIST",
  APPT_CALENDAR: "APPT-CALENDAR",
  APPT_CREATE: "APPT-CREATE",
  APPT_CHECKIN: "APPT-CHECKIN",
  APPT_RESCHEDULE: "APPT-RESCHEDULE",
  APPT_CANCEL: "APPT-CANCEL",
  APPT_WAITLIST: "APPT-WAITLIST",
  APPT_ROOM_ALLOCATE: "APPT-CHAIR-ALLOCATE",
  APPT_CHECKOUT: "APPT-CHECKOUT",

  // Workflow
  FLOW_INQUIRY: "FLOW-INQUIRY",
  FLOW_BOOKED: "FLOW-BOOKED",
  FLOW_CHECKIN: "FLOW-CHECKIN",
  FLOW_WAITING: "FLOW-WAITING",
  FLOW_CONSULT: "FLOW-CONSULT",
  FLOW_DIAGNOSIS: "FLOW-DIAGNOSIS",
  FLOW_TREATMENT: "FLOW-TREATMENT",
  FLOW_PRESCRIPTION: "FLOW-PRESCRIPTION",
  FLOW_BILLING: "FLOW-BILLING",
  FLOW_PAYMENT: "FLOW-PAYMENT",
  FLOW_CHECKOUT: "FLOW-CHECKOUT",
  FLOW_FOLLOWUP: "FLOW-FOLLOWUP",
  FLOW_HISTORY_UPDATE: "FLOW-HISTORY-UPDATE",

  // Billing
  BILL_INVOICE: "BILL-INVOICE",
  BILL_CREATE: "BILL-CREATE",
  BILL_PAYMENT: "BILL-PAYMENT",
  BILL_RECEIPT: "BILL-RECEIPT",
  BILL_DISCOUNT: "BILL-DISCOUNT",
  BILL_REFUND: "BILL-REFUND",
  BILL_PACKAGE: "BILL-PACKAGE",
  BILL_INSURANCE: "BILL-INSURANCE",
  BILL_DUE: "BILL-DUE",

  // AI
  AI_TRANSCRIBE: "AI-TRANSCRIBE",
  AI_TRANSCRIBE_START: "AI-TRANSCRIBE-START",
  AI_NOTE_SUMMARY: "AI-NOTE-SUMMARY",
  AI_HISTORY_SUMMARY: "AI-HISTORY-SUMMARY",
  AI_FOLLOWUP_SUGGEST: "AI-FOLLOWUP-SUGGEST",
  AI_SCHEDULE_OPTIMIZER: "AI-SCHEDULE-OPTIMIZER",
  AI_RECORD_SEARCH: "AI-RECORD-SEARCH",
  AI_VOICE_TO_NOTE: "AI-VOICE-TO-NOTE",

  // History
  HIST_MEDICAL: "HIST-MEDICAL",
  HIST_SKIN: "HIST-ORAL",
  HIST_PROCEDURE: "HIST-PROCEDURE",
  HIST_ALLERGY: "HIST-ALLERGY",
  HIST_MEDS: "HIST-MEDS",
  HIST_IMAGES: "HIST-IMAGES",
  HIST_CONSENTS: "HIST-CONSENTS",
  HIST_PROGRESS: "HIST-PROGRESS",

  // Call Center
  CALL_LOOKUP: "CALL-LOOKUP",
  CALL_NEW_LEAD: "CALL-NEW-LEAD",
  CALL_CALLBACK: "CALL-CALLBACK",
  CALL_BOOKING: "CALL-BOOKING",
  CALL_CONVERSION: "CALL-CONVERSION",
  CALL_NOTES: "CALL-NOTES",

  // Admin
  ADMIN_USERS: "ADMIN-USERS",
  ADMIN_ROLES: "ADMIN-ROLES",
  ADMIN_BRANCHES: "ADMIN-BRANCHES",
  ADMIN_TREATMENTS: "ADMIN-SERVICES",
  ADMIN_SCHEDULES: "ADMIN-SCHEDULES",
  ADMIN_BILLING_RULES: "ADMIN-BILLING-RULES",
  ADMIN_PACKAGES: "ADMIN-PACKAGES",
  ADMIN_NOTIFICATIONS: "ADMIN-NOTIFICATIONS",
  ADMIN_AUDIT: "ADMIN-AUDIT",
  ADMIN_SETTINGS: "ADMIN-SETTINGS",
  ADMIN_REPORTS: "ADMIN-REPORTS",

  // Mobile App
  APP_DOCTOR: "APP-DENTIST",
  APP_RECEPTION: "APP-RECEPTION",
  APP_PATIENT: "APP-PATIENT",
  APP_NOTIFICATIONS: "APP-NOTIFICATIONS",
  APP_REMINDERS: "APP-REMINDERS",
} as const;

// ---- Status Mappings ----
export const appointmentStatusColors: Record<string, string> = {
  SCHEDULED: "default",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  WAITING: "warning",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  RESCHEDULED: "warning",
};

export const invoiceStatusColors: Record<string, string> = {
  DRAFT: "default",
  PENDING: "warning",
  PAID: "success",
  PARTIAL: "info",
  OVERDUE: "danger",
  CANCELLED: "default",
  REFUNDED: "danger",
};

export const leadStatusColors: Record<string, string> = {
  NEW: "info",
  CONTACTED: "warning",
  INTERESTED: "success",
  BOOKED: "success",
  NOT_INTERESTED: "default",
  FOLLOW_UP: "warning",
};

export const priorityColors: Record<string, string> = {
  NORMAL: "default",
  URGENT: "warning",
  EMERGENCY: "danger",
};

// ---- Role Labels (Dental clinic) ----
// NOTE: DOCTOR enum kept for DB compatibility; surfaced in UI as "Dentist".
// ASSISTANT surfaced as "Dental Nurse / Assistant".
export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DOCTOR: "Dentist",
  RECEPTIONIST: "Receptionist",
  BILLING: "Billing & Accounts",
  CALL_CENTER: "Call Center",
  ASSISTANT: "Dental Nurse / Assistant",
};

export const roleDashboardLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin Panel",
  ADMIN: "Admin Panel",
  DOCTOR: "Dentist Panel",
  RECEPTIONIST: "Front Desk",
  BILLING: "Billing Panel",
  CALL_CENTER: "Call Center",
  ASSISTANT: "Chairside Assistant",
};

// ---- Appointment Types ----
export const appointmentTypeLabels: Record<string, string> = {
  CONSULTATION: "Consultation",
  PROCEDURE: "Procedure",
  FOLLOW_UP: "Follow-Up",
  REVIEW: "Review",
  EMERGENCY: "Emergency",
};

// ---- Dental Service Categories ----
// NOTE: TreatmentCategory enum values kept (LASER, CHEMICAL_PEEL, FACIAL,
// INJECTABLE, SURGICAL, OTHER) for DB compat — remapped to dental meaning:
//   LASER         -> Preventive (exam/cleaning/sealants — blue category)
//   CHEMICAL_PEEL -> Restorative (fillings, inlays/onlays)
//   FACIAL        -> Endodontic (root canal)
//   INJECTABLE    -> Prosthodontic (crown/bridge/denture/veneer)
//   SURGICAL      -> Oral Surgery (extraction/implant/wisdom)
//   OTHER         -> Cosmetic / Orthodontic / Periodontic / Pediatric
export const treatmentCategories = [
  { value: "LASER", label: "Preventive" },
  { value: "CHEMICAL_PEEL", label: "Restorative" },
  { value: "FACIAL", label: "Endodontic" },
  { value: "INJECTABLE", label: "Prosthodontic" },
  { value: "SURGICAL", label: "Oral Surgery" },
  { value: "OTHER", label: "Cosmetic / Ortho / Perio / Pedo" },
] as const;

// ---- Full Dental Services Catalog (for seed + dropdowns) ----
export const dentalServices = [
  // Preventive
  { name: "Oral Examination", category: "LASER", duration: 20, basePrice: 30 },
  { name: "Scaling & Polishing", category: "LASER", duration: 45, basePrice: 60 },
  { name: "Fluoride Application", category: "LASER", duration: 15, basePrice: 25 },
  { name: "Fissure Sealant", category: "LASER", duration: 20, basePrice: 40 },
  // Restorative
  { name: "Composite Filling (1 surface)", category: "CHEMICAL_PEEL", duration: 30, basePrice: 80 },
  { name: "Composite Filling (2+ surface)", category: "CHEMICAL_PEEL", duration: 45, basePrice: 130 },
  { name: "GIC Filling", category: "CHEMICAL_PEEL", duration: 30, basePrice: 60 },
  { name: "Amalgam Filling", category: "CHEMICAL_PEEL", duration: 30, basePrice: 70 },
  { name: "Inlay / Onlay", category: "CHEMICAL_PEEL", duration: 60, basePrice: 350 },
  // Endodontic
  { name: "Root Canal Treatment - Anterior", category: "FACIAL", duration: 60, basePrice: 250 },
  { name: "Root Canal Treatment - Premolar", category: "FACIAL", duration: 75, basePrice: 320 },
  { name: "Root Canal Treatment - Molar", category: "FACIAL", duration: 90, basePrice: 450 },
  { name: "Re-RCT", category: "FACIAL", duration: 90, basePrice: 500 },
  { name: "Pulpotomy", category: "FACIAL", duration: 45, basePrice: 150 },
  // Prosthodontic
  { name: "Porcelain Crown (PFM)", category: "INJECTABLE", duration: 60, basePrice: 450 },
  { name: "Zirconia Crown", category: "INJECTABLE", duration: 60, basePrice: 650 },
  { name: "Porcelain Veneer", category: "INJECTABLE", duration: 90, basePrice: 700 },
  { name: "Bridge (3-unit)", category: "INJECTABLE", duration: 90, basePrice: 1500 },
  { name: "Complete Denture", category: "INJECTABLE", duration: 120, basePrice: 900 },
  { name: "Partial Denture", category: "INJECTABLE", duration: 90, basePrice: 600 },
  // Oral Surgery
  { name: "Tooth Extraction (Simple)", category: "SURGICAL", duration: 30, basePrice: 80 },
  { name: "Surgical Extraction", category: "SURGICAL", duration: 60, basePrice: 200 },
  { name: "Wisdom Tooth Removal", category: "SURGICAL", duration: 75, basePrice: 350 },
  { name: "Dental Implant", category: "SURGICAL", duration: 90, basePrice: 1800 },
  { name: "Bone Graft", category: "SURGICAL", duration: 60, basePrice: 500 },
  // Cosmetic / Ortho / Perio / Pedo
  { name: "In-office Teeth Whitening", category: "OTHER", duration: 60, basePrice: 300 },
  { name: "Take-home Whitening Kit", category: "OTHER", duration: 20, basePrice: 150 },
  { name: "Composite Bonding", category: "OTHER", duration: 45, basePrice: 180 },
  { name: "Braces - Metal (per arch)", category: "OTHER", duration: 60, basePrice: 1500 },
  { name: "Braces - Ceramic (per arch)", category: "OTHER", duration: 60, basePrice: 2200 },
  { name: "Clear Aligners (full case)", category: "OTHER", duration: 45, basePrice: 3500 },
  { name: "Retainer", category: "OTHER", duration: 30, basePrice: 200 },
  { name: "Deep Cleaning (per quadrant)", category: "OTHER", duration: 45, basePrice: 120 },
  { name: "Gum Surgery", category: "OTHER", duration: 60, basePrice: 400 },
  { name: "Pediatric Exam", category: "OTHER", duration: 20, basePrice: 35 },
  { name: "Space Maintainer", category: "OTHER", duration: 30, basePrice: 180 },
] as const;

// ---- Oral Health Classification ----
// Replaces dermatology Fitzpatrick skin type. Used as patient.skinType field
// (kept for DB compat; now means "oral hygiene / perio class").
export const skinTypes = [
  { value: "TYPE_I", label: "Excellent oral hygiene" },
  { value: "TYPE_II", label: "Good — mild plaque" },
  { value: "TYPE_III", label: "Fair — moderate plaque / gingivitis" },
  { value: "TYPE_IV", label: "Poor — generalized gingivitis" },
  { value: "TYPE_V", label: "Periodontitis — mild/moderate" },
  { value: "TYPE_VI", label: "Periodontitis — severe" },
] as const;

// ---- Common Dental Conditions ----
export const skinConditions = [
  "Dental Caries",
  "Pulpitis (Reversible)",
  "Pulpitis (Irreversible)",
  "Periapical Abscess",
  "Gingivitis",
  "Periodontitis",
  "Malocclusion",
  "Bruxism",
  "TMJ Disorder",
  "Impacted Wisdom Tooth",
  "Dental Fluorosis",
  "Enamel Hypoplasia",
  "Tooth Sensitivity",
  "Oral Ulcer / Aphthous",
  "Halitosis",
  "Dental Trauma / Fracture",
  "Missing Tooth",
  "Retained Deciduous Tooth",
] as const;

// ---- Visit Reasons ----
export const visitReasons = [
  "Routine Checkup",
  "Scaling & Cleaning",
  "Tooth Pain",
  "Tooth Sensitivity",
  "Broken / Chipped Tooth",
  "Bleeding Gums",
  "Cavity / Filling",
  "Root Canal",
  "Extraction Request",
  "Wisdom Tooth Pain",
  "Crown / Bridge Consultation",
  "Denture Consultation",
  "Braces / Ortho Consultation",
  "Teeth Whitening",
  "Implant Consultation",
  "Pediatric Dental Visit",
  "Emergency — Trauma",
  "Follow-up Visit",
  "Post-procedure Review",
  "Other",
] as const;

// ---- Workflow Stages ----
export const workflowStages = [
  { id: "FLOW-INQUIRY", label: "Inquiry", icon: "phone" },
  { id: "FLOW-BOOKED", label: "Booked", icon: "calendar" },
  { id: "FLOW-CHECKIN", label: "Check-In", icon: "log-in" },
  { id: "FLOW-WAITING", label: "Waiting", icon: "clock" },
  { id: "FLOW-CONSULT", label: "Consultation", icon: "stethoscope" },
  { id: "FLOW-DIAGNOSIS", label: "Diagnosis & Charting", icon: "clipboard" },
  { id: "FLOW-TREATMENT", label: "Chairside Treatment", icon: "activity" },
  { id: "FLOW-PRESCRIPTION", label: "Prescription", icon: "pill" },
  { id: "FLOW-BILLING", label: "Billing", icon: "receipt" },
  { id: "FLOW-PAYMENT", label: "Payment", icon: "credit-card" },
  { id: "FLOW-CHECKOUT", label: "Checkout", icon: "log-out" },
  { id: "FLOW-FOLLOWUP", label: "Follow-Up", icon: "repeat" },
  { id: "FLOW-HISTORY-UPDATE", label: "Updated", icon: "check-circle" },
] as const;
