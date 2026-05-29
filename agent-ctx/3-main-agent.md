# Task 3: Fix All 37 Dummy/Placeholder Buttons in Admin & Guru Dashboards

## Agent: Main Agent
## Date: 2026-03-05
## Status: COMPLETED

## Work Summary
Replaced all 37 dummy/placeholder buttons in the UjianKu Admin and Guru web dashboards with fully functional implementations.

## Files Created
1. `src/lib/csv-export.ts` — CSV export utility
2. `src/app/api/v1/admin/sekolah/[id]/route.ts` — GET/PUT/DELETE for sekolah
3. `src/app/api/v1/admin/kelas/[id]/route.ts` — GET/PUT/DELETE for kelas
4. `src/app/api/v1/admin/mata-pelajaran/[id]/route.ts` — GET/PUT/DELETE for mata pelajaran

## Files Modified
1. `src/components/ujianku/admin-dashboard.tsx` — 19 buttons fixed (Quick Actions, Bell, User CRUD, Sekolah/Kelas CRUD, Mapel CRUD, Analytics export)
2. `src/components/ujianku/guru-dashboard.tsx` — 18 buttons fixed (Bank Soal CRUD, 5-step wizard, Exam edit/view, Results export, Bell)

## Key Decisions
- Used reusable `ModalOverlay` component for all modals (backdrop click-to-close)
- Lifted Add User modal state to parent AdminDashboard for Quick Action integration
- Created `wizardData` state object for the 5-step Buat Ujian wizard
- Used `exportToCSV` utility for all export buttons (triggers browser download)
- All form inputs are controlled (value + onChange)
- API calls use existing `apiFetch` helper with Bearer token auth

## Lint Status
✅ `bun run lint` passes with zero errors
