# Changelog

All notable changes to the EHRJ Madrasha ERP project will be documented in this file.

## [1.0.0-rc3] - 2026-08-06

### Added
- **Guardian Portal**: `/guardian/fees`, `/guardian/attendance`, `/guardian/results` pages with real API integration
- **Guardian Dashboard**: Child/ward switcher dropdown, quick navigation cards
- **Admin Dashboard**: Revenue vs Expense CSS bar charts, daily attendance & income summary cards
- **Global Search**: `Cmd+K` / `Ctrl+K` quick navigation modal across all 23 admin modules
- **Error Boundaries**: `global-error.tsx` (app-level), `error.tsx` (route-level)
- **Loading Screen**: Branded Bengali loading spinner (`loading.tsx`)
- **404 Page**: Custom Bengali not-found page (`not-found.tsx`)
- **SEO Metadata**: OpenGraph, Twitter Card, Bengali keywords, metadata template in `layout.tsx`
- **Verification Scripts**: 14 backend verification scripts for all core business flows
- **Evidence Logs**: Raw execution logs for EVID-001 through EVID-009

### Changed
- **DashboardStats Type**: Added optional `monthlyExpense`, `todayPresentCount`, `todayAbsentCount` fields
- **Admin Layout**: Enhanced `AdminHeader.tsx` with global search modal
- **Root Layout**: Upgraded metadata from minimal English to full Bengali SEO with OpenGraph

### Fixed
- **AppButton Variant**: Fixed `variant="default"` to `variant="primary"` in guardian fees page
- **TypeScript Errors**: Resolved all type mismatches in dashboard page

### Security
- **Backend**: `npm audit` — 0 vulnerabilities
- **Frontend**: 3 high severity (`next`, `postcss`, `sharp`) — Risk Accepted (preview upgrade blocked per Dependency Freeze)

### Verified
- Backend TypeScript: 0 errors
- Frontend TypeScript: 0 errors
- Next.js Production Build: 78 static/dynamic routes
- Full System Regression: 9/9 core integration flows PASSED
- Database Schema: In sync with Prisma schema
- SBOM: Complete dependency tree captured
