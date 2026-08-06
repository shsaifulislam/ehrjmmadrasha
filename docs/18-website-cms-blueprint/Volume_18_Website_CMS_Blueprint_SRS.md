# Volume 18 – Website CMS & Content Management Blueprint (EHRJ-SRS-V18)

**Document Code:** EHRJ-SRS-V18  
**Module:** Website CMS & Content Management Blueprint  
**Applies To:** Content Managers, Public Website, Admin ERP, SEO Engine, Media Library  

---

## 1. Purpose & Core Scope
EHRJ Madrasha ERP-এর পাবলিক ওয়েবসাইটটি (Public Website) সম্পূর্ণরূপে জিরো-কোড সিএমএস (Zero-Code Dynamic CMS) দিয়ে পরিচালিত হবে।
- এডমিন প্যানেলের কোনো কোড পরিবর্তন ছাড়াই ওয়েবসাইট হেডার, মেগা-মেনু, হিরো স্লাইডার, পেজ সেকশন, নোটিশ বোর্ড, নিউজ অ্যান্ড ইভেন্টস, গ্যালারি, ডাউনলোড ক্যাটালগ, ফর্ম বিল্ডার, এসইও মেটাডাটা এবং ভিজ্যুয়াল থিম কালার সরাসরি পরিবর্তন করা যাবে।

```text
Admin CMS Panel ➔ Drag & Drop Page/Menu Builder ➔ Media Library (WebP) ➔ Redis Cache & ISR ➔ Public Next.js Website ➔ Lighthouse Score ≥ 95
```

---

## 2. Core CMS Systems & Engines

### A. Drag & Drop Homepage & Menu Builder
- **Section Ordering:** Hero Slider, Welcome, Principal Message, Stats, Notice Board, News, Events, Academic Programs, Teachers, Facilities, Gallery, Testimonials, FAQ, Admission Banner, Contact, Footer—এডমিন প্যানেল থেকে পছন্দমতো রি-অর্ডার বা হাইড/শো করার অপশন।
- **Mega Menu & Nested Dropdown Builder:** আনলিমিটেড মাল্টি-লেভেল ক্যাটাগরি ও লিংক ড্র্যাগ-অ্যান্ড-ড্রপ সর্টিং।

### B. Media Library & Auto WebP Engine
- **WebP Compression:** সমস্ত ইমেজ আপলোডের সাথে সাথে ব্যাকগ্রাউন্ড কিউতে WebP ফরম্যাটে সংকুচিত ও অপটিমাইজেশন।
- **Asset Vault:** ফোল্ডার স্ট্রাকচার, ট্যাগিং, ফিল্টারিং ও গ্লোবাল সার্চ ক্যাপাবিলিটি।

### C. Central SEO & OpenGraph Manager
- **Dynamic SEO Head:** প্রতিটি পেজের জন্য Meta Title, Description, Keywords, Canonical Link, OpenGraph (OG Image) এবং Twitter Card সেটিংস।
- **Structured Data Generation:** Breadcrumb Schema, Organization Schema, Local Business Schema এবং অটোমেটিক `sitemap.xml` ও `robots.txt` জেনারেশন।

### D. Dynamic Custom Form Builder & Anti-Spam
- **Unlimited Dynamic Forms:** ভর্তি সংক্রান্ত অনুসন্ধান, অভিযোগ, ফিডব্যাক, ক্যরিয়ার ইত্যাদির জন্য ডায়নামিক ফিল্ড যুক্ত ফর্ম তৈরি।
- **Anti-Spam Shield:** CAPTCHA ভ্যালিডেশন এবং বট প্রটেকশন।

---

## 3. Performance Benchmarks (Lighthouse Score ≥ 95)
- Next.js ISR (Incremental Static Regeneration) & Edge Caching
- WebP & Next Image Component Lazy Loading
- Redis Cache Indexing for Public Search Engine

---

## 4. REST API Integration Contracts (23 API Groups)
- `GET /api/v1/cms/homepage`
- `GET /api/v1/cms/hero-sliders`
- `POST /api/v1/cms/hero-sliders`
- `GET /api/v1/cms/menus`
- `POST /api/v1/cms/menus`
- `GET /api/v1/cms/pages`
- `POST /api/v1/cms/pages`
- `GET /api/v1/cms/notices`
- `POST /api/v1/cms/notices`
- `GET /api/v1/cms/news`
- `POST /api/v1/cms/news`
- `GET /api/v1/cms/events`
- `GET /api/v1/cms/gallery`
- `POST /api/v1/cms/gallery`
- `GET /api/v1/cms/downloads`
- `GET /api/v1/cms/faqs`
- `GET /api/v1/cms/contact`
- `POST /api/v1/cms/forms/submit`
- `GET /api/v1/cms/media`
- `POST /api/v1/cms/media/upload`
- `GET /api/v1/cms/seo`
- `GET /api/v1/cms/theme`
- `GET /api/v1/cms/dashboard`

---

## 5. Master Database Entities Mapped (30 Core Entities)
`CMSPage`, `CMSSection`, `HeroSlider`, `Menu`, `MenuItem`, `Notice`, `NoticeCategory`, `News`, `NewsCategory`, `Event`, `Gallery`, `GalleryAlbum`, `Video`, `Download`, `FAQ`, `ContactMessage`, `WebsiteSetting`, `ThemeSetting`, `SEOSetting`, `Widget`, `Form`, `FormField`, `FormSubmission`, `Media`, `MediaFolder`, `SocialLink`, `FooterSetting`, `VisitorLog`, `SearchKeyword`, `Banner`

---

## 6. Verification & 18-Point Completion Condition
Website CMS মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] পাবলিকেশন সাইটের কোনো কনটেন্ট Hardcoded থাকবে না (১০০% সিএমএস চালিত)।
- [ ] ড্র্যাগ-অ্যান্ড-ড্রপ হিরো স্লাইডার ও পেজ বিল্ডার কাজ করবে।
- [ ] মেগা-মেনু এবং নেস্টেড ড্রপডাউন পরিবর্তন সাথে সাথে পাবলিক সাইটে দেখাবে।
- [ ] আপলোডকৃত ইমেজ অটোমেটিক WebP ফরম্যাটে অপটিমাইজড হবে।
- [ ] কন্টাক্ট ফর্ম CAPTCHA এবং Anti-Spam ভ্যালিডেশন পাস করবে।
- [ ] sitemap.xml এবং SEO Structured Data লাইভ ভ্যালিডেশন পাস করবে।
- [ ] Google Lighthouse Performance & Accessibility Score ≥ 95 হবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
