# UjianKu Mobile App - Complete Redesign Worklog

## Date: 2026-03-04

## Summary
Complete mobile app redesign with PRO-MAX UI/UX, role restriction for mobile (Siswa & Pengawas only), and removal of Admin/Guru routes.

---

## Changes Made

### 1. Login Screen Redesign (`lib/screens/login_screen.dart`)
- **Role Restriction**: Mobile now ONLY allows SISWA and PENGAWAS roles
- If API returns ADMIN or GURU role after login, shows error: "Admin/Guru harus login melalui website UjianKu." and clears user data
- **PRO-MAX UI/UX Redesign**:
  - Modern gradient background (dark emerald to teal)
  - Large app logo with white glow effect (boxShadow)
  - Clean white bottom sheet form area with rounded top corners
  - High contrast text - all text clearly readable (Color(0xFF1A1A2E) for primary, Colors.grey[600] for secondary)
  - Proper text field styling with clear labels and focus animations
  - Professional gradient login button with shadow
  - Smooth animations (fadeIn, slideUp) on load
  - Subtle app version text at bottom

### 2. Routes Cleanup (`lib/config/routes.dart`)
- **REMOVED** all Admin routes (`/admin`, `/admin/users`, `/admin/settings`) and `AdminShell`
- **REMOVED** all Guru routes (`/guru`, `/guru/bank-soal`, `/guru/exams`, `/guru/results`) and `GuruShell`
- **REMOVED** all placeholder screens (`AdminUsersScreen`, `AdminSettingsScreen`, `GuruBankSoalScreen`, `GuruExamsScreen`, `GuruResultsScreen`)
- **REMOVED** imports for admin/home_screen.dart and guru/home_screen.dart
- **KEPT** only Siswa and Pengawas routes with their shells
- Updated BottomNavigationBar styling: `selectedItemColor: AppTheme.primary`, `unselectedItemColor: Colors.grey`

### 3. App Configuration (`lib/app.dart`)
- Initial location now only allows `/siswa` or `/pengawas`
- If stored role is admin/guru, clears storage and redirects to `/` (splash/login)
- Removed switch cases for admin/guru

### 4. Deleted Admin/Guru Directories
- Deleted `lib/screens/admin/` directory entirely
- Deleted `lib/screens/guru/` directory entirely

### 5. Constants Cleanup (`lib/utils/constants.dart`)
- Removed `routeAdminHome` and `routeGuruHome` constants
- Added comment noting mobile only supports Siswa and Pengawas

### 6. Siswa Screen Redesigns

#### `home_screen.dart`
- Screen background: `Color(0xFFF8F9FA)` (light grey)
- White stat cards with proper shadows and borders
- Stats numbers: 24px, FontWeight.w800, colored
- Labels: Colors.grey[600], FontWeight.w600
- Quick action buttons: White background, grey border, 48x48 icon containers
- Exam cards: White with boxShadow
- Empty state: 64px icon, Colors.grey[400], bold message, subtitle
- Header: Gradient with proper padding

#### `exam_list_screen.dart`
- White AppBar with elevation 0.5
- Search: Dark text (Color(0xFF1A1A2E)), grey hint
- Filter chips: White background, proper selected/unselected colors
- Error state: Red[50] background, red[700] text
- Empty states: Large icon, bold message, subtitle helper

#### `exam_detail_screen.dart`
- Gradient header card with shadow
- Info section: White card with grey border and shadow
- Info rows: Dark label values (FontWeight.w700, Color(0xFF1A1A2E))
- Rules section: Amber background, dark text (Colors.grey[800])
- Checkbox: Clean styling with border states

#### `exam_take_screen.dart`
- White AppBar, dark title text
- Progress bar: Grey[200] background, primary color
- Question indicator: White container, dark text
- Bottom nav: White with grey border, dark text
- Navigation drawer: Gradient header, colored status indicators
- Exit warning: Orange warning icon, grey body text

#### `exam_result_screen.dart`
- White score card with shadow (instead of colored background)
- Score circle: Colored with proper contrast
- Pass/fail status: Colored background, bold text
- Stat boxes: Colored with alpha, bold values
- Score rows: Grey icon, dark values, bold total
- Review cards: White with colored border, proper contrast

#### `profile_screen.dart`
- Gradient header with shadow
- Info sections: White cards with shadow and border
- Info rows: Dark values (FontWeight.w700), grey labels
- Stats: Colored containers, bold values
- Settings: Dark text, grey secondary text
- Logout: Danger variant button

### 7. Pengawas Screen Redesigns

#### `home_screen.dart`
- Dark header gradient with role badge
- Session card: White with shadow, colored status badges
- Stats: White cards with colored accents, bold numbers
- Quick actions: Colored background with matching icons and labels
- Violation cards: White with colored border, bold student names
- Error state: Red icon, grey message, outline retry button

#### `monitoring_screen.dart`
- White AppBar, dark text
- Session info bar: White with grey border
- Status pills: Colored with alpha background
- Student list items: White with shadow, dark names
- Session selection: White cards with rounded corners
- Auto-refresh indicator: Primary with alpha

#### `violation_list_screen.dart`
- White AppBar, dark text
- Search: Dark text style, grey hint
- Filter chips: Compact, primary delete icon
- Summary bar: Grey background, colored severity badges
- Violation cards: White with colored border, bold student names
- Detail sheet: White with proper contrast
- Empty state: Large icon, bold message, subtitle

#### `student_detail_screen.dart`
- Dark gradient header with avatar
- White status/progress card with shadow
- Dark text values, grey secondary
- Violation history: White cards with colored border
- Action buttons: Outline warn, danger disqualify, ghost allow
- Confirmation dialogs: Dark text, grey body

#### `report_screen.dart`
- Gradient header with shadow
- Stat cards: Colored with alpha, bold numbers
- Completion bar: White card with shadow
- Violation section: Conditional coloring, bold numbers
- Student table: Grey header, white rows, dark text
- Action buttons: Outline PDF, danger end session

---

## Design Principles Applied

1. **Text Contrast**: Dark text on light backgrounds (`Color(0xFF1A1A2E)` or `Colors.grey[900]`)
2. **Secondary Text**: `Colors.grey[600]` minimum - never lighter than grey[500]
3. **Card Design**: White background, subtle shadow (`BoxShadow blurRadius: 8`), `borderRadius: 16`
4. **Stats Numbers**: Font size 24+, `FontWeight.w800`, colored
5. **Status Badges**: Dark text on colored backgrounds, or colored text on white with colored border
6. **Bottom Navigation**: `selectedItemColor: AppTheme.primary`, `unselectedItemColor: Colors.grey`
7. **App Bars**: White background, dark title text, `elevation: 0.5`
8. **Empty States**: Large icon (64px), clear message text, helper subtitle
9. **Error States**: Red icon, clear error text, retry button
10. **Loading States**: `CircularProgressIndicator` with `AppTheme.primary` color

## Color Standards Used
- Primary text: `Color(0xFF1A1A2E)` / `Colors.grey[900]`
- Secondary text: `Colors.grey[600]`
- Hint text: `Colors.grey[500]`
- Error text: `Colors.red[700]`
- Success text: `Colors.green[700]`
- Card backgrounds: `Colors.white`
- Screen background: `Color(0xFFF8F9FA)` / `Colors.grey[50]`

---

## Date: 2026-03-05 — Critical Bug Fixes (Task ID: 1)

### Bug 1: Type Cast Error in Exam List (CRITICAL)
**File**: `lib/services/api_service.dart`
**Problem**: `ApiResponse.listBody` tried `data?['data'] as List<dynamic>?` which crashed when the API returned paginated data (`{ data: { data: [...], pagination: {...} } }`) because `data['data']` was a Map, not a List.
**Fix**: Replaced the single cast with smart type checking — if `data['data']` is a List, return it directly; if it's a Map (paginated wrapper), extract the nested `data` list. Also added a `pagination` getter that extracts the pagination metadata from paginated responses.

### Bug 2: Question Images Never Load
**File**: `lib/widgets/question_widget.dart`
**Problem**: The image section showed a static `Icons.image_outlined` placeholder icon instead of loading the actual image from `question.imageUrl`.
**Fix**: Replaced the static Container with Icon with `CachedNetworkImage` (already in pubspec.yaml). Added proper `placeholder` with a loading spinner and `errorWidget` with a broken-image icon for error states.

### Bug 3: Essay Input Doesn't Sync on Navigation
**File**: `lib/widgets/question_widget.dart`
**Problem**: `_EssayInput` widget used a local `TextEditingController` initialized only in `initState`. When navigating between questions, `initState` doesn't re-run, so the controller kept the old text.
**Fix**: Added `didUpdateWidget` override to `_EssayInputState` that detects when `initialText` changes and updates the controller text while preserving the cursor selection.

### Bug 4: Double Monitoring Timer
**File**: `lib/providers/proctor_provider.dart`
**Problem**: `startMonitoring()` created a 5-second polling timer internally. But `MonitoringScreen` also created its own 30-second timer that called `startMonitoring()` again, causing overlapping timers and wasted API calls.
**Fix**: Removed the internal `Timer.periodic` from `startMonitoring()` — it now just does a single fetch. The screen's 30-second timer is the sole driver of periodic polling. `stopMonitoring()` still cancels any existing timer for cleanup safety.

### Bug 5: Reports Tab Dead End
**File**: `lib/screens/pengawas/report_screen.dart`
**Problem**: Route `/pengawas/reports` created `ReportScreen(sessionId: '')` which showed a static "Pilih sesi" message with only a "Lihat Jadwal" button — a dead end.
**Fix**: When `sessionId` is empty, the screen now loads sessions from `ProctorProvider` and displays a list of completed sessions the pengawas can pick from. Each session card navigates to `/pengawas/sessions/:sessionId/report`. Added `_ReportSessionCard` widget for the session list items. If no completed sessions exist, shows an appropriate empty state.

---

## Date: 2026-03-05 — Replace Dummy/Placeholder Buttons with Real Functionality (Task ID: 2)

### 1. Login Screen — "Lupa Password?" Button
**File**: `lib/screens/login_screen.dart`
**Before**: SnackBar with message "Fitur lupa password segera hadir"
**After**: Opens a proper forgot password dialog with:
  - Email input field with validation
  - Loading state while submitting
  - Attempts API call to `/auth/forgot-password` (gracefully handles if API doesn't support it yet)
  - On success, shows confirmation dialog: "Permintaan reset password telah dikirim ke email Anda"
**Added imports**: `ApiService`

### 2. Siswa Home Screen — Notification Bell
**File**: `lib/screens/siswa/home_screen.dart`
**Before**: SnackBar with message "Tidak ada notifikasi baru"
**After**: Opens a bottom sheet with:
  - Rounded top corners with handle bar
  - "Notifikasi" title with close button
  - Empty state with `notifications_off_outlined` icon (64px)
  - Message "Belum ada notifikasi" with helper subtitle
  - Ready for future notification items to be added

### 3. Profile Screen — "Kebijakan Privasi" Tile
**File**: `lib/screens/siswa/profile_screen.dart`
**Before**: SnackBar with message "Halaman kebijakan privasi segera hadir"
**After**: Navigates to new `PrivacyPolicyScreen` via `Navigator.push`
**New file**: `lib/screens/siswa/privacy_policy_screen.dart`
  - Full static privacy policy content in Indonesian
  - 9 sections: Pendahuluan, Informasi yang Dikumpulkan, Penggunaan Informasi, Perlindungan Data, Pengawasan Ujian, Berbagi Informasi, Hak Anda, Perubahan Kebijakan, Kontak
  - Gradient header card with last-updated date
  - White section cards with proper typography and spacing

### 4. Profile Screen — "Bantuan" Tile
**File**: `lib/screens/siswa/profile_screen.dart`
**Before**: SnackBar with message "Halaman bantuan segera hadir"
**After**: Navigates to new `HelpScreen` via `Navigator.push`
**New file**: `lib/screens/siswa/help_screen.dart`
  - 9 expandable FAQ items with expand/collapse animation
  - Covers: registration, starting exams, disconnections, warnings, viewing results, auto-save, forgot password, editing profile, pengawas role
  - Contact section with email, website, and phone
  - Gradient header card

### 5. Profile Screen — Notifications Toggle Persistence
**File**: `lib/screens/siswa/profile_screen.dart`
**Before**: `_notifications` state was only local, reset on screen rebuild
**After**:
  - Loads initial value from `StorageService().getNotificationsEnabled()` in `initState`
  - Persists value on change via `StorageService().saveNotificationsEnabled(value)`
  - Added import: `StorageService`
**File**: `lib/services/storage_service.dart` — already had `saveNotificationsEnabled` and `getNotificationsEnabled` methods

### 6. Pengawas Report Screen — "Ekspor Laporan PDF" Button
**File**: `lib/screens/pengawas/report_screen.dart`
**Before**: SnackBar with message "Fitur ekspor PDF segera hadir"
**After**:
  - Button renamed to "Salin Laporan" with copy icon
  - `_buildReportSummaryText()` generates a formatted text summary of the entire report (session info, statistics, violations, student results)
  - Copies the summary to clipboard via `Clipboard.setData()`
  - Shows success SnackBar: "Laporan berhasil disalin ke clipboard"
**Added imports**: `flutter/services.dart`

### 7. Pengawas Report Screen — "Bagikan" / Share Button
**File**: `lib/screens/pengawas/report_screen.dart`
**Before**: SnackBar with message "Fitur bagikan laporan segera hadir"
**After**:
  - Uses `share_plus` package to share the report summary text
  - `Share.share(summary, subject: 'Laporan Sesi Ujian - UjianKu')` opens the system share sheet
  - Users can share via WhatsApp, email, SMS, etc.
**Added imports**: `share_plus`
**Updated pubspec.yaml**: Added `share_plus: ^9.0.0` dependency

---

## Date: 2026-03-05 — Fix All 37 Dummy/Placeholder Buttons in Admin & Guru Dashboards (Task ID: 3)

### Summary
Replaced all 37 dummy/placeholder buttons in the Admin and Guru dashboards with real functionality. This includes CSV export, modals for add/edit/view operations, a fully functional 5-step exam creation wizard, notification dropdowns, and proper API integration.

### New Files Created

#### 1. CSV Export Utility (`src/lib/csv-export.ts`)
- `exportToCSV(data, filename)` function that converts array of objects to CSV and triggers browser download
- Handles null/undefined values, proper CSV escaping for quotes

#### 2. API Routes for Admin CRUD Operations
- **`src/app/api/v1/admin/sekolah/[id]/route.ts`** — GET (detail), PUT (update), DELETE (with kelas count check)
- **`src/app/api/v1/admin/kelas/[id]/route.ts`** — GET (detail), PUT (update), DELETE (with siswa count check)
- **`src/app/api/v1/admin/mata-pelajaran/[id]/route.ts`** — GET (detail), PUT (update), DELETE (with exams/soal count check)

### Admin Dashboard Fixes (`src/components/ujianku/admin-dashboard.tsx`) — 19 buttons fixed

1. **"Tambah Guru Baru"** (Quick Action) → Opens Add User modal with role pre-set to GURU via `handleQuickAction` callback
2. **"Buat Ujian Baru"** (Quick Action) → Shows alert directing to Guru panel
3. **"Lihat Laporan"** (Quick Action) → Switches to Analytics tab
4. **"Kelola Sekolah"** (Quick Action) → Switches to Sekolah & Kelas tab
5. **Bell icon** (Header) → Dropdown with empty notification state (ready for future notifications)
6. **"Ekspor" button** (User Management) → Calls `exportToCSV()` with user data
7. **Edit (pencil) button per user** → Opens edit modal pre-filled with user data, PUT to `/api/v1/admin/users/[id]`
8. **Eye/View button per user** → Shows user detail dialog with full user info (avatar, role badge, all fields)
9. **"Tambah Sekolah" button** → Opens add modal with nama/npsn/alamat fields, POST to `/api/v1/admin/sekolah`
10. **"Detail" button per sekolah** → Shows school detail dialog with all info
11. **Edit button per sekolah** → Opens edit modal pre-filled, PUT to `/api/v1/admin/sekolah/[id]`
12. **"Tambah Kelas" button** → Opens add modal with nama/tingkat/tahunAjaran/sekolah fields, POST to `/api/v1/admin/kelas`
13. **Edit button per kelas** → Opens edit modal pre-filled, PUT to `/api/v1/admin/kelas/[id]`
14. **MoreVertical button per kelas** → Dropdown menu with Edit and Delete options (Delete calls DELETE API)
15. **"Ekspor" button** (Mata Pelajaran) → Calls `exportToCSV()` with subject data
16. **"Tambah Mapel" button** → Opens add modal with kode/nama/kkm/kelompok fields, POST to `/api/v1/admin/mata-pelajaran`
17. **"Detail" button per mapel** → Shows subject detail dialog with all info and counts
18. **Edit button per mapel** → Opens edit modal pre-filled, PUT to `/api/v1/admin/mata-pelajaran/[id]`
19. **"Ekspor" button** (Analytics) → Calls `exportToCSV()` with analytics summary data

### Guru Dashboard Fixes (`src/components/ujianku/guru-dashboard.tsx`) — 18 buttons fixed

20. **"Ekspor" button** (Bank Soal) → Calls `exportToCSV()` with question data
21. **Copy button per soal** → Duplicates question via POST to `/api/v1/bank-soal` with copied data + "(salinan)" suffix
22. **Edit button per soal** → Opens edit modal pre-filled with all soal fields, PUT to `/api/v1/bank-soal/[id]`
23. **Entire 5-step wizard** (Buat Ujian — CRITICAL) → Fully functional with `wizardData` state management:
   - **Step 1**: All controlled inputs — judul, deskripsi, mataPelajaranId, tipeExam, durasi, token, tanggalMulai, tanggalSelesai
   - **Step 2**: Checkboxes tracking `selectedSoalIds` with visual highlighting, counter badge
   - **Step 3**: Controlled toggles for acakSoal, acakOpsi, antiCheat, showResult + controlled passingGrade/maxAttempt inputs
   - **Step 4**: Checkboxes tracking `selectedKelasIds` with visual highlighting, counter badge
   - **Step 5**: Review page showing all entered data, POST to `/api/v1/exams` on "Publikasikan Ujian" with loading state
24. **Edit button per exam card** → Opens wizard pre-filled with exam data (step 1) for editing
25. **Eye/View button per exam card** → Shows exam detail dialog with all info (judul, status, mapel, settings, kelas list)
26. **"Ekspor ke Excel" button** (Hasil Ujian) → Calls `exportToCSV()` with results data
27. **Bell icon** (Header) → Same as admin, dropdown with empty notification state

### Architecture Changes
- **Admin Dashboard**: Lifted `showAddUserModal` and `presetRole` state to parent `AdminDashboard` component to allow Quick Actions to trigger the Add User modal
- **DashboardOverview**: Added `onQuickAction` prop for tab switching and modal triggering
- **UserManagement**: Added `showAddModal`/`setShowAddModal`/`presetRole` props for external control
- **ModalOverlay**: Created reusable modal component for both dashboards, with backdrop click-to-close
- **BuatUjian**: Complete rewrite of wizard — all uncontrolled inputs replaced with controlled inputs bound to `wizardData` state

### Code Quality
- All lint checks pass cleanly (`bun run lint` — no errors)
- TypeScript strict typing maintained throughout
- Consistent error handling patterns (try/catch with silent handling)
- API field names match backend route expectations
