"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Layers,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  Phone,
  Info,
  Truck,
  RotateCcw,
  QrCode,
  Sliders,
  Building,
  UserCheck,
  Wrench,
  Clock
} from "lucide-react";

export default function AdminInventoryHub() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "items" | "stock" | "movements" | "procurement" | "assets" | "suppliers_reports"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Core Data Lists
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [stockBalances, setStockBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Filters & Search
  const [itemSearch, setItemSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  // Modals Visibility
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showStockTransferModal, setShowStockTransferModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [showNewPRModal, setShowNewPRModal] = useState(false);
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [showGoodsReceiveModal, setShowGoodsReceiveModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showAssignAssetModal, setShowAssignAssetModal] = useState(false);
  const [showAssetConditionModal, setShowAssetConditionModal] = useState(false);
  const [showAssetDisposeModal, setShowAssetDisposeModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedAssetForQr, setSelectedAssetForQr] = useState<any | null>(null);
  const [selectedAssetForAction, setSelectedAssetForAction] = useState<any | null>(null);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState<any | null>(null);

  // Form States
  const [itemForm, setItemForm] = useState({
    nameBn: "",
    nameEn: "",
    categoryId: "",
    unit: "PCS",
    description: "",
    isConsumable: true,
    minStock: "5",
    reorderLevel: "10",
    defaultUnitCost: "0",
    initialStockLocationId: "",
    initialStockQuantity: "0",
  });

  const [stockInForm, setStockInForm] = useState({
    itemId: "",
    locationId: "",
    quantity: "",
    unitCost: "",
    reference: "",
    purpose: "নিয়মিত ক্রয় মজুদ",
    notes: "",
  });

  const [stockOutForm, setStockOutForm] = useState({
    itemId: "",
    locationId: "",
    quantity: "",
    purpose: "",
    recipient: "",
    reference: "",
    notes: "",
  });

  const [transferForm, setTransferForm] = useState({
    itemId: "",
    sourceLocationId: "",
    destLocationId: "",
    quantity: "",
    notes: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    itemId: "",
    locationId: "",
    actualQuantity: "",
    reason: "",
    notes: "",
  });

  const [prForm, setPrForm] = useState({
    title: "",
    purpose: "",
    priority: "NORMAL",
    requiredDate: "",
    itemId: "",
    quantity: "",
    estimatedUnitCost: "",
    notes: "",
  });

  const [poForm, setPoForm] = useState({
    supplierId: "",
    expectedDeliveryDate: "",
    itemId: "",
    quantity: "",
    unitPrice: "",
    discount: "0",
    tax: "0",
    notes: "",
  });

  const [receiveForm, setReceiveForm] = useState<{
    locationId: string;
    deliveryChallanNumber: string;
    items: Array<{
      purchaseOrderItemId: string;
      itemId: string;
      itemName: string;
      quantityOrdered: number;
      quantityReceivedAlready: number;
      quantityToReceive: string;
      quantityDamaged: string;
      unitCost: number;
    }>;
    notes: string;
  }>({
    locationId: "",
    deliveryChallanNumber: "",
    items: [],
    notes: "",
  });

  const [assetForm, setAssetForm] = useState({
    itemId: "",
    serialNumber: "",
    purchaseCost: "",
    purchaseDate: "",
    warrantyExpiry: "",
    supplierId: "",
    locationId: "",
    condition: "NEW",
    assignedDepartment: "",
    notes: "",
  });

  const [assignForm, setAssignForm] = useState({
    assignedDepartment: "",
    locationId: "",
    reason: "",
    notes: "",
  });

  const [conditionForm, setConditionForm] = useState({
    condition: "GOOD",
    status: "ACTIVE",
    event: "INSPECTION",
    cost: "",
    reason: "",
    notes: "",
  });

  const [disposeForm, setDisposeForm] = useState({
    disposalDate: new Date().toISOString().slice(0, 10),
    disposalValue: "0",
    disposalReason: "",
    notes: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // Load All Master Data
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        itemsRes,
        catRes,
        locRes,
        balRes,
        txRes,
        supRes,
        prRes,
        poRes,
        astRes,
      ] = await Promise.all([
        fetch("/api/admin/inventory/stats"),
        fetch("/api/admin/inventory/items"),
        fetch("/api/admin/inventory/categories"),
        fetch("/api/admin/inventory/locations"),
        fetch("/api/admin/inventory/stock/balances"),
        fetch("/api/admin/inventory/stock/transactions?limit=50"),
        fetch("/api/admin/inventory/suppliers"),
        fetch("/api/admin/inventory/procurement/requests"),
        fetch("/api/admin/inventory/procurement/orders"),
        fetch("/api/admin/inventory/assets"),
      ]);

      const [
        statsData,
        itemsData,
        catData,
        locData,
        balData,
        txData,
        supData,
        prData,
        poData,
        astData,
      ] = await Promise.all([
        statsRes.json(),
        itemsRes.json(),
        catRes.json(),
        locRes.json(),
        balRes.json(),
        txRes.json(),
        supRes.json(),
        prRes.json(),
        poRes.json(),
        astRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (itemsData.success) setItems(itemsData.items);
      if (catData.success) setCategories(catData.categories);
      if (locData.success) setLocations(locData.locations);
      if (balData.success) setStockBalances(balData.balances);
      if (txData.success) setTransactions(txData.transactions);
      if (supData.success) setSuppliers(supData.suppliers);
      if (prData.success) setPurchaseRequests(prData.requests);
      if (poData.success) setPurchaseOrders(poData.orders);
      if (astData.success) setAssets(astData.assets);
    } catch (err: any) {
      console.error("Load master data failed:", err);
      setActionMsg({ text: "তথ্য লোড করতে সমস্যা হয়েছে।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Form Submissions
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: itemForm.nameBn,
          nameEn: itemForm.nameEn || undefined,
          categoryId: itemForm.categoryId,
          unit: itemForm.unit,
          description: itemForm.description,
          isConsumable: itemForm.isConsumable,
          minStock: Number(itemForm.minStock),
          reorderLevel: Number(itemForm.reorderLevel),
          defaultUnitCost: Number(itemForm.defaultUnitCost),
          initialStock:
            itemForm.initialStockLocationId && Number(itemForm.initialStockQuantity) > 0
              ? {
                  locationId: itemForm.initialStockLocationId,
                  quantity: Number(itemForm.initialStockQuantity),
                }
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "পণ্য যোগ করা ব্যর্থ হয়েছে।");

      setActionMsg({ text: "নতুন পণ্য সফলভাবে ক্যাটালগে যুক্ত হয়েছে।", type: "success" });
      setShowAddItemModal(false);
      setItemForm({
        nameBn: "",
        nameEn: "",
        categoryId: "",
        unit: "PCS",
        description: "",
        isConsumable: true,
        minStock: "5",
        reorderLevel: "10",
        defaultUnitCost: "0",
        initialStockLocationId: "",
        initialStockQuantity: "0",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/stock/in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: stockInForm.itemId,
          locationId: stockInForm.locationId,
          quantity: Number(stockInForm.quantity),
          unitCost: stockInForm.unitCost ? Number(stockInForm.unitCost) : undefined,
          reference: stockInForm.reference,
          purpose: stockInForm.purpose,
          notes: stockInForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "স্টক-ইন ব্যর্থ হয়েছে।");

      setActionMsg({ text: "মালামাল সফলভাবে স্টক-ইন করা হয়েছে।", type: "success" });
      setShowStockInModal(false);
      setStockInForm({
        itemId: "",
        locationId: "",
        quantity: "",
        unitCost: "",
        reference: "",
        purpose: "নিয়মিত ক্রয় মজুদ",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/stock/out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: stockOutForm.itemId,
          locationId: stockOutForm.locationId,
          quantity: Number(stockOutForm.quantity),
          purpose: stockOutForm.purpose,
          recipient: stockOutForm.recipient,
          reference: stockOutForm.reference,
          notes: stockOutForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "স্টক-আউট ব্যর্থ হয়েছে।");

      setActionMsg({ text: "মালামাল সফলভাবে ইস্যু/স্টক-আউট করা হয়েছে।", type: "success" });
      setShowStockOutModal(false);
      setStockOutForm({
        itemId: "",
        locationId: "",
        quantity: "",
        purpose: "",
        recipient: "",
        reference: "",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleStockTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: transferForm.itemId,
          sourceLocationId: transferForm.sourceLocationId,
          destLocationId: transferForm.destLocationId,
          quantity: Number(transferForm.quantity),
          notes: transferForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "স্টক স্থানান্তর ব্যর্থ হয়েছে।");

      setActionMsg({ text: "মালামাল এক অবস্থান হতে অন্য অবস্থানে সফলভাবে স্থানান্তরিত হয়েছে।", type: "success" });
      setShowStockTransferModal(false);
      setTransferForm({
        itemId: "",
        sourceLocationId: "",
        destLocationId: "",
        quantity: "",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: adjustForm.itemId,
          locationId: adjustForm.locationId,
          actualQuantity: Number(adjustForm.actualQuantity),
          reason: adjustForm.reason,
          notes: adjustForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "স্টক সমন্বয় ব্যর্থ হয়েছে।");

      setActionMsg({ text: "ভৌত গণনা অনুযায়ী স্টক ব্যালেন্স সফলভাবে সমন্বয় করা হয়েছে।", type: "success" });
      setShowStockAdjustModal(false);
      setAdjustForm({
        itemId: "",
        locationId: "",
        actualQuantity: "",
        reason: "",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/procurement/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prForm.title,
          purpose: prForm.purpose,
          priority: prForm.priority,
          requiredDate: prForm.requiredDate ? prForm.requiredDate : undefined,
          items: [
            {
              itemId: prForm.itemId,
              quantity: Number(prForm.quantity),
              estimatedUnitCost: prForm.estimatedUnitCost ? Number(prForm.estimatedUnitCost) : 0,
              notes: prForm.notes,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ক্রয় আবেদন দাখিল ব্যর্থ হয়েছে।");

      setActionMsg({ text: "অভ্যন্তরীণ ক্রয় আবেদন সফলভাবে দাখিল করা হয়েছে।", type: "success" });
      setShowNewPRModal(false);
      setPrForm({
        title: "",
        purpose: "",
        priority: "NORMAL",
        requiredDate: "",
        itemId: "",
        quantity: "",
        estimatedUnitCost: "",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleReviewPR = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const reason = window.prompt(action === "APPROVE" ? "অনুমোদন নোট লিখুন:" : "প্রত্যাখ্যানের কারণ লিখুন:");
      if (reason === null) return;

      const res = await fetch(`/api/admin/inventory/procurement/requests/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNotes: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "পর্যালোচনা ব্যর্থ হয়েছে।");

      setActionMsg({
        text: action === "APPROVE" ? "আবেদন অনুমোদিত হয়েছে।" : "আবেদন প্রত্যাখ্যান করা হয়েছে।",
        type: "success",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/procurement/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poForm.supplierId,
          expectedDeliveryDate: poForm.expectedDeliveryDate ? poForm.expectedDeliveryDate : undefined,
          discount: Number(poForm.discount),
          tax: Number(poForm.tax),
          notes: poForm.notes,
          items: [
            {
              itemId: poForm.itemId,
              quantity: Number(poForm.quantity),
              unitPrice: Number(poForm.unitPrice),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "পারচেজ অর্ডার তৈরি ব্যর্থ হয়েছে।");

      setActionMsg({ text: "পারচেজ অর্ডার সফলভাবে জারি করা হয়েছে।", type: "success" });
      setShowNewPOModal(false);
      setPoForm({
        supplierId: "",
        expectedDeliveryDate: "",
        itemId: "",
        quantity: "",
        unitPrice: "",
        discount: "0",
        tax: "0",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const openGoodsReceiveModal = (po: any) => {
    setSelectedPOForReceive(po);
    const initialItems = po.items.map((it: any) => ({
      purchaseOrderItemId: it.id,
      itemId: it.itemId,
      itemName: it.item.nameBn,
      quantityOrdered: it.quantityOrdered,
      quantityReceivedAlready: it.quantityReceived,
      quantityToReceive: String(Math.max(0, it.quantityOrdered - it.quantityReceived)),
      quantityDamaged: "0",
      unitCost: it.unitPrice,
    }));

    setReceiveForm({
      locationId: locations[0]?.id || "",
      deliveryChallanNumber: "",
      items: initialItems,
      notes: "",
    });
    setShowGoodsReceiveModal(true);
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForReceive) return;

    try {
      const itemsToSubmit = receiveForm.items.map((it) => ({
        purchaseOrderItemId: it.purchaseOrderItemId,
        itemId: it.itemId,
        quantityReceived: Number(it.quantityToReceive),
        quantityDamaged: Number(it.quantityDamaged),
        unitCost: it.unitCost,
      }));

      const res = await fetch(`/api/admin/inventory/procurement/orders/${selectedPOForReceive.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: receiveForm.locationId,
          deliveryChallanNumber: receiveForm.deliveryChallanNumber,
          items: itemsToSubmit,
          notes: receiveForm.notes,
          createFinanceExpense: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "মালামাল রিসিভ করা সম্ভব হয়নি।");

      setActionMsg({ text: "মালামাল সফলভাবে রিসিভ ও স্টোর এন্ট্রি করা হয়েছে।", type: "success" });
      setShowGoodsReceiveModal(false);
      setSelectedPOForReceive(null);
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: assetForm.itemId,
          serialNumber: assetForm.serialNumber,
          purchaseCost: assetForm.purchaseCost ? Number(assetForm.purchaseCost) : undefined,
          purchaseDate: assetForm.purchaseDate ? assetForm.purchaseDate : undefined,
          warrantyExpiry: assetForm.warrantyExpiry ? assetForm.warrantyExpiry : undefined,
          supplierId: assetForm.supplierId || undefined,
          locationId: assetForm.locationId,
          condition: assetForm.condition,
          assignedDepartment: assetForm.assignedDepartment,
          notes: assetForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "স্থায়ী সম্পদ নিবন্ধন ব্যর্থ হয়েছে।");

      setActionMsg({ text: "স্থায়ী সম্পদ সফলভাবে রেজিস্টারে অন্তর্ভুক্ত হয়েছে।", type: "success" });
      setShowAddAssetModal(false);
      setAssetForm({
        itemId: "",
        serialNumber: "",
        purchaseCost: "",
        purchaseDate: "",
        warrantyExpiry: "",
        supplierId: "",
        locationId: "",
        condition: "NEW",
        assignedDepartment: "",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForAction) return;

    try {
      const res = await fetch(`/api/admin/inventory/assets/${selectedAssetForAction.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedDepartment: assignForm.assignedDepartment,
          locationId: assignForm.locationId || undefined,
          reason: assignForm.reason,
          notes: assignForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সম্পদ হস্তান্তর ব্যর্থ হয়েছে।");

      setActionMsg({ text: "সম্পদ সফলভাবে বিভাগ/স্থানে হস্তান্তর করা হয়েছে।", type: "success" });
      setShowAssignAssetModal(false);
      setSelectedAssetForAction(null);
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleUpdateAssetCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForAction) return;

    try {
      const res = await fetch(`/api/admin/inventory/assets/${selectedAssetForAction.id}/condition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: conditionForm.condition,
          status: conditionForm.status,
          event: conditionForm.event,
          cost: conditionForm.cost ? Number(conditionForm.cost) : undefined,
          reason: conditionForm.reason,
          notes: conditionForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "অবস্থা পরিবর্তন ব্যর্থ হয়েছে।");

      setActionMsg({ text: "সম্পদের অবস্থা ও স্থিতি সফলভাবে হালনাগাদ করা হয়েছে।", type: "success" });
      setShowAssetConditionModal(false);
      setSelectedAssetForAction(null);
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleDisposeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForAction) return;

    try {
      const res = await fetch(`/api/admin/inventory/assets/${selectedAssetForAction.id}/dispose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposalDate: disposeForm.disposalDate,
          disposalValue: disposeForm.disposalValue ? Number(disposeForm.disposalValue) : 0,
          disposalReason: disposeForm.disposalReason,
          notes: disposeForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সম্পদ অপসারণ ব্যর্থ হয়েছে।");

      setActionMsg({ text: "সম্পদ সফলভাবে বাতিল ও অপসারিত চিহ্নিত করা হয়েছে।", type: "success" });
      setShowAssetDisposeModal(false);
      setSelectedAssetForAction(null);
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সরবরাহকারী যুক্ত করা ব্যর্থ হয়েছে।");

      setActionMsg({ text: "সরবরাহকারী প্রতিষ্ঠান সফলভাবে নিবন্ধিত হয়েছে।", type: "success" });
      setShowAddSupplierModal(false);
      setSupplierForm({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
      await loadMasterData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  // Filtered Items
  const filteredItems = items.filter((it) => {
    const matchesSearch =
      !itemSearch ||
      it.nameBn.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (it.nameEn && it.nameEn.toLowerCase().includes(itemSearch.toLowerCase())) ||
      it.itemCode.toLowerCase().includes(itemSearch.toLowerCase());
    const matchesCat = !selectedCategoryFilter || it.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    return (
      !assetSearch ||
      a.assetCode.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.item.nameBn.toLowerCase().includes(assetSearch.toLowerCase()) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(assetSearch.toLowerCase())) ||
      (a.assignedDepartment && a.assignedDepartment.toLowerCase().includes(assetSearch.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-xl">
                <Package className="w-7 h-7 text-emerald-300" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">ইনভেন্টরি, সম্পদ ও প্রকিউরমেন্ট ইঞ্জিন</h1>
                <p className="text-emerald-100/80 text-sm mt-0.5">
                  ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • মালামাল মজুদ, ক্রয় ও স্থায়ী সরঞ্জাম ব্যবস্থাপনা
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadMasterData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-medium rounded-xl border border-white/15 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </button>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন পণ্য যোগ
            </button>
            <button
              onClick={() => setShowStockInModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              স্টক-ইন
            </button>
            <button
              onClick={() => setShowStockOutModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              স্টক-আউট
            </button>
          </div>
        </div>

        {/* Global Action Message */}
        {actionMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm flex items-center justify-between transition-all ${
              actionMsg.type === "success"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                : "bg-red-500/20 text-red-200 border border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMsg.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span>{actionMsg.text}</span>
            </div>
            <button
              onClick={() => setActionMsg(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 overflow-x-auto">
        {[
          { id: "overview", label: "সারসংক্ষেপ", icon: Layers },
          { id: "items", label: "মালামাল ও ক্যাটালগ", icon: Package },
          { id: "stock", label: "মজুদ ও লোকেশন", icon: Building },
          { id: "movements", label: "স্টক মুভমেন্ট", icon: RotateCcw },
          { id: "procurement", label: "ক্রয় ও প্রকিউরমেন্ট", icon: Truck },
          { id: "assets", label: "স্থায়ী সম্পদ রেজিস্টার", icon: Wrench },
          { id: "suppliers_reports", label: "সরবরাহকারী ও রিপোর্ট", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: OVERVIEW & STATS                                           */}
      {/* ================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">মোট আইটেম প্রকার</span>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats?.totalItemTypes ?? 0}</p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{categories.length} টি সক্রিয় ক্যাটাগরিতে</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">মোট মজুদ পরিমাণ</span>
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats?.totalStockQuantity ?? 0}</p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{locations.length} টি স্টোর ও ভবনে</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-amber-900/40 bg-amber-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300">কম স্টক সতর্কতা</span>
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-2">{stats?.lowStockCount ?? 0}</p>
              <span className="text-[11px] text-amber-400/70 mt-0.5 block">রিঅর্ডার লেভেলে নেমে গেছে</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-red-900/40 bg-red-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-300">স্টক শেষ (শূন্য)</span>
                <span className="p-2 bg-red-500/10 text-red-400 rounded-xl">
                  <XCircle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-red-400 mt-2">{stats?.outOfStockCount ?? 0}</p>
              <span className="text-[11px] text-red-400/70 mt-0.5 block">জরুরি ক্রয় প্রয়োজন</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">আজকের স্টক-ইন</span>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-2">+{stats?.todayStockIn ?? 0}</p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">গৃহীত সামগ্রী</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">আজকের স্টক-আউট</span>
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-2">-{stats?.todayStockOut ?? 0}</p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">ব্যবহার ও বিতরণ</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">মোট সক্রিয় সম্পদ</span>
                <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Wrench className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats?.totalAssets ?? 0}</p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">কম্পিউটার, ফ্যান, আসবাব</span>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">অপেক্ষমাণ ক্রয় ও অর্ডার</span>
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Truck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-400 mt-2">
                {(stats?.pendingPRs ?? 0) + (stats?.pendingPOs ?? 0)}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">অনুমোদন ও ডেলিভারির অপেক্ষায়</span>
            </div>
          </div>

          {/* Low Stock Alerts & Quick Movement Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Low stock list */}
            <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  মজুদ ঘাটতি তালিকা (Low Stock Items)
                </h3>
                <button
                  onClick={() => setShowNewPRModal(true)}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> রিকুইজিশন তৈরি
                </button>
              </div>

              {stats?.lowStockItems && stats.lowStockItems.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.lowStockItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.nameBn}</p>
                        <p className="text-xs text-slate-400">
                          কোড: <span className="font-mono text-emerald-400">{item.itemCode}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          বর্তমান: {item.currentStock} {item.unit}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">ন্যূনতম সীমা: {item.minStock} {item.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  কোনো পণ্যের স্টক ঘাটতি নেই। সকল পণ্যে পর্যাপ্ত মজুদ রয়েছে।
                </div>
              )}
            </div>

            {/* Recent movements */}
            <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                  সাম্প্রতিক লেনদেন ও নড়াচড়া (Recent Activity)
                </h3>
                <button
                  onClick={() => setActiveTab("movements")}
                  className="text-xs text-blue-400 hover:underline"
                >
                  সবগুলো দেখুন →
                </button>
              </div>

              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.recentTransactions.slice(0, 5).map((tx: any) => {
                    const isIn = ["PURCHASE_IN", "TRANSFER_IN", "ADJUSTMENT_IN", "RETURN_IN"].includes(
                      tx.transactionType
                    );
                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`p-2 rounded-xl text-xs ${
                              isIn ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {isIn ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white">{tx.item.nameBn}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              {tx.transactionNumber} • {new Date(tx.createdAt).toLocaleDateString("bn-BD")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-bold ${
                              isIn ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {isIn ? "+" : "-"}
                            {tx.quantity} {tx.item.unit}
                          </span>
                          <p className="text-[11px] text-slate-400 truncate max-w-[120px]">
                            {tx.purpose || "মজুদ সমন্বয়"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  এখনো কোনো সাম্প্রতিক লেনদেন রেকর্ড নেই।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: ITEMS & CATALOG                                            */}
      {/* ================================================================= */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="পণ্য বা কোড দিয়ে খুঁজুন..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">সকল ক্যাটাগরি</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন পণ্য যোগ
            </button>
          </div>

          {/* Items Table */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">পণ্য কোড</th>
                    <th className="px-4 py-3.5">পণ্যের নাম</th>
                    <th className="px-4 py-3.5">ক্যাটাগরি</th>
                    <th className="px-4 py-3.5">একক (Unit)</th>
                    <th className="px-4 py-3.5">ন্যূনতম মজুদ</th>
                    <th className="px-4 py-3.5">একক মূল্য</th>
                    <th className="px-4 py-3.5">বর্তমান মজুদ</th>
                    <th className="px-4 py-3.5">স্ট্যাটাস</th>
                    <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {item.nameBn}
                        {item.nameEn && <span className="block text-[11px] text-slate-400">{item.nameEn}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{item.category.nameBn}</td>
                      <td className="px-4 py-3 font-mono">{item.unit}</td>
                      <td className="px-4 py-3 text-slate-400">{item.minStock}</td>
                      <td className="px-4 py-3 font-mono">৳{item.defaultUnitCost}</td>
                      <td className="px-4 py-3 font-bold text-white">
                        {item.totalCurrentStock} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        {item.isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                            স্টক শেষ
                          </span>
                        ) : item.isLowStock ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            লো স্টক
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ইন স্টক
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setStockInForm((prev) => ({ ...prev, itemId: item.id }));
                              setShowStockInModal(true);
                            }}
                            title="স্টক-ইন"
                            className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setStockOutForm((prev) => ({ ...prev, itemId: item.id }));
                              setShowStockOutModal(true);
                            }}
                            title="স্টক-আউট"
                            className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setTransferForm((prev) => ({ ...prev, itemId: item.id }));
                              setShowStockTransferModal(true);
                            }}
                            title="স্থানান্তর"
                            className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                        কোনো পণ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: STOCK BALANCES & LOCATIONS                                 */}
      {/* ================================================================= */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <select
                value={selectedLocationFilter}
                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">সকল স্টোর ও লোকেশন</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStockTransferModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium text-xs rounded-xl border border-blue-500/30 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                স্থানান্তর করুন
              </button>
              <button
                onClick={() => setShowStockAdjustModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs rounded-xl border border-amber-500/30 transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                ভৌত গণনা সমন্বয়
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">লোকেশন / স্টোর</th>
                    <th className="px-4 py-3.5">পণ্য কোড</th>
                    <th className="px-4 py-3.5">পণ্যের নাম</th>
                    <th className="px-4 py-3.5">ক্যাটাগরি</th>
                    <th className="px-4 py-3.5">প্রারম্ভিক</th>
                    <th className="px-4 py-3.5">মোট ইন (+)</th>
                    <th className="px-4 py-3.5">মোট আউট (-)</th>
                    <th className="px-4 py-3.5 font-bold">বর্তমান মজুদ</th>
                    <th className="px-4 py-3.5 text-right">সমন্বয়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stockBalances
                    .filter((b) => !selectedLocationFilter || b.locationId === selectedLocationFilter)
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {b.location.nameBn}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400">{b.item.itemCode}</td>
                        <td className="px-4 py-3 font-medium text-white">{b.item.nameBn}</td>
                        <td className="px-4 py-3 text-slate-400">{b.item.category.nameBn}</td>
                        <td className="px-4 py-3 text-slate-400">{b.openingBalance}</td>
                        <td className="px-4 py-3 text-emerald-400">+{b.totalIn}</td>
                        <td className="px-4 py-3 text-amber-400">-{b.totalOut}</td>
                        <td className="px-4 py-3 font-bold text-white text-sm">
                          {b.currentBalance} {b.item.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setAdjustForm({
                                itemId: b.itemId,
                                locationId: b.locationId,
                                actualQuantity: String(b.currentBalance),
                                reason: "নিয়মিত ভৌত গণনা",
                                notes: "",
                              });
                              setShowStockAdjustModal(true);
                            }}
                            className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs"
                          >
                            সমন্বয়
                          </button>
                        </td>
                      </tr>
                    ))}
                  {stockBalances.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                        কোনো মজুদ রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: STOCK MOVEMENTS                                            */}
      {/* ================================================================= */}
      {activeTab === "movements" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              স্টক লেনদেন ও মুভমেন্ট লেজার (Authoritative Movement History)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStockInModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-300 font-medium text-xs rounded-xl border border-emerald-500/30"
              >
                <Plus className="w-3.5 h-3.5" /> স্টক-ইন
              </button>
              <button
                onClick={() => setShowStockOutModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-300 font-medium text-xs rounded-xl border border-amber-500/30"
              >
                <TrendingDown className="w-3.5 h-3.5" /> স্টক-আউট
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">তারিখ ও ভাউচার</th>
                    <th className="px-4 py-3.5">পণ্যের বিবরণ</th>
                    <th className="px-4 py-3.5">লেনদেনের ধরন</th>
                    <th className="px-4 py-3.5">পরিমাণ</th>
                    <th className="px-4 py-3.5">উৎস / গন্তব্য</th>
                    <th className="px-4 py-3.5">উদ্দেশ্য / প্রাপক</th>
                    <th className="px-4 py-3.5">মজুদ (পূর্বে → পরে)</th>
                    <th className="px-4 py-3.5 text-right">এন্ট্রি প্রদানকারী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => {
                    const isIn = ["PURCHASE_IN", "TRANSFER_IN", "ADJUSTMENT_IN", "RETURN_IN", "OPENING"].includes(
                      tx.transactionType
                    );
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-400 block">{tx.transactionNumber}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString("bn-BD")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{tx.item.nameBn}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              isIn
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-sm">
                          <span className={isIn ? "text-emerald-400" : "text-amber-400"}>
                            {isIn ? "+" : "-"}
                            {tx.quantity} {tx.item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {tx.sourceLocation?.nameBn && `${tx.sourceLocation.nameBn} → `}
                          {tx.destLocation?.nameBn || "প্রধান গুদাম"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {tx.purpose}
                          {tx.recipient && <span className="block text-[11px] text-slate-500">প্রাপক: {tx.recipient}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {tx.systemStockBefore ?? 0} → {tx.systemStockAfter ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">
                          {tx.recordedByUser?.name || "প্রশাসক"}
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        কোনো লেনদেন রেকর্ড নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: PROCUREMENT & ORDERS                                       */}
      {/* ================================================================= */}
      {activeTab === "procurement" && (
        <div className="space-y-6">
          {/* Purchase Requests Section */}
          <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  অভ্যন্তরীণ ক্রয় আবেদন (Purchase Requests)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">মাদরাসার বিভিন্ন বিভাগ হতে দাখিলকৃত ক্রয় আবেদন ও অনুমোদন</p>
              </div>
              <button
                onClick={() => setShowNewPRModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন ক্রয় আবেদন
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">আবেদন নম্বর</th>
                    <th className="px-4 py-3">শিরোনাম ও উদ্দেশ্য</th>
                    <th className="px-4 py-3">অগ্রাধিকার</th>
                    <th className="px-4 py-3">আইটেম সংখ্যা</th>
                    <th className="px-4 py-3">আনুমানিক ব্যয়</th>
                    <th className="px-4 py-3">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-right">পর্যালোচনা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {purchaseRequests.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-emerald-400">{pr.requestNumber}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {pr.title}
                        <span className="block text-[11px] text-slate-400">{pr.purpose}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            pr.priority === "URGENT"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : pr.priority === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {pr.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{pr.items?.length || 0} টি</td>
                      <td className="px-4 py-3 font-bold text-white font-mono">৳{pr.totalEstimatedCost}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            pr.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : pr.status === "ORDERED" || pr.status === "RECEIVED"
                              ? "bg-blue-500/20 text-blue-300"
                              : pr.status === "REJECTED"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {pr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pr.status === "SUBMITTED" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewPR(pr.id, "APPROVE")}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs"
                            >
                              অনুমোদন
                            </button>
                            <button
                              onClick={() => handleReviewPR(pr.id, "REJECT")}
                              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs"
                            >
                              প্রত্যাখ্যান
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">সম্পন্ন</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchaseRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        কোনো ক্রয় আবেদন নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase Orders & Receiving Section */}
          <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  পারচেজ অর্ডার ও গুডস রিসিভিং (Purchase Orders & GRN)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">সরবরাহকারীর অনুকূলে অর্ডার ও মালামাল গ্রহণ নিশ্চিতকরণ</p>
              </div>
              <button
                onClick={() => setShowNewPOModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন পারচেজ অর্ডার
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">পিও নম্বর (PO #)</th>
                    <th className="px-4 py-3">সরবরাহকারী</th>
                    <th className="px-4 py-3">অর্ডার তারিখ</th>
                    <th className="px-4 py-3">মোট মূল্য</th>
                    <th className="px-4 py-3">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-right">মালামাল গ্রহণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-400">{po.poNumber}</td>
                      <td className="px-4 py-3 font-medium text-white">{po.supplier.name}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(po.orderDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="px-4 py-3 font-bold text-white font-mono">৳{po.totalAmount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            po.status === "RECEIVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : po.status === "PARTIALLY_RECEIVED"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {po.status !== "RECEIVED" && po.status !== "CANCELLED" ? (
                          <button
                            onClick={() => openGoodsReceiveModal(po)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium rounded-lg text-xs"
                          >
                            রিসিভ করুন (GRN)
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> সম্পূর্ণ গৃহীত
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        কোনো পারচেজ অর্ডার নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 6: ASSETS REGISTER                                            */}
      {/* ================================================================= */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="সম্পদ কোড, নাম বা বিভাগ দিয়ে খুঁজুন..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={() => setShowAddAssetModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন সম্পদ নিবন্ধন
            </button>
          </div>

          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">সম্পদ কোড</th>
                    <th className="px-4 py-3.5">পণ্যের বিবরণ</th>
                    <th className="px-4 py-3.5">সিরিয়াল নম্বর</th>
                    <th className="px-4 py-3.5">বর্তমান অবস্থান</th>
                    <th className="px-4 py-3.5">বরাদ্দকৃত বিভাগ/ব্যক্তি</th>
                    <th className="px-4 py-3.5">অবস্থা (Condition)</th>
                    <th className="px-4 py-3.5">স্থিতি (Status)</th>
                    <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                        {asset.assetCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{asset.item.nameBn}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {asset.serialNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{asset.location.nameBn}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {asset.assignedDepartment || asset.assignedUser?.name || "অফিস/উন্মুক্ত"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            asset.condition === "NEW" || asset.condition === "GOOD"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : asset.condition === "FAIR"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            asset.status === "AVAILABLE"
                              ? "bg-blue-500/20 text-blue-300"
                              : asset.status === "IN_USE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : asset.status === "REPAIR"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAssetForQr(asset);
                              setShowQrModal(true);
                            }}
                            title="কিউআর কোড দেখুন"
                            className="p-1.5 hover:bg-slate-800 text-emerald-400 rounded-lg"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssetForAction(asset);
                              setAssignForm({
                                assignedDepartment: asset.assignedDepartment || "",
                                locationId: asset.locationId,
                                reason: "সম্পদ হস্তান্তর",
                                notes: "",
                              });
                              setShowAssignAssetModal(true);
                            }}
                            title="বরাদ্দ / হস্তান্তর"
                            className="p-1.5 hover:bg-slate-800 text-blue-400 rounded-lg"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssetForAction(asset);
                              setConditionForm({
                                condition: asset.condition,
                                status: asset.status,
                                event: "INSPECTION",
                                cost: "",
                                reason: "",
                                notes: "",
                              });
                              setShowAssetConditionModal(true);
                            }}
                            title="অবস্থা / মেরামত আপডেট"
                            className="p-1.5 hover:bg-slate-800 text-amber-400 rounded-lg"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                          {asset.status !== "DISPOSED" && (
                            <button
                              onClick={() => {
                                setSelectedAssetForAction(asset);
                                setShowAssetDisposeModal(true);
                              }}
                              title="সম্পদ অপসারণ"
                              className="p-1.5 hover:bg-slate-800 text-red-400 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        কোনো স্থায়ী সম্পদ পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 7: SUPPLIERS & REPORTS                                        */}
      {/* ================================================================= */}
      {activeTab === "suppliers_reports" && (
        <div className="space-y-6">
          {/* Suppliers Table */}
          <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  সরবরাহকারী প্রতিষ্ঠান ডিরেক্টরি (Suppliers Directory)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">মাদরাসার নিয়মিত ভেন্ডর ও সরবরাহকারীদের তালিকা</p>
              </div>
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন সরবরাহকারী যোগ
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">ভেন্ডর কোড</th>
                    <th className="px-4 py-3">প্রতিষ্ঠানের নাম</th>
                    <th className="px-4 py-3">যোগাযোগের ব্যক্তি</th>
                    <th className="px-4 py-3">ফোন নম্বর</th>
                    <th className="px-4 py-3">ইমেইল</th>
                    <th className="px-4 py-3">ঠিকানা</th>
                    <th className="px-4 py-3 text-right">পিও সংখ্যা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-emerald-400">{s.supplierCode}</td>
                      <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                      <td className="px-4 py-3 text-slate-300">{s.contactPerson || "N/A"}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{s.phone}</td>
                      <td className="px-4 py-3 text-slate-400">{s.email || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-400">{s.address || "N/A"}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {s._count?.purchaseOrders || 0} টি
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        কোনো সরবরাহকারী পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Reports Links */}
          <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              প্রিন্ট ও প্রাতিষ্ঠানিক রেজিস্টার রিপোর্ট (Institutional Registers)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-left transition-all"
              >
                <p className="text-xs font-semibold text-white">স্টক ব্যালেন্স রেজিস্টার</p>
                <p className="text-[11px] text-slate-400 mt-0.5">সকল পণ্যের বর্তমান মজুদ ও অবস্থান তালিকা</p>
              </button>

              <button
                onClick={() => window.print()}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-left transition-all"
              >
                <p className="text-xs font-semibold text-amber-300">মজুদ ঘাটতি ও রিঅর্ডার তালিকা</p>
                <p className="text-[11px] text-slate-400 mt-0.5">যে সকল পণ্যের দ্রুত ক্রয় প্রয়োজন</p>
              </button>

              <button
                onClick={() => window.print()}
                className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-left transition-all"
              >
                <p className="text-xs font-semibold text-emerald-300">স্থায়ী সম্পদ রেজিস্টার রিপোর্ট</p>
                <p className="text-[11px] text-slate-400 mt-0.5">মাদরাসার সকল সম্পদ ও বরাদ্দ হিস্ট্রি</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS SECTION                                                    */}
      {/* ================================================================= */}

      {/* Modal: Add Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                নতুন পণ্য ক্যাটালগ এন্ট্রি
              </h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্যের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: এ৪ সাইজ কাগজ (A4 Paper)"
                  value={itemForm.nameBn}
                  onChange={(e) => setItemForm({ ...itemForm, nameBn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">ক্যাটাগরি *</label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">পরিমাপের একক (Unit) *</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PCS">পিস (PCS)</option>
                    <option value="REAM">রিম (REAM)</option>
                    <option value="KG">কেজি (KG)</option>
                    <option value="LTR">লিটার (LTR)</option>
                    <option value="BOX">বক্স (BOX)</option>
                    <option value="PACKET">প্যাকেট (PACKET)</option>
                    <option value="DOZEN">ডজন (DOZEN)</option>
                    <option value="SET">সেট (SET)</option>
                    <option value="OTHER">অন্যান্য</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">ন্যূনতম মজুদ *</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.minStock}
                    onChange={(e) => setItemForm({ ...itemForm, minStock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">রিঅর্ডার সীমা</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.reorderLevel}
                    onChange={(e) => setItemForm({ ...itemForm, reorderLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">একক মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.defaultUnitCost}
                    onChange={(e) => setItemForm({ ...itemForm, defaultUnitCost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Optional initial stock */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-emerald-400 block">প্রারম্ভিক মজুদ (ঐচ্ছিক)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">লোকেশন</label>
                    <select
                      value={itemForm.initialStockLocationId}
                      onChange={(e) => setItemForm({ ...itemForm, initialStockLocationId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">লোকেশন নির্ধারণ</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">পরিমাণ</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.initialStockQuantity}
                      onChange={(e) => setItemForm({ ...itemForm, initialStockQuantity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock In */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                মালামাল স্টক-ইন গ্রহণ
              </h3>
              <button onClick={() => setShowStockInModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockIn} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্য নির্বাচন *</label>
                <select
                  required
                  value={stockInForm.itemId}
                  onChange={(e) => setStockInForm({ ...stockInForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn} ({it.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">স্টোর / লোকেশন *</label>
                <select
                  required
                  value={stockInForm.locationId}
                  onChange={(e) => setStockInForm({ ...stockInForm, locationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">লোকেশন বেছে নিন</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="সংখ্যা"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">একক ক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="টাকা"
                    value={stockInForm.unitCost}
                    onChange={(e) => setStockInForm({ ...stockInForm, unitCost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">রেফারেন্স / ভাউচার / চালান</label>
                <input
                  type="text"
                  placeholder="যেমন: চালান #১২৩৪৫"
                  value={stockInForm.reference}
                  onChange={(e) => setStockInForm({ ...stockInForm, reference: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  স্টক-ইন নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Out */}
      {showStockOutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                মালামাল স্টক-আউট / বিতরণ
              </h3>
              <button onClick={() => setShowStockOutModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockOut} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্য নির্বাচন *</label>
                <select
                  required
                  value={stockOutForm.itemId}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn} (মজুদ: {it.totalCurrentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">উৎস স্টোর / লোকেশন *</label>
                <select
                  required
                  value={stockOutForm.locationId}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, locationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">লোকেশন বেছে নিন</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">বিতরণের পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="পরিমাণ"
                    value={stockOutForm.quantity}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">প্রাপক / বিভাগ</label>
                  <input
                    type="text"
                    placeholder="যেমন: হিফজ বিভাগ"
                    value={stockOutForm.recipient}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, recipient: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ব্যবহারের উদ্দেশ্য *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাসিক পরীক্ষা খাতা বিতরণ"
                  value={stockOutForm.purpose}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockOutModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  স্টক-আউট সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Transfer */}
      {showStockTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-400" />
                লোকেশন টু লোকেশন স্থানান্তর
              </h3>
              <button onClick={() => setShowStockTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockTransfer} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্য নির্বাচন *</label>
                <select
                  required
                  value={transferForm.itemId}
                  onChange={(e) => setTransferForm({ ...transferForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn} ({it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">উৎস লোকেশন *</label>
                  <select
                    required
                    value={transferForm.sourceLocationId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceLocationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">উৎস বেছে নিন</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">গন্তব্য লোকেশন *</label>
                  <select
                    required
                    value={transferForm.destLocationId}
                    onChange={(e) => setTransferForm({ ...transferForm, destLocationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">গন্তব্য বেছে নিন</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">স্থানান্তরের পরিমাণ *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="সংখ্যা"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-xl"
                >
                  স্থানান্তর নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Adjust */}
      {showStockAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                ভৌত গণনা সমন্বয় (Stock Adjustment)
              </h3>
              <button onClick={() => setShowStockAdjustModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjust} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্য *</label>
                <select
                  required
                  value={adjustForm.itemId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">লোকেশন *</label>
                <select
                  required
                  value={adjustForm.locationId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, locationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">লোকেশন বেছে নিন</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">প্রকৃত গণনা করা মজুদ *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="গণনাকৃত সংখ্যা"
                  value={adjustForm.actualQuantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, actualQuantity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">সমন্বয়ের কারণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বার্ষিক ভৌত গণনা মিলকরণ"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockAdjustModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  সমন্বয় নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase Request */}
      {showNewPRModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                অভ্যন্তরীণ ক্রয় আবেদন দাখিল
              </h3>
              <button onClick={() => setShowNewPRModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">আবেদনের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হিফজ বিভাগের জন্য নতুন কোরআন শরীফ ক্রয়"
                  value={prForm.title}
                  onChange={(e) => setPrForm({ ...prForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্য নির্বাচন *</label>
                <select
                  required
                  value={prForm.itemId}
                  onChange={(e) => setPrForm({ ...prForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">প্রয়োজনীয় পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="পরিমাণ"
                    value={prForm.quantity}
                    onChange={(e) => setPrForm({ ...prForm, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">আনুমানিক একক ব্যয় (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="টাকা"
                    value={prForm.estimatedUnitCost}
                    onChange={(e) => setPrForm({ ...prForm, estimatedUnitCost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">অগ্রাধিকার</label>
                  <select
                    value={prForm.priority}
                    onChange={(e) => setPrForm({ ...prForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="LOW">স্বাভাবিক (Low)</option>
                    <option value="NORMAL">জরুরি (Normal)</option>
                    <option value="HIGH">অতি জরুরি (High)</option>
                    <option value="URGENT">সংকটকালীন (Urgent)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">প্রয়োজনীয় তারিখ</label>
                  <input
                    type="date"
                    value={prForm.requiredDate}
                    onChange={(e) => setPrForm({ ...prForm, requiredDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">উদ্দেশ্য / যৌক্তিকতা *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: নতুন ছাত্রদের ক্লাসে বিতরণ করার উদ্দেশ্যে"
                  value={prForm.purpose}
                  onChange={(e) => setPrForm({ ...prForm, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPRModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  দাখিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase Order */}
      {showNewPOModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                নতুন পারচেজ অর্ডার তৈরি
              </h3>
              <button onClick={() => setShowNewPOModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">সরবরাহকারী প্রতিষ্ঠান *</label>
                <select
                  required
                  value={poForm.supplierId}
                  onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">সরবরাহকারী বেছে নিন</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">পণ্য নির্বাচন *</label>
                <select
                  required
                  value={poForm.itemId}
                  onChange={(e) => setPoForm({ ...poForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">অর্ডার পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="পরিমাণ"
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">একক মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="দর"
                    value={poForm.unitPrice}
                    onChange={(e) => setPoForm({ ...poForm, unitPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">ডিসকাউন্ট (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={poForm.discount}
                    onChange={(e) => setPoForm({ ...poForm, discount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">প্রত্যাশিত ডেলিভারি তারিখ</label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPOModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-xl"
                >
                  অর্ডার ইস্যু করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Goods Receive (GRN) */}
      {showGoodsReceiveModal && selectedPOForReceive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  মালামাল রিসিভ ও স্টক-ইন (GRN)
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  পিও: {selectedPOForReceive.poNumber} • ভেন্ডর: {selectedPOForReceive.supplier.name}
                </p>
              </div>
              <button onClick={() => setShowGoodsReceiveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveGoods} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">রিসিভিং লোকেশন *</label>
                  <select
                    required
                    value={receiveForm.locationId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, locationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">লোকেশন বেছে নিন</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">ডেলিভারি চালান নম্বর</label>
                  <input
                    type="text"
                    placeholder="চালান নম্বর"
                    value={receiveForm.deliveryChallanNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, deliveryChallanNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Items to receive */}
              <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                <span className="text-xs font-semibold text-slate-300 block mb-1">আইটেম রিসিভিং পরিমাণ:</span>
                {receiveForm.items.map((it, idx) => (
                  <div key={it.itemId} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-white">{it.itemName}</span>
                      <span className="text-slate-400">
                        অর্ডার: {it.quantityOrdered} (পূর্বে গৃহীত: {it.quantityReceivedAlready})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">গ্রহণকৃত পরিমাণ</label>
                        <input
                          type="number"
                          min="0"
                          value={it.quantityToReceive}
                          onChange={(e) => {
                            const newItems = [...receiveForm.items];
                            newItems[idx].quantityToReceive = e.target.value;
                            setReceiveForm({ ...receiveForm, items: newItems });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-red-400 block mb-0.5">ত্রুটিযুক্ত/ক্ষতিগ্রস্ত</label>
                        <input
                          type="number"
                          min="0"
                          value={it.quantityDamaged}
                          onChange={(e) => {
                            const newItems = [...receiveForm.items];
                            newItems[idx].quantityDamaged = e.target.value;
                            setReceiveForm({ ...receiveForm, items: newItems });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGoodsReceiveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  রিসিভ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Asset */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                নতুন স্থায়ী সম্পদ নিবন্ধন
              </h3>
              <button onClick={() => setShowAddAssetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">সম্পদের আইটেম নির্বাচন *</label>
                <select
                  required
                  value={assetForm.itemId}
                  onChange={(e) => setAssetForm({ ...assetForm, itemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">আইটেম বেছে নিন</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">অবস্থান / স্টোর *</label>
                  <select
                    required
                    value={assetForm.locationId}
                    onChange={(e) => setAssetForm({ ...assetForm, locationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">লোকেশন বেছে নিন</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">সিরিয়াল নম্বর</label>
                  <input
                    type="text"
                    placeholder="মডেল বা এস/এন"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">ক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="টাকা"
                    value={assetForm.purchaseCost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">অবস্থা (Condition)</label>
                  <select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="NEW">নতুন (New)</option>
                    <option value="GOOD">ভালো (Good)</option>
                    <option value="FAIR">চলনসই (Fair)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">বরাদ্দকৃত বিভাগ / দপ্তর</label>
                <input
                  type="text"
                  placeholder="যেমন: কম্পিউটার ল্যাব বা প্রশাসনিক দপ্তর"
                  value={assetForm.assignedDepartment}
                  onChange={(e) => setAssetForm({ ...assetForm, assignedDepartment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  নিবন্ধন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Asset */}
      {showAssignAssetModal && selectedAssetForAction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  সম্পদ হস্তান্তর ও নতুন বরাদ্দ
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  কোড: {selectedAssetForAction.assetCode} • {selectedAssetForAction.item.nameBn}
                </p>
              </div>
              <button onClick={() => setShowAssignAssetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignAsset} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">নতুন অবস্থান (Location)</label>
                <select
                  value={assignForm.locationId}
                  onChange={(e) => setAssignForm({ ...assignForm, locationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">বরাদ্দকৃত বিভাগ / দায়িত্বশীল ব্যক্তি</label>
                <input
                  type="text"
                  placeholder="যেমন: হিফজ শিক্ষক বা কম্পিউটার শিক্ষক"
                  value={assignForm.assignedDepartment}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedDepartment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">হস্তান্তরের কারণ</label>
                <input
                  type="text"
                  placeholder="যেমন: নতুন শ্রেণীকক্ষে স্থানান্তর"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignAssetModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-xl"
                >
                  বরাদ্দ কার্যকর করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Asset Condition Update */}
      {showAssetConditionModal && selectedAssetForAction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  অবস্থা ও মেরামত স্ট্যাটাস আপডেট
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  কোড: {selectedAssetForAction.assetCode} • {selectedAssetForAction.item.nameBn}
                </p>
              </div>
              <button onClick={() => setShowAssetConditionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssetCondition} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">নতুন অবস্থা (Condition)</label>
                  <select
                    value={conditionForm.condition}
                    onChange={(e) => setConditionForm({ ...conditionForm, condition: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="NEW">নতুন (New)</option>
                    <option value="GOOD">ভালো (Good)</option>
                    <option value="FAIR">চলনসই (Fair)</option>
                    <option value="DAMAGED">ক্ষতিগ্রস্ত (Damaged)</option>
                    <option value="REPAIR_REQUIRED">মেরামত আবশ্যক</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">কার্যকর স্থিতি (Status)</label>
                  <select
                    value={conditionForm.status}
                    onChange={(e) => setConditionForm({ ...conditionForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="IN_USE">ব্যবহারাধীন (In Use)</option>
                    <option value="AVAILABLE">মজুদ/উন্মুক্ত (Available)</option>
                    <option value="REPAIR">মেরামতে প্রেরিত (Repair)</option>
                    <option value="DAMAGED">ত্রুটিযুক্ত (Damaged)</option>
                    <option value="LOST">হারানো (Lost)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ইভেন্ট ক্যাটাগরি</label>
                <select
                  value={conditionForm.event}
                  onChange={(e) => setConditionForm({ ...conditionForm, event: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="INSPECTION">নিয়মিত পরিদর্শন (Inspection)</option>
                  <option value="REPAIR_START">মেরামত শুরু (Repair Start)</option>
                  <option value="REPAIR_COMPLETE">মেরামত সম্পন্ন (Repair Complete)</option>
                  <option value="DAMAGE_REPORT">ক্ষতিগ্রস্ততার রিপোর্ট</option>
                  <option value="LOSS_REPORT">হারানোর রিপোর্ট</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">মেরামত ব্যয় (যদি প্রযোজ্য হয়)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="টাকা"
                  value={conditionForm.cost}
                  onChange={(e) => setConditionForm({ ...conditionForm, cost: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">কারণ বা বিবরণ</label>
                <input
                  type="text"
                  placeholder="যেমন: ফ্যান মোটর মেরামত ও কয়েল পরিবর্তন"
                  value={conditionForm.reason}
                  onChange={(e) => setConditionForm({ ...conditionForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssetConditionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  হালনাগাদ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Asset Disposal */}
      {showAssetDisposeModal && selectedAssetForAction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  স্থায়ী সম্পদ অপসারণ ও বাতিলকরণ
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  কোড: {selectedAssetForAction.assetCode} • {selectedAssetForAction.item.nameBn}
                </p>
              </div>
              <button onClick={() => setShowAssetDisposeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisposeAsset} className="space-y-3.5">
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-300">
                সতর্কতা: একবার অপসারিত বা বাতিল করা হলে এই সম্পদটি আর পুনরায় সক্রিয় বা বরাদ্দ করা যাবে না। অডিট ট্রেইলে
                এর স্থায়ী ইতিহাস সংরক্ষিত থাকবে।
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">অপসারণের কারণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সম্পূর্ণ অকেজো ও অমেরামতযোগ্য"
                  value={disposeForm.disposalReason}
                  onChange={(e) => setDisposeForm({ ...disposeForm, disposalReason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">অপসারণ তারিখ</label>
                  <input
                    type="date"
                    value={disposeForm.disposalDate}
                    onChange={(e) => setDisposeForm({ ...disposeForm, disposalDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">স্ক্র্যাপ/বিক্রয় মূল্য (যদি থাকে)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="টাকা"
                    value={disposeForm.disposalValue}
                    onChange={(e) => setDisposeForm({ ...disposeForm, disposalValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssetDisposeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold rounded-xl"
                >
                  অপসারণ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" />
                নতুন সরবরাহকারী প্রতিষ্ঠান যোগ
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">প্রতিষ্ঠানের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আল-মদিনা স্টেশনারি ও পেপার"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">যোগাযোগের ব্যক্তি</label>
                  <input
                    type="text"
                    placeholder="ম্যানেজার / প্রোপ্রাইটর"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="017xxxxxxxx"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="ইলিয়টগঞ্জ বাজার, দাউদকান্দি"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: QR Code Preview */}
      {showQrModal && selectedAssetForQr && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                সম্পদ যাচাই কিউআর কোড
              </h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl inline-block shadow-inner">
              <div className="w-44 h-44 bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-400 rounded-xl">
                <QrCode className="w-20 h-20 text-slate-800" />
                <span className="text-[10px] font-mono text-slate-600 mt-2 font-semibold">
                  {selectedAssetForQr.assetCode}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white">{selectedAssetForQr.item.nameBn}</p>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">{selectedAssetForQr.assetCode}</p>
              <p className="text-xs text-slate-400 mt-1">অবস্থান: {selectedAssetForQr.location.nameBn}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" /> প্রিন্ট লেবেল
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
