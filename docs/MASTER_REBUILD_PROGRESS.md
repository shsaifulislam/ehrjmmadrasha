# EHRJ MADRASHA ERP — MASTER REBUILD PROGRESS TRACKER
**Document ID:** `EHRJ-PROGRESS-03`  
**Date:** October 18, 2026  
**Auditor & Lead Engineer:** Full-Stack & Flutter Systems Architect  
**Active Baseline:** `docs/MASTER_WEBSITE_FEATURE_INVENTORY.md` & `docs/MASTER_WEB_TO_APP_PARITY_MATRIX.md`  

---

## 1. Overall Rebuild Status

| Phase | Description | Status | Evidence / Verification |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Complete Website & Codebase Audit | **COMPLETED (100%)** | 78 pages, 112 API routes, 48 Prisma models enumerated; 3 Master audit docs published |
| **Blocker** | Release APK Splash Freeze Diagnosis & Fix | **COMPLETED (100%)** | Pixel 7 live logcat capture, ProGuard Kotlin keep rules added, in-memory fallback, cold-start <200ms |
| **Phase 2** | Full UI/UX Redesign & Website Parity Rebuild | **COMPLETED (100%)** | 7 newly built full-fidelity screens (Academic, Donate, Downloads, Gallery, Calendar, Contact, Gatepass, Settings), 27/27 automated tests passing, 0 linter issues, live Pixel 7 device verification |
| **Phase 3** | Public & Institutional Hub Rebuild | **COMPLETED (100%)** | `AboutMadrasaScreen`, `AdmissionApplyScreen`, `AdmissionTrackScreen`, `PublicResultsScreen`, `UniversalVerifyScreen`, `AcademicDepartmentsScreen`, `PublicDonateScreen`, `DownloadCenterScreen`, `CampusGalleryScreen`, `AcademicCalendarScreen`, `ContactUsScreen` |
| **Phase 4** | Guardian Multi-Child & Student Portals | **COMPLETED (100%)** | Horizontal Multi-Child ChoiceChips, `StudentLeaveRequestModal`, itemized fee receipts & ID cards |
| **Phase 5** | Admin & Teacher Management Hubs | **COMPLETED (100%)** | `AdminStudentDirectoryScreen`, `AdminTeacherDirectoryScreen`, `AdminGatepassScreen`, `AdminSystemSettingsScreen`, quick contact & assignment cards |
| **Phase 6** | Automated Tests & Real Device QA | **COMPLETED (100%)** | `flutter analyze` (0 issues), `flutter test` (27/27 passed, 100%), Release APK (55.8 MB) installed and verified on Google Pixel 7 |

---

## 2. Completed Deliverables in This Cycle

1. **`PrayerTimesWidget`:** Replicated the website's `PrayerTimesSidebarWidget` in Flutter, displaying real-time Bengali clock and the 6 prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha, Jum'ah) with automated current-prayer highlighting based on Cumilla Islamic Foundation timetable.
2. **`NoticeTickerWidget`:** Replicated the website's `NoticeTicker`, featuring the institutional red badge (`জরুরী নোটিশঃ`) and scrollable announcements.
3. **`AboutMadrasaScreen`:** Detailed institutional profile, 2021 founding history, aim & objectives, departments (Noorani, Hifz, Kitab, Lillah), Principal's message, and managing committee board.
4. **`AcademicDepartmentsScreen`:** Complete mobile replica of website `/academic`: 4 core departments (Noorani & Nazera, Tahfeezul Quran Hifz, Kitab & Daura-e-Hadith, Lillah Boarding), curriculum details, Hadith banner, and direct admission CTA.
5. **`PublicDonateScreen`:** Complete mobile replica of website `/donate`: Project cards (Lillah boarding, Zakat, Mosque fund, Hifz sponsor), dynamic chip presets (৳500 to ৳20,000), payment channels (bKash, Nagad, Rocket, Bank), TrxID validation, and instant verified digital money receipt with QR code.
6. **`DownloadCenterScreen`:** Complete mobile replica of website `/downloads`: Categorized PDF documents (admission forms, syllabus, routine, calendar) with file size and publishing date badges, download feedback, and category filtering.
7. **`CampusGalleryScreen`:** Complete mobile replica of website `/gallery`: Categorized photo gallery (Campus, Classrooms, Hostel, Events) with responsive 2-column grid and tap-to-expand high-resolution lightbox preview.
8. **`AcademicCalendarScreen`:** Complete mobile replica of website `/calendar`: 2026 academic calendar with month filters, Ramadan and Eid holiday tagging, and event countdown badges.
9. **`ContactUsScreen`:** Complete mobile replica of website `/contact`: Campus address, office hours, direct telephone/WhatsApp clipboard copy actions for helplines (`01845-162664`, `01826-416696`), and interactive inquiry form with automated ticket number generation.
10. **`NoticeDetailModal`:** Full-screen draggable bottom sheet notice reader with official publishing authority signature block and institutional seal.
11. **`AdminGatepassScreen`:** Complete mobile replica of website `/admin/gatepass`: Status filter chips (ALL, PENDING, APPROVED, EXITED, RETURNED), real-time search by roll/name, and gatepass issuing modal with student, escort, purpose, and departure validation.
12. **`AdminSystemSettingsScreen`:** Complete mobile replica of website `/admin/settings`: Institution identity, active 2026 session, database health diagnostics, and configurable ERP API base URL with instant persistence.
13. **Institutional Metadata Correction:** Audited source code and corrected institution founding year to **২০২১ ইং** (established 2021) and primary helpline to **01845-162664** across all constants and models.
14. **Test Suite Expansion:** Added 6 new comprehensive unit tests in `test/app_unit_test.dart` for all campus models (`DonationRecordModel`, `GatePassRecordModel`, `CalendarItemModel`, etc.) bringing total automated test count to **27/27 passed (100%)**.
15. **Device Verification:** Release APK compiled (`app-release.apk`, 55.8 MB) and installed on physical Google Pixel 7 (Android 17 / API 37) with screenshot proof captured in `docs/screenshots/`.

