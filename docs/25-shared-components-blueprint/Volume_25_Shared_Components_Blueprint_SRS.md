# Volume 25 – Shared Component Library Specification (EHRJ-SRS-V25)

**Document Code:** EHRJ-SRS-V25  
**Module:** Shared Component Library Specification  
**Applies To:** Entire ERP Frontend, Admin ERP, Student Portal, Teacher Portal, Guardian Portal  

---

## 1. Purpose & Component Generic Architecture
Shared Component Library Specification হলো ERP-এর সমস্ত পুনঃব্যবহারযোগ্য UI কম্পোনেন্টের অফিসিয়াল কারিগরি নির্দেশিকা।
- কোনো মডিউল বা পোর্টাল নিজস্ব আলাদা Table, Button, Modal, Search বা Input Element তৈরি করতে পারবে না।
- সমস্ত কম্পোনেন্ট অবশ্যই জেন্যারিক নাম (`AppButton`, `AppTable`, `AppForm`) অনুসরণ করবে (যেমন: `StudentButton` বা `TeacherTable` সম্পূর্ণ নিষিদ্ধ)।

```text
frontend/src/components/shared/
  ├── AppButton/        (Variants, Sizes, Loading, Disabled States)
  ├── AppInput/         (Text, Password, Phone, Validation, Prefix/Suffix)
  ├── AppTextarea/      (Auto Resize, Character Counter)
  ├── AppSelect/        (Single, Multi, Async Search Options)
  ├── AppForm/          (React Hook Form + Zod Auto Error Handling)
  ├── AppTable/         (Server Pagination, Sorting, Search, Filters, CSV/PDF/Print)
  ├── AppModal/         (Focus Trap, ESC Close, Fullscreen, Responsive)
  ├── AppDrawer/        (Left, Right, Bottom, Top Sliders)
  ├── AppSearch/        (Debounced Global & Module Search Engine)
  ├── AppFilter/        (Dynamic Multi-Criteria Filtering Panel)
  ├── AppStats/         (KPI Cards, Trends, Percentages, Mini Charts)
  ├── AppTimeline/      (Audit History, Event Logs with Avatar & Badge)
  ├── AppUploader/      (Drag & Drop, Progress Bar, WebP & PDF Previews)
  ├── AppPDF/AppPrint/  (Printable Canvas, Letterhead, QR/Barcode Injection)
  ├── AppPermission/    (RBAC Wrapper: <AppPermission permission="student.create">)
  └── AppExport/Import/ (CSV, Excel, PDF Exporting & Rollback Import Validation)
```

---

## 2. Mandatory Component Standards & Rules
1. **TypeScript First:** প্রতিটি কম্পোনেন্টের জন্য সুনির্দিষ্ট Props Interface এবং Type Definitions থাকবে।
2. **Accessibility (WCAG 2.2 AA):** কীবোর্ড ফোকাস ট্র্যাপ (`Focus Trap`), ESC কি ক্লোজ এবং অরিয়া লেবেল (`aria-label`) বাধ্যতামূলক।
3. **Multi-Theme & Responsive:** ডার্ক মোড, মোশন কমানো (Reduced Motion) এবং রেসপন্সিভ ব্রেকপয়েন্টস শতভাগ সাপোর্টেড।
4. **RBAC Integration (`AppPermission` Wrapper):** বাটনে পারমিশন চেক রাপ করা থাকবে যাতে অননুমোদিত ইউজার বাটন দেখতে বা চাপতে না পারে।

---

## 3. High-Impact Shared Component Contracts

### A. AppTable Specifications
- **Core Features:** Server-Side Pagination (`page`, `limit`), Column Sorting (`sort`, `order`), Debounced Search, Custom Multi-Filter Drawer, Sticky Header/Actions Column, Responsive Card View for Mobile.
- **Export & Print Integration:** ১-ক্লিকে CSV/Excel এক্সপোর্ট এবং A4 সাইজে প্রিন্টিং কাস্টমাইজেশন।

### B. AppForm Specifications
- **Core Features:** React Hook Form ইন্টিগ্রেশন, Zod Schema Type-safe ভ্যালিডেশন, অটোমেটিক ইনপুট এরর হাইলাইটিং, ডায়নামিক অন-দ্য-ফ্লাই ফিল্ড অ্যারেইজ, কন্ডিশনাল ভিজিবিলিটি এবং রিসেট/সাবমিট বাটন লোডিং স্টেট।

### C. AppPermission RBAC Guard Component
```tsx
<AppPermission permission="finance.invoice.create">
  <AppButton variant="primary">Create Invoice</AppButton>
</AppPermission>
```

---

## 4. Verification & 20-Point Completion Condition
Shared Component Library বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ৩০+ **App*** জেন্যারিক কম্পোনেন্ট `frontend/src/components/shared/` ডিরেক্টরিতে সংসংস্থাপিত থাকবে।
- [ ] কোনো মডিউল নিজস্ব কাস্টম টেবিল, বাটন বা ফর্ম কম্পোনেন্ট তৈরি করবে না।
- [ ] `AppPermission` অননুমোদিত রোলকে বাটন হাইড/ডিজেবল করবে।
- [ ] `AppTable` সার্ভার-সাইড পেজিনেশন, ফিল্টারিং ও এক্সপোর্ট নির্ভুল সম্পাদন করবে।
- [ ] `AppModal` ফোকাস ট্র্যাপ এবং ESC কি ক্লোজ ভ্যালিডেশন পাস করবে।
- [ ] ডার্ক মোড এবং লাইট মোড ইন্টারফেসের সমস্ত কম্পোনেন্টে কাজ করবে।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
