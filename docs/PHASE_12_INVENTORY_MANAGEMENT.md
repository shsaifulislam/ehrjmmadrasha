# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## EHRJ Madrasha Digital Campus & ERP
### PHASE 12 — INVENTORY, ASSET & PROCUREMENT MANAGEMENT ENGINE ARCHITECTURE & SPECIFICATION

---

## ১. ভূমিকা ও উদ্দেশ্য (Overview & Objectives)
ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার প্রাতিষ্ঠানিক সামগ্রী, শিক্ষা উপকরণ, স্টেশনারি, কিতাব, পরিষ্কার-পরিচ্ছন্নতা দ্রব্যাদি, রান্নাঘর ও বোর্ডিং রসদ, ইলেকট্রনিক ও হার্ডওয়্যার এবং স্থায়ী সম্পদ (Asset) সুষ্ঠুভাবে পরিচালনা, ট্র্যাকিং ও অডিট নিশ্চিত করার লক্ষ্যে **Phase 12: Inventory, Asset & Procurement Management Engine** বাস্তবায়িত হয়েছে।

এটি কোনো বাণিজ্যিক ওয়্যারহাউস লজিস্টিক সিস্টেম নয়, বরং একটি সুশৃঙ্খল **প্রাতিষ্ঠানিক অ্যাকাডেমিক ক্যাম্পাস ইনভেন্টরি ও এসেট রেজিস্টার**।

---

## ২. মূল স্থাপত্য ও নীতিমালা (Architecture Principles)

### ক. ফাইন্যান্স কর্তৃত্ব অক্ষুণ্ণ রাখা (Finance System Primacy)
- Phase 6 ফাইন্যান্স ইঞ্জিন প্রতিষ্ঠানের নগদ, তহবিল ও লেজারের একমাত্র অনুমোদিত হিসাবরক্ষণ ব্যবস্থা।
- ইনভেন্টরি ও প্রকিউরমেন্ট মডিউল কোনো দ্বিতীয় ক্যাশলেজার পরিচালনা করে না।
- প্রকিউরমেন্ট রিসিভিং বা সম্পদ নিষ্পত্তি হতে আর্থিক সমন্বয় সরাসরি Phase 6-এর অনুমোদিত ব্যয় (Expense/Voucher) পদ্ধতির মাধ্যমে সংগঠিত হয়।

### খ. কঠোর ঋণাত্মক স্টক প্রতিরোধ (Negative Stock Prevention)
- ডিফল্ট ও অলঙ্ঘনীয় নিয়ম: **নেগেটিভ স্টক গ্রহণযোগ্য নয়**।
- কোনো লোকেশন বা সামগ্রীর ব্যালেন্স যদি উত্তোলনের পরিমাণের চেয়ে কম থাকে, ডাটাবেস লেভেলে ট্রানজেকশন রোলব্যাক হবে এবং স্পষ্ট বার্তা প্রদর্শন করবে।

### গ. অপরিবর্তনীয় ঐতিহাসিক অডিট লেজার (Historical Immutability)
- পোস্টকৃত স্টক ট্রানজেকশন, পারচেজ অর্ডার বা জিআরএন রেকর্ড সরাসরি মুছে ফেলা বা এডিট করা যায় না।
- সংশোধনের জন্য রিভার্সাল, কাউন্টার-অ্যাডজাস্টমেন্ট এবং অডিট ট্রেইল বাধ্যতামূলক।

### ঘ. ভূমিকা ও প্রবেশাধিকার (Role Architecture)
- **ADMIN**: সম্পূর্ণ ইনভেন্টরি, পারচেজ রিকোয়েস্ট অনুমোদন, পারচেজ অর্ডার ইস্যু, জিআরএন গ্রহণ, সম্পদ নিবন্ধন, বরাদ্দ, মেরামত ও নিষ্পত্তির কর্তৃত্ব।
- **PRINCIPAL**: ইনভেন্টরি সারসংক্ষেপ, সম্পদ স্থিতি, ক্রয় ও ব্যয়ের সার্বিক ওভারসাইট।
- **TEACHER**: কেবল নিজেদের জিম্মায় থাকা বরাদ্দকৃত সম্পদ ও প্রাতিষ্ঠানিক সরঞ্জামের বিবরণ দেখার রিড-অনলি অ্যাক্সেস।
- **GUARDIAN**: ইনভেন্টরি বা প্রাতিষ্ঠানিক সরঞ্জামে প্রবেশাধিকার নেই।

---

## ৩. ডাটাবেস স্কিমা (Prisma Models)

| মডেলের নাম | ভূমিকা |
| :--- | :--- |
| `InventoryCategory` | সামগ্রীর শ্রেণি (স্টেশনারি, আইটি, ইলেকট্রিক্যাল, আসবাবপত্র ইত্যাদি) |
| `InventoryLocation` | ক্যাম্পাসের অভ্যন্তরীণ সংরক্ষণাগার (প্রধান স্টোর, লাইব্রেরি, ল্যাব, রান্নাঘর ইত্যাদি) |
| `InventoryItem` | মাস্টার আইটেম রেকর্ড (আইটেম কোড `EHRJ-INV-YYYY-XXXX`, ইউনিট, ন্যূনতম স্টক) |
| `InventoryStockBalance` | আইটেম ও লোকেশনভিত্তিক বর্তমান মজুত ও মোট ইন/আউট ব্যালেন্স |
| `InventoryTransaction` | স্টক পরিবর্তনের অপরিবর্তনীয় খতিয়ান (`PURCHASE_IN`, `ISSUE_OUT`, `TRANSFER`, `ADJUSTMENT`) |
| `Supplier` | মালামাল সরবরাহকারী প্রতিষ্ঠানের তথ্য ও কোড (`EHRJ-SUP-YYYY-XXXX`) |
| `PurchaseRequest` | অভ্যন্তরীণ ক্রয় চাহিদা আবেদন ও প্রশাসনিক অনুমোদন প্রক্রিয়া |
| `PurchaseRequestItem` | ক্রয় আবেদনের অন্তর্ভুক্ত পণ্যের তালিকা ও আনুমানিক ব্যয় |
| `PurchaseOrder` | সরবরাহকারী বরাবর আনুষ্ঠানিক পারচেজ অর্ডার (`EHRJ-PO-YYYY-XXXX`) |
| `PurchaseOrderItem` | অর্ডারের আইটেম, দর, পরিমাণ ও আংশিক রিসিভ ট্র্যাকিং |
| `GoodsReceipt` | মালামাল গ্রহণের চালান বা জিআরএন (`EHRJ-GRN-YYYY-XXXX`) |
| `GoodsReceiptItem` | চালানে গ্রহণকৃত, ক্ষতিগ্রস্ত ও গৃহীত পণ্যের হিসাব |
| `InventoryAsset` | দীর্ঘস্থায়ী সম্পদ নিবন্ধন ও বারকোড/কিউআর টোকেন (`EHRJ-AST-YYYY-XXXX`) |
| `AssetAssignmentHistory` | সম্পদের দায়িত্ব হস্তান্তর ও ব্যবহারকারী ট্র্যাকিং খতিয়ান |
| `AssetConditionHistory` | সম্পদের অবস্থা রূপান্তর (নতুন, ভালো, মেরামতযোগ্য, বিনষ্ট, নিষ্পত্তিকৃত) |
| `InventorySequence` | কনকারেন্সি-সেফ ইউনিক ক্রমিক কোড জেনারেটর |

---

## ৪. প্রকিউরমেন্ট ও স্টক ওয়ার্কফ্লো (Lifecycle Workflows)

```
[অভ্যন্তরীণ চাহিদা]
       │
       ▼
Purchase Request (DRAFT / SUBMITTED) ──► ADMIN Review (APPROVED / REJECTED)
                                                        │
                                                        ▼
                                              Purchase Order (ORDERED)
                                                        │
                                                        ▼
                                              Goods Receipt (GRN)
                                         (আংশিক / পূর্ণাঙ্গ ডেলিভারি)
                                                        │
                                     ┌──────────────────┴──────────────────┐
                                     ▼                                     ▼
                             [গৃহীত স্টক-ইন]                       [ক্ষতিগ্রস্ত পণ্য ফেরত]
                                     │
                                     ▼
                          InventoryStockBalance (+Qty)
                                     │
                                     ▼
                          Finance Expense Integration
```

---

## ৫. সম্পদ রেজিস্ট্রি ও কিউআর যাচাই (Asset & QR Security)

1. **ইউনিক কোড**: প্রতিটি দীর্ঘস্থায়ী সম্পদের জন্য তৈরি হয় অনন্য কোড (যেমন: `EHRJ-AST-2026-0001`)।
2. **ক্রিপ্টোগ্রাফিক কিউআর টোকেন**: পাবলিক কিউআর কোডের মাধ্যমে যেকোনো মোবাইল স্ক্যানারে সম্পদের প্রাতিষ্ঠানিক বৈধতা যাচাই করা যায়।
3. **গোপনীয়তা রক্ষা (Privacy-Safe Representation)**: পাবলিক ভেরিফিকেশন পেজে (`/inventory/verify/asset/[token]`) কেবল সামগ্রীর নাম, অবস্থান ও অবস্থা প্রদর্শিত হয়; অভ্যন্তরীণ ক্রয়মূল্য, ভাউচার বা দায়িত্বপ্রাপ্ত ব্যক্তির পরিচয় উন্মুক্ত করা হয় না।

---

## ৬. নোটিফিকেশন ইন্টিগ্রেশন (Phase 8 Communication Engine)

নিম্নোক্ত ইভেন্টসমূহে স্বয়ংক্রিয়ভাবে পোর্টাল নোটিফিকেশন ও এসএমটিপি ইমেইল প্রেরিত হয়:
1. `INVENTORY_LOW_STOCK`: ন্যূনতম স্টক সীমার নিচে নামলে অ্যাডমিনকে সতর্কবার্তা।
2. `PROCUREMENT_REQUEST_SUBMITTED`: নতুন ক্রয় আবেদন দাখিল হলে দায়িত্বশীলদের অবগতকরণ।
3. `PROCUREMENT_REQUEST_APPROVED`: আবেদন অনুমোদিত হলে আবেদনকারীকে অবহিতকরণ।
4. `PROCUREMENT_REQUEST_REJECTED`: আবেদন বাতিল হলে কারণসহ বিজ্ঞপ্তি।
5. `PROCUREMENT_GOODS_RECEIVED`: নতুন মালামাল চালানে গৃহীত হলে নিশ্চিতকরণ।
6. `ASSET_DAMAGED_OR_LOST`: কোনো সম্পদ ক্ষতিগ্রস্ত বা হারিয়ে গেলে প্রশাসনিক জরুরি অ্যালার্ট।

---

## ৭. এপিআই এন্ডপয়েন্ট তালিকা (API Endpoints)

### অ্যাডমিন ইনভেন্টরি ও স্টক
- `GET /api/admin/inventory/stats` — সামগ্রিক ড্যাশবোর্ড পরিসংখ্যান
- `GET, POST /api/admin/inventory/categories` — ক্যাটাগরি তালিকা ও সৃষ্টি
- `PUT /api/admin/inventory/categories/[id]` — ক্যাটাগরি হালনাগাদ
- `GET, POST /api/admin/inventory/locations` — লোকেশন তালিকা ও সংযোজন
- `PUT /api/admin/inventory/locations/[id]` — লোকেশন হালনাগাদ
- `GET, POST /api/admin/inventory/items` — আইটেম মাস্টার ও প্রারম্ভিক স্টক
- `GET, PUT /api/admin/inventory/items/[id]` — আইটেম বিবরণ ও এডিট
- `GET /api/admin/inventory/stock/balances` — বর্তমান মজুত খতিয়ান
- `POST /api/admin/inventory/stock/in` — লেনদেনভিত্তিক স্টক-ইন
- `POST /api/admin/inventory/stock/out` — স্টক উত্তোলন (নেগেটিভ স্টক গার্ডসহ)
- `POST /api/admin/inventory/stock/transfer` — অভ্যন্তরীণ আন্তঃশাখা স্থানান্তর
- `POST /api/admin/inventory/stock/adjust` — ভৌত গণনাভিত্তিক স্টক সমন্বয়
- `GET /api/admin/inventory/stock/transactions` — অপরিবর্তনীয় স্টক খতিয়ান

### প্রকিউরমেন্ট ও সরবরাহকারী
- `GET, POST /api/admin/inventory/suppliers` — সরবরাহকারী তালিকা ও নিবন্ধন
- `PUT /api/admin/inventory/suppliers/[id]` — সরবরাহকারী তথ্য পরিমার্জন
- `GET, POST /api/admin/inventory/procurement/requests` — ক্রয় আবেদন তালিকা ও নতুন দাখিল
- `POST /api/admin/inventory/procurement/requests/[id]/review` — আবেদন অনুমোদন/প্রত্যাখ্যান
- `GET, POST /api/admin/inventory/procurement/orders` — পারচেজ অর্ডার তৈরি ও ইস্যু
- `POST /api/admin/inventory/procurement/orders/[id]/receive` — মালামাল চালান গ্রহণ (GRN)

### সম্পদ ব্যবস্থাপনা ও শিক্ষক প্যানেল
- `GET, POST /api/admin/inventory/assets` — স্থায়ী সম্পদ নিবন্ধন ও ফিল্টার
- `GET /api/admin/inventory/assets/[id]` — সম্পদের পূর্ণাঙ্গ ইতিহাস ও অ্যাসাইনমেন্ট
- `POST /api/admin/inventory/assets/[id]/assign` — দায়িত্ব হস্তান্তর ও পুনঃবরাদ্দ
- `POST /api/admin/inventory/assets/[id]/condition` — মেরামত বা অবস্থা পরিবর্তন
- `POST /api/admin/inventory/assets/[id]/dispose` — নিরাপদ সম্পদ নিষ্পত্তি
- `GET /api/teacher/inventory/assets` — শিক্ষকের জন্য বরাদ্দকৃত সম্পদের অবলোকন
- `GET /api/public/inventory/verify/asset/[token]` — উন্মুক্ত ডিজিটাল কিউআর যাচাই

---

## ৮. টেস্ট ও ভেরিফিকেশন প্রমাণ (Verification Evidence)

- **TypeScript Typecheck (`npx tsc --noEmit`)**: ০ ত্রুটি (Clean Pass)।
- **Phase 12 Integration Test (`scratch/test_phase12_api.mjs`)**: ৪৫ টি টেস্টের মধ্যে ৪৫ টি পাস (100% Pass)।
- **Endpoint Security Test (`scratch/test_phase12_endpoints.mjs`)**: ৪ টি টেস্টের ৪ টি পাস (100% Pass)।
- **Phase 12 Regression Suite (`scripts/test_phase12_inventory.js`)**: ৩৮ টি টেস্টের ৩৮ টি পাস (100% Pass)।
- **Phase 10 Hostel Engine Regression (`scripts/test_phase10_hostel.js`)**: ৬৭ টি টেস্টের ৬৭ টি পাস (100% Pass)।
- **Phase 9 Library Engine Regression (`scripts/test_phase9_library.js`)**: ৫০ টি টেস্টের ৫০ টি পাস (100% Pass)।
- **Next.js Production Build (`npm run build`)**: সংকলিত এবং ১০৩টি স্ট্যাটিক পেজ সফলভাবে অপ্টিমাইজড (Exit Code: 0)।
