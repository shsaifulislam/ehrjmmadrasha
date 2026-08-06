# Volume 02 – Complete Public Website SRS

## 1. Purpose
Public Website হবে Madrasha-এর Official Digital Identity।
Website-এর প্রতিটি তথ্য Database এবং CMS থেকে Dynamic হবে।
- Hardcoded Text, Dummy Data বা Placeholder ব্যবহার করা যাবে না।
- Website Responsive, SEO Friendly, Secure এবং High Performance হতে হবে।

---

## 2. Website Objectives
Website-এর মাধ্যমে Visitor যেন করতে পারে:
- Madrasha সম্পর্কে জানতে
- Online Admission করতে
- Admission Status Track করতে
- Result দেখতে
- Routine দেখতে
- Notice পড়তে
- News পড়তে
- Gallery দেখতে
- Teacher List দেখতে
- Staff List দেখতে
- Committee দেখতে
- Download করতে
- Contact করতে
- Donation করতে
- Student Verification করতে
- Certificate Verification করতে

---

## 3. User Types
- **Guest:** সব Public Page দেখতে পারবে।
- **Applicant:** Admission Submit, Admission Track, Receipt Download।
- **Student:** Student Portal Login।
- **Teacher:** Teacher Portal Login।
- **Guardian:** Guardian Portal Login।
- **Admin:** CMS & Whole ERP System Manage।

---

## 4. Complete Website Sitemap
```text
/
├── /about
├── /history
├── /founder
├── /principal-message
├── /president-message
├── /committee
├── /managing-committee
├── /teachers
├── /staff
├── /departments
├── /classes
├── /academic
├── /academic-calendar
├── /routine
├── /exams
├── /results
├── /result
├── /result/search
├── /admission
│   ├── /admission/apply
│   ├── /admission/track
│   ├── /admission/requirements
│   ├── /admission/fees
│   ├── /admission/seat-plan
│   └── /admission/faq
├── /notices
│   └── /notices/[slug]
├── /news
│   └── /news/[slug]
├── /events
├── /gallery
│   ├── /gallery/photos
│   └── /gallery/videos
├── /downloads
├── /library
├── /facilities
├── /hostel
├── /transport
├── /achievements
├── /alumni
├── /career
├── /donation
├── /contact
├── /faq
├── /privacy-policy
├── /terms
├── /search
├── /sitemap.xml
├── /robots.txt
└── /feed
```

---

## 5. Homepage Structure (Sections & Order)
1. **Top Bar & Header:** Logo, Institute Name, Phone, Email, Address, Language Switch, Search, Portal Buttons, Sticky Navigation.
2. **Hero Slider:** Dynamic CMS, Multiple Slides, Background Image/Video Support, Auto Slider, Admission CTA, Notice CTA.
3. **Welcome Section:** Principal Message, Short Introduction, Read More Link.
4. **Quick Statistics (DB Driven):** Active Students, Teachers, Staff, Departments, Library Books, Establishment Years, Success Rate.
5. **Admission Banner:** Real-time Admission Status (Open/Closed), Apply Now CTA, Track Application CTA.
6. **Latest Notices:** Top 10 Notice List, Pin Notice Feature, Category/Important Badge, View All Link.
7. **Latest News:** Featured News Cards, Category, Author, Date, Read More.
8. **Events Section:** Upcoming & Past Events, Interactive Calendar Widget.
9. **Academic Programs:** Hifz, Nazera, Kitab, General, Vocational Overview.
10. **Facilities Highlight:** Library, Hostel, Transport, ICT Lab, Mosque, Playground, Auditorium.
11. **Featured Teachers:** Teacher Cards (Image, Qualification, Department).
12. **Gallery Showcase:** Latest Photos & Video Carousel.
13. **Testimonials:** Students, Parents, Alumni Feedback Cards.
14. **Dynamic FAQ:** Accordion-style Searchable FAQ.
15. **Contact CTA & Footer:** Map, Phone, Quick Links, Useful Links, Emergency Contact, Copyright, Developer Credit.

---

## 6. Header Standard
- **Layout:** Desktop, Tablet, Mobile Breakpoints.
- **Features:** Sticky Navigation, Mega Menu Support, Search Modal Trigger, Notification Badge, Admission CTA, Portal Login Modal/Links, Dark Mode Toggle, Language Switcher.

---

## 7. Footer Standard
- Quick Links & Useful Links
- Departments & Academic Links
- Admission & Downloads Shortcuts
- Gallery & Photo Links
- Social Media Handles
- Embedded Google Map
- Newsletter Subscription
- Emergency Contacts & Helplines
- Copyright notice, System Version & Credits

---

## 8. CMS Driven Pages
সমস্ত পাবলিক কনটেন্ট ডাটাবেস ও এডমিন সিএমএস থেকে লোড হবে:
- Hero Sliders, Notice Board, Gallery, News & Articles, FAQs, Committees, Teachers, Staff, Downloads, History, Mission & Vision, Facilities, Achievements, Events, Admission Notices.

---

## 9. Dynamic Search Engine
Search Capability Across:
- Notice, News, Teachers, Student Verification, Certificate Verification, Downloads, Gallery, FAQ, Admissions.

---

## 10. SEO Standard
প্রতিটি পেজের জন্য অটোমেটিক এবং কাস্টম মেটাডাটাসমূহ:
- Title, Meta Description, Keywords, Canonical Link
- Open Graph (OG) Tags, Twitter Cards
- JSON-LD Structured Data (Breadcrumb Schema, Organization Schema, Local Business Schema)

---

## 11. Performance Benchmarks
- Next.js Image Optimization (`<Image />`)
- Lazy Loading for Heavy Components & Images
- Incremental Static Regeneration (ISR) & Server-Side Rendering (SSR)
- Static Site Generation (SSG) where applicable
- Redis Caching Layer for Frequent Queries
- CDN Ready Asset Pipeline

---

## 12. Accessibility Standards
- WCAG 2.2 AA Compliance
- Full Keyboard Navigation Support
- Comprehensive ARIA Labels
- Screen Reader Optimized
- High Contrast Mode Ready
- Focus Indicator Enforcement

---

## 13. Security Standard
- Rate Limiting (Express Rate Limit & Redis)
- Captcha Integration on Forms
- CSRF Token Enforcement
- XSS Protection & Sanitization
- SQL Injection Protection (Prisma Parameterized Queries)
- File Upload Validation (MIME Type, Size, Scan)
- Spam Protection on Contact & Admission Forms

---

## 14. Database Integration & Master Tables Mapped
- `settings`
- `pages`
- `menus`
- `sliders`
- `notices`
- `news`
- `events`
- `galleries` & `gallery_categories`
- `downloads`
- `faqs`
- `teachers` & `staff`
- `committees`
- `facilities`
- `admissions`
- `classes` & `departments`
- `academic_sessions`
- `routines`, `exams`, `results`
- `testimonials`
- `contacts` & `donations`
- `social_links` & `seo_meta`

---

## 15. REST API Integration Contracts
Frontend uses REST APIs exclusively:
- `GET /api/v1/public/home`
- `GET /api/v1/public/notices`
- `GET /api/v1/public/news`
- `GET /api/v1/public/gallery`
- `GET /api/v1/public/faqs`
- `GET /api/v1/public/teachers`
- `GET /api/v1/public/staff`
- `GET /api/v1/public/committees`
- `GET /api/v1/public/downloads`
- `GET /api/v1/public/results`
- `POST /api/v1/public/admission/apply`
- `GET /api/v1/public/admission/track/:trackingId`
- `POST /api/v1/public/contact`
- `POST /api/v1/public/donation`
- `GET /api/v1/public/search`
- `GET /api/v1/public/seo/:page`

---

## 16. Responsive Breakpoint Rules
- Desktop (1280px+)
- Laptop (1024px - 1279px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)
*Pixel Perfect Layout Alignment across all breakpoints.*

---

## 17. Acceptance Checklist
- [ ] No page uses hardcoded content; all are 100% CMS/Database driven.
- [ ] All images are optimized with Next.js Image component.
- [ ] 100% links working (Zero broken links, Zero 404s).
- [ ] All APIs connected and responding dynamically.
- [ ] Full SEO Meta and Structured Data present on every page.
- [ ] Performance Score ≥ 95 (Lighthouse Audit).
- [ ] Accessibility Score ≥ 95.
- [ ] 100% Mobile Friendly across all breakpoints.
- [ ] Zero browser console errors.
- [ ] Production build (`npm run build`) passes cleanly.
