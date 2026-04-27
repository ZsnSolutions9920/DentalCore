# DentaCore — Patient Flow

End-to-end journey of a patient from first contact to discharge, mapped to the modules and tabs that exist in this system. Every step names:

- **Who** does it (role)
- **Where** in the app (tab / page / modal)
- **Data created** (Prisma model)
- **What blocks the next step**

---

## Stage 0 — First contact (lead)

A person calls or walks in but has not yet booked.

| | |
|---|---|
| Role | Receptionist / Call center |
| Page | `/leads` and `/calls` |
| Models created | `Lead`, `CallLog` |
| Outcome | Lead is logged, optionally assigned a callback. When they finally book, the lead is converted (`Lead.convertedPatientId` is set) and a `Patient` is created. |

If they walk in directly, skip to Stage 1.

---

## Stage 1 — Registration

The patient becomes a real record.

| | |
|---|---|
| Role | Receptionist |
| Page | `/patients` → "+ New Patient" |
| Modal | `AddPatientModal` |
| Models created | `Patient`, optional `Allergy[]`, `PatientTag[]`, `Consent` |
| Required fields | first/last name, phone, date of birth, gender, branch |
| Outcome | A `patientCode` (e.g. `PT-0021`) is generated, the patient is now searchable in `/patients`. |

**Don't skip:** `consentGiven` flag. PII handling later depends on it.

---

## Stage 2 — Booking

A future appointment is placed on the calendar.

| | |
|---|---|
| Role | Receptionist (any role can also book) |
| Page | `/appointments` or `/calendar`, or "Book" button on a patient profile |
| Modal | `CreateAppointmentModal` |
| Models created | `Appointment` (status `SCHEDULED`, workflowStage `BOOKED`) |
| Conflicts | The calendar checks `Schedule` (doctor working hours) and `DoctorLeave`. |

The patient's `nextAppointment` field is updated automatically.

---

## Stage 3 — Check-in

The patient arrives.

| | |
|---|---|
| Role | Receptionist / Assistant |
| Page | `/appointments` (today's list) or `/calendar` |
| Models updated | `Appointment.status = "ARRIVED"`, `checkinTime`, `workflowStage = "CHECKED_IN"`. The patient is added to `waitingQueue` (in-memory module store). |
| If room needed | `Room.currentPatientId` set; `Room.status = "OCCUPIED"`. |

This is also when payment-on-arrival is collected if the practice does that.

---

## Stage 4 — Triage / Vitals

Pre-doctor data capture.

| | |
|---|---|
| Role | Assistant |
| Page | `/vitals?patientId=…` |
| Models created | `Triage` |
| Captured | BP, heart rate, temperature, oxygen sat, weight, height, pain level, urgency. For dental: oral observations and skin/mucosa notes. |
| Outcome | Doctor sees triage at the top of the consultation screen. |

`Triage.urgencyLevel` (`ROUTINE`, `URGENT`, `EMERGENCY`) is the gating signal — emergencies skip the queue.

---

## Stage 5 — Consultation

The doctor sees the patient.

| | |
|---|---|
| Role | Doctor |
| Page | `/consultation?patientId=…` |
| Models created | `ConsultationNote` (one per appointment, unique on `appointmentId`) |
| Models updated | `Appointment.workflowStage = "IN_CONSULT"` |
| Captured | chief complaint, symptoms, examination, diagnosis, differential, treatment plan, advice, internal notes, follow-up date. |

Optional companion modules during consultation:

- **AI transcription** (`/ai`) — records the visit, produces structured note (`AITranscription`).
- **Dental Chart tab** — see Stage 6.

Note becomes immutable when `isSigned = true`.

---

## Stage 6 — Diagnosis: dental chart (per-tooth)

Doctor records what's wrong with which tooth.

| | |
|---|---|
| Role | Doctor |
| Page | Patient profile → **Dental Chart** tab (fullscreen) |
| Models created | `ToothRecord` (unique on `patientId + fdi`) |
| FDI numbering | Q1 upper-right (18→11), Q2 upper-left (21→28), Q3 lower-left (31→38), Q4 lower-right (48→41) |
| Statuses | `PROBLEM`, `UNDER_TREATMENT`, `TREATED`, `MISSING` |
| Conditions | Cavity, Fracture, Infection, Discoloration, Sensitivity, Plaque/Tartar, Gum Disease, Wear, Chipped, Impacted (+ free-text) |
| Treatments | Filling, Root Canal, Crown, Extraction, Bridge, Implant, Cleaning, Whitening, Veneer, Sealant, Bonding |

**Productivity feature:** the **Copy** button on any recorded entry puts the chart into "apply" mode — clicking another tooth copies the same status/conditions/treatment/notes. Use it when a patient has the same problem on several teeth.

This is independent of any single appointment — it persists with the patient.

---

## Stage 7 — Imaging & lab tests

If the consult requires it.

| | |
|---|---|
| Role | Doctor orders, Lab/Imaging team executes |
| Page | Patient profile → **Imaging** tab; lab module at `/lab-results` |
| Models created | `LabTest` (status flow: `REQUESTED` → `COLLECTED` → `COMPLETED`) |

Results attach back to the lab test record. Doctor sees them on the patient profile next visit.

---

## Stage 8 — Procedures (general)

Anything done in the chair that isn't an ortho visit.

| | |
|---|---|
| Role | Doctor |
| Page | Patient profile → **Procedures** tab |
| Models created | `Procedure` (FK to `Treatment` catalog + `Appointment`) |
| Captured | notes, outcome, complications, before/after images, areas treated, consent, settings |

The `Treatment` table is the catalog of services with default duration and `basePrice`. A procedure also lands as a line item on the invoice (Stage 12).

---

## Stage 9 — Prescriptions

| | |
|---|---|
| Role | Doctor |
| Page | Patient profile → **Rx** tab |
| Models created | `Prescription` (header) + `PrescriptionItem[]` (medicines) |
| Print | `GET /api/prescriptions/[id]/print` returns a printable HTML page. |

Items hold dosage, frequency, duration, route, instructions.

---

## Stage 10 — Braces / Orthodontic case (NEW)

For patients who need braces or aligners.

A **case** is a long-running treatment plan that can span 1–3 years. Each adjustment in the chair is a **visit** under the case.

| | |
|---|---|
| Role | Doctor |
| Page | Patient profile → **Braces** tab |
| Models created | `OrthoCase` (one per treatment course), `OrthoVisit` (one per chair appointment) |

### Lifecycle of a case

The `OrthoCase.status` field walks through these stages, in order:

1. **`CONSULTATION`** — initial discussion. Type (metal/ceramic/lingual/clear-aligner/self-ligating) and arches (upper/lower/both) tentatively chosen. No bonding yet.
2. **`RECORDS`** — diagnostic phase: X-rays (`LabTest` of imaging type), photos (`PatientDocument`), impressions/scans. Required before planning.
3. **`PLANNING`** — doctor finalises diagnosis, treatment plan, estimated end date, total cost. `paidAmount` rolls in as Stage 12 invoices are paid.
4. **`ACTIVE`** — brackets are placed (first visit type = `BRACKET_PLACEMENT`). Adjustment visits then happen at `intervalWeeks` (default 4). The dashboard's **Adjustments next 7 days** widget surfaces overdue patients.
5. **`RETENTION`** — brackets removed (visit type = `REMOVAL`), retainer fitted (visit type = `RETAINER_FITTING`). Patient still returns periodically to verify retention.
6. **`COMPLETED`** — discharge. `actualEndDate` is set.

`CANCELLED` exists as an off-flow state when treatment is abandoned.

### Visit types under a case

| Type | When |
|---|---|
| `BRACKET_PLACEMENT` | First active visit; bonding brackets |
| `ADJUSTMENT` | Routine periodic adjustment (default every 4w) |
| `WIRE_CHANGE` | Wire upgraded (e.g. 0.014 NiTi → 0.016 NiTi → stainless) |
| `ELASTICS` | Inter-arch elastics started or changed |
| `EMERGENCY` | Broken bracket, poking wire, etc. — outside the schedule |
| `PROGRESS_CHECK` | Mid-treatment review, possibly with new X-rays |
| `REMOVAL` | Brackets debonded |
| `RETAINER_FITTING` | Retainer issued, instructions given |

Each visit captures: upper/lower wire size, elastics config, complications, notes, and **next visit date**. The dashboard widget keys off the most-recent visit's `nextVisitDate`.

### Common braces problems and what to record

| Problem | What to do |
|---|---|
| Patient missed an adjustment | Visit goes ahead late; don't backdate. The "X days overdue" indicator on the patient's Braces tab tells you it slipped. |
| Bracket fell off | Log a visit type `EMERGENCY`, note which tooth, re-bond same visit if possible (mark on the **Dental Chart** tab too). |
| Wire poking | `EMERGENCY` visit, `complications` field describes it. |
| Decalcification / decay forming under brackets | Log a `ToothRecord` on the affected tooth (status `PROBLEM`, conditions `Cavity`). Plan removal/repair *after* braces if mild, *during* if severe — discuss in `notes`. |
| Patient wants to switch from metal to ceramic | Edit the case (`type` field). Don't delete and recreate — the visit history must persist. |
| Treatment paused (e.g. patient pregnant or moving) | Set status `RETENTION` if appropriate, otherwise add a note and skip future scheduling. |

---

## Stage 11 — Follow-ups

Pre-scheduled non-appointment reminders.

| | |
|---|---|
| Role | Doctor (creates), Receptionist (acts) |
| Page | Patient profile → **Follow-Ups** tab; module-wide at `/follow-ups` |
| Models created | `FollowUp` (status `PENDING` → `COMPLETED`) |

Follow-ups can also be triggered automatically by `/api/cron/reminders`.

---

## Stage 12 — Billing & payment

| | |
|---|---|
| Role | Billing / Receptionist |
| Page | Patient profile → **Billing** tab; module at `/billing` |
| Models created | `Invoice` (with `InvoiceItem[]`), `Payment[]`, occasionally `Refund` |
| Status flow | `Invoice.status`: `DRAFT` → `SENT` → `PARTIAL` → `PAID` (or `OVERDUE`/`CANCELLED`) |
| Patient mirror | `Patient.outstandingBalance` is updated as payments land |
| Packages | Multi-session prepaid plans live in `Package` + `PatientPackage`. A patient package decrements `remainingSessions` as procedures are performed. |

For braces, payment is usually a plan: total cost on the case, monthly installments captured as `Payment` rows against a single ortho `Invoice` (or several invoices, one per phase). The `OrthoCase.totalCost` and `paidAmount` fields are the doctor-facing summary; the source of truth for collected money is still the invoices/payments.

---

## Stage 13 — Check-out

| | |
|---|---|
| Role | Receptionist |
| Models updated | `Appointment.status = "COMPLETED"`, `checkoutTime`, `workflowStage = "CHECKED_OUT"`. Room freed. |

Receptionist also confirms next appointment is on the calendar (next ortho adjustment, follow-up consult, retainer check, etc.).

---

## Stage 14 — Communications (asynchronous)

Triggered throughout the journey.

| | |
|---|---|
| Page | Patient profile → **Comms** tab |
| Models created | `CommunicationLog` (SMS, email, WhatsApp) |

Examples: appointment reminders, lab results ready, payment receipts, post-op care instructions, retention check reminders.

---

## Stage 15 — Discharge / inactive

When the patient stops returning or formally ends treatment.

- `Patient.isActive = false` and `deletedAt` set if archiving.
- All clinical records remain (audit + medico-legal), only soft-deleted.
- Outstanding balance must be `0` or written off as a `Refund`/adjustment before archiving.

---

## How a typical braces patient's full timeline looks

```
Day  0   Stage 1: Registration
Day  0   Stage 2: Booking — initial consult
Day  3   Stage 3: Check-in
Day  3   Stage 4: Triage
Day  3   Stage 5: Consultation
Day  3   Stage 6: Dental chart updated (existing decay logged)
Day  3   Stage 10: New OrthoCase, status=CONSULTATION, type=METAL, arches=BOTH
Day  3   Stage 12: Consult invoice paid
Day 10   Stage 7: X-rays + photos uploaded → status=RECORDS
Day 17   Stage 5+10: Records review → status=PLANNING, totalCost=PKR 180,000
Day 24   Stage 10: First chair visit, type=BRACKET_PLACEMENT → status=ACTIVE
                  nextVisitDate set 4 weeks out, surfaced on admin dashboard
Day 52   Stage 10: ADJUSTMENT visit
Day 80   Stage 10: WIRE_CHANGE visit (0.014 NiTi → 0.016 NiTi)
...        (~18-24 monthly visits) ...
M 18+    Stage 10: REMOVAL visit + RETAINER_FITTING → status=RETENTION
M 18+    Stage 11: Follow-up scheduled at 3, 6, 12 months
M 30     Stage 10: status=COMPLETED, actualEndDate set
```

---

## Where each problem class lives

| Problem | System concept | Where it surfaces |
|---|---|---|
| Cavity / fracture / etc. on a tooth | `ToothRecord` | Dental Chart tab |
| Treatment course (orthodontics, full-mouth rehab) | `OrthoCase` (today: braces only) | Braces tab |
| Single chair-side procedure | `Procedure` | Procedures tab |
| Medication | `Prescription` + `PrescriptionItem` | Rx tab |
| Imaging / lab work | `LabTest` | Imaging tab |
| Soft-tissue / oral health history | `SkinHistory` (re-purposed for oral health), `MedicalHistory` | Med History / Oral Health tabs |
| Long-term clinical context | `ConsultationNote` (per appointment) | Notes tab |
| Money | `Invoice`, `Payment`, `PatientPackage` | Billing tab |

---

## Module map (file paths for engineers)

| Module | Schema | API base | UI tab/page |
|---|---|---|---|
| Patient | `Patient` | `/api/patients`, `/api/patients/[id]` | `src/app/(dashboard)/patients/...` |
| Dental chart | `ToothRecord` | `/api/patients/[id]/tooth-records` | `src/components/patients/tabs/dental-chart-tab.tsx` |
| Braces | `OrthoCase`, `OrthoVisit` | `/api/patients/[id]/ortho-cases`, `/api/ortho-cases/[id]`, `/api/ortho-cases/[id]/visits`, `/api/ortho-visits/[id]`, `/api/ortho-cases?status=ACTIVE&dueWithinDays=7` | `src/components/patients/tabs/braces-tab.tsx`, dashboard widget in `admin-dashboard.tsx` |
| Appointments | `Appointment` | `/api/appointments`, `/api/calendar` | `/appointments`, `/calendar` |
| Consultation | `ConsultationNote` | `/api/consultation-notes` | `/consultation` |
| Procedures | `Procedure` + `Treatment` | `/api/procedures`, `/api/treatments` | Procedures tab |
| Prescriptions | `Prescription` + `PrescriptionItem` | `/api/prescriptions/[id]` | Rx tab |
| Lab/imaging | `LabTest` | `/api/lab-tests` | Imaging tab, `/lab-results` |
| Billing | `Invoice`, `Payment`, `Refund` | `/api/billing/...` | `/billing`, Billing tab |
| Follow-ups | `FollowUp` | `/api/follow-ups` | Follow-Ups tab |
| Comms | `CommunicationLog` | `/api/messaging` | Comms tab |
| Audit | `AuditLog` | `/api/admin/...` | `/admin/audit` |

---

## Roles & what they typically touch

| Role | Stages they own |
|---|---|
| Receptionist | 1, 2, 3, 12, 13, 14 |
| Assistant | 3, 4, 13, room status |
| Doctor | 5, 6, 7 (orders), 8, 9, 10, 11 (sets) |
| Lab/Imaging | 7 (executes) |
| Billing | 12, refunds |
| Admin / Super admin | All, plus audit, packages, reports |
| Call center | 0 (leads & callbacks) |

Role hierarchy is enforced in `src/lib/require-auth.ts` via `ROLE_HIERARCHY`.

---

## Anti-patterns to avoid

- **Don't delete a `Patient`** — set `isActive=false`. Cascade-deletes will wipe years of clinical history.
- **Don't delete an `OrthoCase` mid-treatment** — set status `CANCELLED` instead. Visit history is medico-legal record.
- **Don't backdate visits** — `OrthoVisit.visitDate` should be when the visit physically happened. Use `notes` to clarify if late entry.
- **Don't unsign a `ConsultationNote`** — write a follow-up note instead. Signing is an integrity event.
- **Don't bypass invoice for cash payments** — even cash collected at the front desk should land in `Invoice` + `Payment` so reports are accurate.
