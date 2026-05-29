# Task 2 — Replace Dummy/Placeholder Buttons with Real Functionality

**Agent**: Code Fixer
**Date**: 2026-03-05
**Status**: ✅ Completed

## Summary
Replaced all 7 dummy SnackBar buttons in the UjianKu Flutter mobile app with real functionality.

## Changes Made

### 1. Login Screen — "Lupa Password?" (login_screen.dart)
- Replaced SnackBar with a full forgot password dialog
- Dialog includes email input, validation, loading state, and API call attempt
- Shows success confirmation dialog after submission

### 2. Siswa Home Screen — Notification Bell (home_screen.dart)
- Replaced SnackBar with a notification bottom sheet
- Includes handle bar, title, close button, and proper empty state

### 3. Profile Screen — "Kebijakan Privasi" (profile_screen.dart)
- Created new `privacy_policy_screen.dart` with full static privacy policy content
- Navigation via `Navigator.push` with MaterialPageRoute

### 4. Profile Screen — "Bantuan" (profile_screen.dart)
- Created new `help_screen.dart` with 9 expandable FAQ items + contact section
- Navigation via `Navigator.push` with MaterialPageRoute

### 5. Profile Screen — Notifications Toggle (profile_screen.dart)
- Now persists using `StorageService.saveNotificationsEnabled()` and loads via `getNotificationsEnabled()`

### 6. Pengawas Report — "Ekspor Laporan PDF" (report_screen.dart)
- Button renamed to "Salin Laporan" with copy icon
- Generates formatted text summary and copies to clipboard
- Shows success SnackBar

### 7. Pengawas Report — "Bagikan" (report_screen.dart)
- Uses `share_plus` package to share report summary via system share sheet
- Added `share_plus: ^9.0.0` to pubspec.yaml

## Files Modified
- `lib/screens/login_screen.dart`
- `lib/screens/siswa/home_screen.dart`
- `lib/screens/siswa/profile_screen.dart`
- `lib/screens/pengawas/report_screen.dart`
- `pubspec.yaml`

## Files Created
- `lib/screens/siswa/privacy_policy_screen.dart`
- `lib/screens/siswa/help_screen.dart`
