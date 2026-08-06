# Volume 29 – Developer Handbook (EHRJ-SRS-V29)

**Document Code:** EHRJ-SRS-V29  
**Module:** Developer Handbook & AI Agent Operating Rules  
**Applies To:** All Human Developers, AI Coding Assistants, Code Reviewers, Contributors  

---

## 1. Purpose & Official Development Standard
Developer Handbook হলো EHRJ Madrasha ERP-এ কাজ করা সকল ডেভেলপার ও AI এআই এজেন্টদের জন্য বাধ্যতামূলক বিকাশ সংবিধান (Official Development Constitution)।
- কোনো কোড বা পিআর (Pull Request) এই হ্যান্ডবুকের নীতি অনুসরণ না করলে তা পর্যালোচনা বা কোডবেসে মার্জের জন্য গ্রহণযোগ্য হবে না।

```text
Requirement ➔ Repository Pre-Scan ➔ Architecture Check ➔ Service Layer Business Logic ➔ Shared Component Reuse ➔ Strict TypeScript (<any> Forbidden) ➔ Unit/API/Playwright Tests ➔ Truthful Evidence Log ➔ Pull Request
```

---

## 2. Core Architectural Principles & Naming Standards

### A. Layering Rules & Repository Isolation
- **Controller Rules:** কন্ট্রোলার শুধু রিকোয়েস্ট রিসিভ, Zod DTO স্কিমা ভ্যালিডেশন এবং সার্ভিস লেয়ারের মেথড কল করবে। কন্ট্রোলার থেকে সরাসরি ডাটাবেস এক্সেস সম্পূর্ণ নিষিদ্ধ।
- **Service Layer Rules:** সমস্ত বিজনেস লজিক শুধুমাত্র **Service Layer**-এ থাকবে।

### B. Strict Code Naming Standards
- **Files:** `StudentCard.tsx`, `student.service.ts`, `student.controller.ts`, `student.routes.ts`, `student.schema.ts`.
- **Symbols:** Variables & Functions (`camelCase`), Classes & Types (`PascalCase`), Constants (`UPPER_SNAKE_CASE`).
- **TypeScript:** `any` টাইপ ব্যবহার সম্পূর্ণ নিষিদ্ধ। `interface`, `type` এবং `Generics` ব্যবহার করতে হবে।

---

## 3. Shared Component Reuse & UI Rules
- **No Duplication:** কোনো কাস্টম বাটন, ইনপুট বা টেবিল বানানোর আগে `components/shared/`-এ রিইউজেবল **App*** কম্পোনেন্ট রি-ইউজ নিশ্চিত করতে হবে।
- **Mandatory Page Structure:** প্রতিটি পেজে Header, Breadcrumb, Search, Filter, Stats, Table/Card, Pagination, Skeleton Loader, Empty State এবং Error State অন্তর্ভুক্ত থাকবে।

---

## 4. Mandatory 10 AI Agent Operating Rules
1. **Pre-Scan First:** যেকোনো নতুন কাজ শুরু করার পূর্বে রিাপজিটরির বিদ্যমান ফাইল, কম্পোনেন্ট ও মেথড স্ক্যান করা বাধ্যতামূলক।
2. **No Duplication:** বিদ্যমান কোডের প্রতিলিপি বা ডুপ্লিকেট ইউআই তৈরি সম্পূর্ণ নিষিদ্ধ।
3. **No Hardcoded/Mock Data:** ডাটাবেস চালিত রিয়েল ডাইনামিক ফিল্ড ব্যাতীত কোনো ফেক বা মক ডাটা নিষিদ্ধ।
4. **No Placeholders:** কোডে `TODO`, `Mock Data` বা `Coming Soon` রাখা নিষিদ্ধ।
5. **Component Reusability:** রিইউজেবল Shared Component Library ব্যবহার বাধ্যতামূলক।
6. **Strict Architecture Layering:** কন্ট্রোলার থেকে ডাটাবেস কল নিষিদ্ধ, সার্ভিস লেয়ার ব্যবহার করতে হবে।
7. **Holistic Feature Development:** RBAC, Audit Log, Notification ও Validation প্রতিটি ফিচারে অন্তর্ভুক্ত থাকতে হবে।
8. **Definition of Done:** টাইপস্ক্রিপ্ট ক্লিন বিল্ড, প্লে-রাইট ই-টু-ই টেস্ট এবং স্ক্রিনশট/ভিডিও এভিডেন্স ছাড়া কোনো মডিউল সম্পন্ন ঘোষণা নিষিদ্ধ।
9. **Sequential Integrity:** পূর্বের মডিউল ১০০% সম্পন্ন না করে পরবর্তী মডিউল ধরা নিষিদ্ধ।
10. **SRS Supreme Directive:** কোড সব সময় SRS অনুসরণ করবে, SRS কখনো কোডের জন্য পরিবর্তিত হবে না।

---

## 5. Verification & 20-Point Completion Condition
Developer Handbook বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] সমস্ত ব্যাকএন্ড ফাইল Controller ➔ Service ➔ Repository লেয়ারিং মেনে চলবে।
- [ ] TypeScript `strict: true` বজায় থাকবে এবং `any` টাইপ শূন্য থাকবে।
- [ ] Git Conventional Commits (`feat:`, `fix:`, `refactor:`) অনুসরণ করবে।
- [ ] ২৬টি রিইউজেবল **App*** কম্পোনেন্ট ডুপ্লিকেট ছাড়া ব্যবহৃত হবে।
- [ ] অডিট লগিং এবং এরর স্যানিটাইজেশন প্রতি এন্ডপয়েন্টে থাকবে।
- [ ] AI এজেন্ট ট্রুথফুল বিল্ড ও টেস্ট এভিডেন্স প্রদান করবে।
- [ ] কোনো Hardcoded Passwords, Temporary Shortcuts বা Placeholders থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
