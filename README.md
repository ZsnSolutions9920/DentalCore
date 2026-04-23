# DentaCore — Dental Clinic ERP

DentaCore is a full-stack Dental Clinic Management System covering front desk, clinical workflow, billing, patient records, imaging, call-center CRM, and admin — built with Next.js (App Router), Prisma, and Tailwind.

## Quick Start

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

## Roles

- **Super Admin / Admin** — users, branches, service catalog, schedules, reports, audit
- **Dentist** — appointments, clinical notes, treatment plans, prescriptions, follow-ups
- **Receptionist** — appointment booking, check-in, chair allocation, registration
- **Billing & Accounts** — invoices, payments, refunds, insurance claims
- **Call Center** — leads, callbacks, conversions
- **Assistant / Dental Nurse** — vitals, pre-exam, chair prep, materials

## Core Modules

Patients · Appointments · Clinical Notes · Treatment Plans · Prescriptions · Dental Imaging (X-ray / OPG / CBCT) · Dental Supplies · Billing & Payments (Cash / Card / Bank / Insurance) · Packages · Follow-ups · Call Center / Leads · Notifications · Reports · Audit Log · AI Transcription

## Dental Services Catalog (Default)

**Preventive** — Scaling & Cleaning, Fluoride, Sealants, Oral Exam
**Restorative** — Fillings (Composite / GIC / Amalgam), Inlays, Onlays
**Endodontic** — Root Canal Treatment (RCT), Re-RCT, Pulpotomy
**Prosthodontic** — Crown, Bridge, Denture (Full / Partial), Veneers
**Orthodontic** — Braces (Metal / Ceramic), Clear Aligners, Retainers
**Oral Surgery** — Extraction, Wisdom Tooth Removal, Implant, Bone Graft
**Periodontic** — Deep Cleaning, Gum Surgery, Gum Contouring
**Cosmetic** — Whitening (In-office / Take-home), Veneers, Bonding
**Pediatric** — Pediatric Exam, Sealants, Space Maintainer

## Tech

Next.js 15 (App Router) · TypeScript · Prisma (SQLite/Postgres) · Tailwind CSS · JWT auth (jose) · Capacitor (Android wrapper) · React Query.

## Mobile

Android build via Capacitor — see `android/` and `capacitor.config.ts`.
