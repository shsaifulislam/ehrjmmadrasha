# Volume 16 – Inventory & Asset Management Blueprint (EHRJ-SRS-V16)

**Document Code:** EHRJ-SRS-V16  
**Module:** Inventory & Asset Management Blueprint  
**Applies To:** Store Management, Procurement, Purchase, Asset Register, Library, Hostel, Maintenance, Finance, Accounting  

---

## 1. Purpose & Inventory Scope
EHRJ Madrasha ERP-এর সমস্ত স্থায়ী সম্পদ (Fixed Assets like Furniture, Computers, Lab Equipment, ACs, Vehicles) এবং নিত্য ব্যবহার্য মালামাল (Consumable Items like Stationary, Cleaning Supplies, Uniforms, Books) কেনাকাটা, রিকুইজিশন, স্টক ওয়্যারহাউজ ট্র্যাকিং, ইস্যু-রিটার্ন, বারকোড/কিউআর ট্র্যাকিং, অবচয় (Depreciation Calculation) এবং হিসাববিজ্ঞানের স্বয়ংক্রিয় পোস্টিং পরিচালনা করা এই মডিউলের উদ্দেশ্য।

```text
Purchase Requisition ➔ Vendor Selection ➔ Purchase Order (PO) ➔ Goods Received Note (GRN) ➔ Barcode/QR Tagging ➔ Stock Warehouse Storage ➔ Department/Student Issue ➔ Asset Depreciation & Accounting Posting
```

---

## 2. Smart Core Engines & Operations

### A. Procurement & Purchase Workflow
- **Vendor Management:** সাপ্লায়ার ক্যাটালগ, রেটিং, ব্যাংক তথ্য ও পাওনা/পেমেন্ট ট্র্যাকিং।
- **PO & GRN Matching:** ক্রয়ের রিকুইজিশন অনুমোদন, পিও জেনারেশন এবং মালামাল প্রাপ্তির পর ইনভয়েস কোয়ান্টিটি চেক।

### B. Barcode / QR Asset Tracking & Issue-Return System
- **Barcode Engine:** প্রতিটি স্থায়ী সম্পদ ও মালামালের জন্য ইউনিক বারকোড/কিউআর স্টিকার তৈরি।
- **Student & Staff Issue Engine:** শিক্ষার্থী, শিক্ষক, হোস্টেল বা বিভাগে মালামাল ও এ্যাসেট ইস্যুকরণ এবং রিটার্নে ক্ষতি বা হারিয়ে যাওয়া রেকর্ড।

### C. Asset Depreciation Engine
- **Methods Supported:** Straight Line Method & Declining Balance Method.
- **Auto Depreciation Ledger:** নির্দিষ্ট অর্থবছর শেষে বা মাসে অটোমেটিক এ্যাসেটের অবচয় জেনারেট এবং একাউন্টিং লেজারে পোস্টিং।

---

## 3. Integrations with Finance, Accounting & HR
- **Finance Integration:** পারচেজ ইনভয়েস ও ভেন্ডর পেয়েবল হিসাব।
- **Accounting Double Entry Posting:**
  - **Asset Purchase:** `Debit: Fixed Assets / Inventory` | `Credit: Cash/Bank/Payable`
  - **Asset Depreciation:** `Debit: Depreciation Expense` | `Credit: Accumulated Depreciation`
- **Student360 / HR Sync:** শিক্ষার্থী বা কর্মচারীর নামে ইস্যুকৃত প্রাতিষ্ঠানিক সম্পতির তথ্য লাইভ ভিউ।

---

## 4. REST API Integration Contracts (18 API Groups)
- `GET /api/v1/inventory/items`
- `POST /api/v1/inventory/items`
- `GET /api/v1/inventory/categories`
- `GET /api/v1/inventory/vendors`
- `POST /api/v1/inventory/vendors`
- `POST /api/v1/inventory/purchase-orders`
- `POST /api/v1/inventory/grn`
- `GET /api/v1/inventory/assets`
- `POST /api/v1/inventory/assets/depreciation`
- `POST /api/v1/inventory/issue`
- `POST /api/v1/inventory/return`
- `GET /api/v1/inventory/barcode/:itemId`
- `GET /api/v1/inventory/stock-report`
- `GET /api/v1/inventory/dashboard`

---

## 5. Master Database Entities Mapped (24 Core Entities)
`InventoryItem`, `InventoryCategory`, `InventoryVendor`, `PurchaseRequisition`, `PurchaseOrder`, `GoodsReceivedNote`, `InventoryStock`, `InventoryWarehouse`, `AssetRegister`, `AssetDepreciation`, `AssetIssue`, `AssetReturn`, `AssetMaintenance`, `BarcodeTag`, `InventoryInvoice`, `InventoryPayment`, `InventoryAudit`, `InventorySettings`, `InventoryLog`

---

## 6. Verification & 18-Point Completion Condition
Inventory & Asset Management মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই когда:
- [ ] ভেন্ডর পিও এবং জিআরএন রিসিভিং ফ্লো স্টক অ্যাডজাস্ট করবে।
- [ ] বারকোড/কিউআর স্ক্যান করে এ্যাসেট ট্রেস করা যাবে।
- [ ] এ্যাসেটের ডেপ্রিসিয়েশন (অবচয়) ডাবল এন্ট্রি লেজারে অটো-পোস্ট হবে।
- [ ] মালামাল ইস্যু ও রিটার্ন স্টুডেন্ট৩৬০ এবং এইচআর প্রোফাইলে দেখাবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
