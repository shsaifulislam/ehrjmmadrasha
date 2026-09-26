---
name: EHRJ Madrasha Digital Campus Design System
colors:
  surface: '#ffffff'
  surface-dim: '#f3f4f6'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f8f3'
  surface-container: '#f1efe9'
  surface-container-high: '#e8e5dc'
  surface-container-highest: '#ded9cd'
  on-surface: '#0b1914'
  on-surface-variant: '#4b5563'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  surface-tint: '#0d5c3a'
  primary: '#0d5c3a'
  on-primary: '#ffffff'
  primary-container: '#13754b'
  on-primary-container: '#ffffff'
  secondary: '#c59b27'
  on-secondary: '#0b1914'
  secondary-container: '#f3e5ab'
  on-secondary-container: '#443305'
  error: '#dc2626'
  on-error: '#ffffff'
  background: '#f9f8f3'
  on-background: '#0b1914'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  title-md:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 20px
---

# Design System: EHRJ Madrasha Digital Campus

## 1. Visual Atmosphere & Brand Philosophy
A prestigious, dignified, and serene Qawmi Madrasa Digital Campus and Integrated ERP Management platform. The aesthetic bridges timeless Islamic institutional values with modern academic management precision. Warm ivory surfaces reduce visual fatigue during prolonged administrative tasks, while rich Islamic Madrasah Emerald (#0D5C3A) and refined Gold Leaf accents (#C59B27) establish authoritative trust, religious reverence, and institutional prestige.

## 2. Color Calibration & Functional Roles
- **Madrasah Emerald (#0D5C3A):** Primary identity, top navigation, active sidebar tabs, primary submit actions, and verified academic badges.
- **Ivory Canvas (#F9F8F3):** Grounding background surface for portal pages and management dashboards.
- **Pure Surface (#FFFFFF):** Container for cards, tables, forms, and modals.
- **Charcoal Slate (#0B1914):** High-contrast typography for headings and student records.
- **Gold Leaf Accent (#C59B27):** Distinction markers, Mumtaz grade badges, and donation CTAs.
- **Muted Sage (#4B5563):** Subheadings, table column headers, and helper text.
- **Whisper Border (#E2E8F0):** Precise structural boundaries.

## 3. Typography Architecture
- **English Display & Navigation:** Outfit (weights 600, 700) - clean, geometry-inspired, authoritative.
- **Body & Data Records:** Inter (weights 400, 500) - optimal legibility across mobile and desktop viewports.
- **Bangla Script:** Hind Siliguri and Noto Sans Bengali for authentic, clipped-free Bengali rendering.
- **Arabic Inscriptions:** Amiri with native RTL support for Quranic Ayahs, Hadith references, and Jamat names.
- **Numeric & Codes:** JetBrains Mono for Student IDs (e.g. EHRJ-000001), BDT Currency (৳), Roll numbers, and Transaction Hashes.

## 4. Component Specifications
- **Navigation Bar:** Deep Emerald (#0D5C3A) with gold crest emblem, trilingual language switcher (বাংলা / العربية / English), and clean quick-access action buttons.
- **Stats & Metric Cards:** Pure white (#FFFFFF) with 1px border (#E2E8F0), soft ambient shadow, left emerald accent line, and large readable numbers.
- **Student & Attendance Tables:** High-contrast rows, roll-number ordering, instantaneous status toggles (Present, Absent, Late, Leave), and sticky headers.
- **Admit & ID Cards:** Standard CR80 and A4 formats with QR verification badges and student portrait placeholders.

## 5. Anti-Patterns (Banned)
- No emojis anywhere in official admin records or certificates.
- No AI purple/neon glow gradients.
- No pure black (#000000).
- No generic placeholder names or arbitrary test figures.
