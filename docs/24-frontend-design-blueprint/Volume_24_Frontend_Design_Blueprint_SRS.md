# Volume 24 – Frontend Design System & Enterprise UI/UX Standards (EHRJ-SRS-V24)

**Document Code:** EHRJ-SRS-V24  
**Module:** Frontend Design System & Enterprise UI/UX Standards  
**Applies To:** Admin ERP, Student Portal, Teacher Portal, Guardian Portal, Public Website, Shared Component Library  

---

## 1. Purpose & Frontend Design Architecture
Frontend Design System হলো পুরো EHRJ Madrasha ERP-এর সমস্ত ভিজ্যুয়াল ইন্টারফেস ও ইউআই/ইউএক্স (UI/UX)-এর একক ডিজাইনিং সংবিধান (Single Source of Truth)।
- এডমিন প্যানেল, শিক্ষার্থী পোর্টাল, শিক্ষক পোর্টাল, অভিভাবক পোর্টাল এবং পাব্লিক ওয়েবসাইট—সবগুলো একই ডিজাইন টোকেন, কালার প্যালেট, টাইপোগ্রাফি এবং Shared Component Library অনুসরণ করবে।

```text
Next.js 15 App Router (React 19)
               │
               ▼
Unified Layouts (Admin / Portal / Public)
               │
               ▼
Page Views (App Router / (dashboard) / (public))
               │
               ▼
Feature Components & Domain Modules
               │
               ▼
Master Shared Component Library (App* Components)
               │
               ▼
Shadcn UI Primitives & Tailwind CSS Design Tokens (Dark / Light / System)
```

---

## 2. Core Frontend Technology Stack & Structure
- **Framework:** Next.js 15 (App Router with Server Components & Client Boundaries) + React 19.
- **Styling & Components:** Tailwind CSS v4, Shadcn UI Primitives, Lucide React Icons.
- **State & Data Fetching:** Zustand (Global Client State), TanStack Query v5 (Server Data Caching).
- **Form & Validation:** React Hook Form + Zod Schema Validation Engine.
- **Charts & Motion:** Recharts Engine & Framer Motion Functional Animations.

---

## 3. Design Tokens & Theme Engine (WCAG 2.2 AA)

### A. Color Palette
- **Primary:** Blue 600 (`#2563EB`)
- **Secondary:** Slate 600 (`#475569`)
- **Success:** Green 600 (`#16A34A`)
- **Warning:** Amber 500 (`#F59E0B`)
- **Danger:** Red 600 (`#DC2626`)
- **Backgrounds:** Dynamic Neutral (Light / Dark Mode without page reload)

### B. Typography Standards
- **Latin Typography:** Inter (`font-sans`)
- **Bangla Typography:** Noto Sans Bengali / Hind Siliguri (`font-bangla`)

---

## 4. Master Shared Component Mandate (28 App* Components)
ERP-এর যেকোনো ডেভেলপমেন্টে আলাদা কোনো কাস্টম ফর্ম বা টেবিল তৈরি নিষিদ্ধ। বাধ্যতামূলকভাবে নিচের ২৬টি রিইউজেবল **App* Components** ব্যবহার করতে হবে:
`AppButton`, `AppInput`, `AppTextarea`, `AppSelect`, `AppCheckbox`, `AppRadio`, `AppSwitch`, `AppModal`, `AppDrawer`, `AppTable`, `AppCard`, `AppForm`, `AppTabs`, `AppSearch`, `AppFilter`, `AppStats`, `AppTimeline`, `AppBadge`, `AppStatus`, `AppAvatar`, `AppUploader`, `AppPDF`, `AppPrint`, `AppExport`, `AppImport`, `AppConfirm`, `AppToast`, `AppPermission`

---

## 5. Table & Form Enterprise Standards

### A. Table Standards (`AppTable`)
- গ্লোবাল কাস্টম ফিল্টার, সর্টিং, সার্ভার-সাইড পেজিনেশন, কলাম ভিজিবিলিটি টগল, বাল্ক সিলেকশন, অপশনাল কার্ড ভিউ এবং এ-ফোর (A4) প্রিন্ট/এক্সপোর্ট অপশন সংবলিত টেবিল স্ট্যান্ডার্ড।

### B. Form Standards (`AppForm`)
- প্রতিটি ফর্মে Zod Schema ভ্যালিডেশন, ইনপুট ফিল্ডের সঠিক এরর মেসেজ রেন্ডারিং, লোডিং স্পিনার ও রিসেট/সাবমিট বাটন লজিক।

---

## 6. Performance Benchmarks (Lighthouse ≥ 95)
- Skeleton Loaders (ব্লাঙ্ক স্ক্রিন সম্পূর্ণ নিষিদ্ধ)
- dynamic import() দ্বারা রুট লেভেলে কোড স্প্লিটিং
- ইমেজ ও সিএসএস অ্যারাইভাল অপটিমাইজেশন

---

## 7. Verification & 20-Point Completion Condition
Frontend Design System বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] সমস্ত পোর্টালে একই কালার প্যালেট, ইন্টার টাইপোগ্রাফি ও থিম ইঞ্জিন সক্রিয় থাকবে।
- [ ] ২৬টি রিইউজেবল **App* Components** ডুপ্লিকেট ছাড়া সঠিকভাবে ব্যবহৃত হবে।
- [ ] ডার্ক মোড এবং লাইট মোড পেজ রিলোড ছাড়াই মসৃণভাবে সুইচ করবে।
- [ ] WCAG 2.2 AA এক্সেসিবিলিটি (কীবোর্ড ন্যাভিগেশন, অরিয়া লেবেল) পাস করবে।
- [ ] মোবাইল, ট্যাবলেট ও ডেসক্টপ ভিউতে রেসপন্সিভ কার্ড ও গ্রিড রেন্ডার করবে।
- [ ] Google Lighthouse Performance & Accessibility Score ≥ 95 হবে।
- [ ] কোনো Inline Styles বা Hardcoded Hex Colors থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
