"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Check,
  ChevronDown,
  Sparkles,
  Search,
  Building2,
  Navigation,
  Edit3,
  Copy,
} from "lucide-react";
import {
  BANGLADESH_GEO_DATA,
  LOCAL_VILLAGES_ELIOTGANJ,
  StructuredAddress,
  formatFullAddress,
} from "@/lib/bangladeshGeoData";

interface AddressState {
  divisionKey: string;
  divisionBn: string;
  districtKey: string;
  districtBn: string;
  upazilaBn: string;
  postOffice: string;
  postCode: string;
  village: string;
  holdingRoad: string;
  isManualOverride: boolean;
  manualText: string;
}

interface BangladeshAddressSelectorProps {
  presentAddressValue: string;
  permanentAddressValue: string;
  onAddressChange: (present: string, permanent: string, structuredData?: { present: AddressState; permanent: AddressState }) => void;
  initialPresentState?: Partial<AddressState>;
  initialPermanentState?: Partial<AddressState>;
}

const DEFAULT_PRESENT: AddressState = {
  divisionKey: "chattogram",
  divisionBn: "চট্টগ্রাম",
  districtKey: "cumilla",
  districtBn: "কুমিল্লা",
  upazilaBn: "দাউদকান্দি",
  postOffice: "ইলিয়টগঞ্জ",
  postCode: "৩৫১৬",
  village: "পশ্চিম লক্ষ্মীপুর",
  holdingRoad: "",
  isManualOverride: false,
  manualText: "",
};

export default function BangladeshAddressSelector({
  presentAddressValue,
  permanentAddressValue,
  onAddressChange,
  initialPresentState,
  initialPermanentState,
}: BangladeshAddressSelectorProps) {
  const [sameAsPresent, setSameAsPresent] = useState(true);

  // Present Address State
  const [present, setPresent] = useState<AddressState>(() => ({
    ...DEFAULT_PRESENT,
    ...initialPresentState,
    manualText: presentAddressValue || initialPresentState?.manualText || "",
  }));

  // Permanent Address State
  const [permanent, setPermanent] = useState<AddressState>(() => ({
    ...DEFAULT_PRESENT,
    ...initialPermanentState,
    manualText: permanentAddressValue || initialPermanentState?.manualText || "",
  }));

  // Search filter for local villages
  const [presentVillageSearch, setPresentVillageSearch] = useState("");
  const [permanentVillageSearch, setPermanentVillageSearch] = useState("");

  // Derived filtered village lists
  const filteredPresentVillages = useMemo(() => {
    if (!presentVillageSearch.trim()) return LOCAL_VILLAGES_ELIOTGANJ;
    const term = presentVillageSearch.trim().toLowerCase();
    return LOCAL_VILLAGES_ELIOTGANJ.filter((v: string) => v.toLowerCase().includes(term));
  }, [presentVillageSearch]);

  const filteredPermanentVillages = useMemo(() => {
    if (!permanentVillageSearch.trim()) return LOCAL_VILLAGES_ELIOTGANJ;
    const term = permanentVillageSearch.trim().toLowerCase();
    return LOCAL_VILLAGES_ELIOTGANJ.filter((v: string) => v.toLowerCase().includes(term));
  }, [permanentVillageSearch]);

  // Compute formatted strings
  const formattedPresent = useMemo(() => {
    if (present.isManualOverride) return present.manualText;
    return formatFullAddress({
      division: present.divisionBn,
      district: present.districtBn,
      upazila: present.upazilaBn,
      postOffice: present.postOffice,
      postCode: present.postCode,
      village: present.village,
      holdingRoad: present.holdingRoad,
    });
  }, [present]);

  const formattedPermanent = useMemo(() => {
    if (sameAsPresent) return formattedPresent;
    if (permanent.isManualOverride) return permanent.manualText;
    return formatFullAddress({
      division: permanent.divisionBn,
      district: permanent.districtBn,
      upazila: permanent.upazilaBn,
      postOffice: permanent.postOffice,
      postCode: permanent.postCode,
      village: permanent.village,
      holdingRoad: permanent.holdingRoad,
    });
  }, [sameAsPresent, formattedPresent, permanent]);

  // Notify parent on change
  useEffect(() => {
    const finalPerm = sameAsPresent ? formattedPresent : formattedPermanent;
    const permState = sameAsPresent ? present : permanent;
    onAddressChange(formattedPresent, finalPerm, {
      present,
      permanent: permState,
    });
  }, [formattedPresent, formattedPermanent, sameAsPresent, present, permanent, onAddressChange]);

  // Helper to handle division change
  const handleDivisionChange = (target: "present" | "permanent", divKey: string) => {
    const divInfo = BANGLADESH_GEO_DATA[divKey];
    if (!divInfo) return;

    const districtKeys = Object.keys(divInfo.districts);
    const firstDistKey = districtKeys[0] || "";
    const firstDist = divInfo.districts[firstDistKey];
    const firstUpazila = firstDist?.upazilas[0];

    const updater = (prev: AddressState): AddressState => ({
      ...prev,
      divisionKey: divKey,
      divisionBn: divInfo.nameBn,
      districtKey: firstDistKey,
      districtBn: firstDist ? firstDist.nameBn : "",
      upazilaBn: firstUpazila ? firstUpazila.nameBn : "",
      postCode: firstUpazila?.postCode || "",
    });

    if (target === "present") {
      setPresent(updater);
    } else {
      setPermanent(updater);
    }
  };

  // Helper to handle district change
  const handleDistrictChange = (target: "present" | "permanent", distKey: string) => {
    const state = target === "present" ? present : permanent;
    const divInfo = BANGLADESH_GEO_DATA[state.divisionKey];
    if (!divInfo) return;

    const distInfo = divInfo.districts[distKey];
    if (!distInfo) return;

    const firstUpazila = distInfo.upazilas[0];

    const updater = (prev: AddressState): AddressState => ({
      ...prev,
      districtKey: distKey,
      districtBn: distInfo.nameBn,
      upazilaBn: firstUpazila ? firstUpazila.nameBn : "",
      postCode: firstUpazila?.postCode || "",
    });

    if (target === "present") {
      setPresent(updater);
    } else {
      setPermanent(updater);
    }
  };

  // Helper to handle upazila change
  const handleUpazilaChange = (target: "present" | "permanent", upazilaNameBn: string) => {
    const state = target === "present" ? present : permanent;
    const divInfo = BANGLADESH_GEO_DATA[state.divisionKey];
    const distInfo = divInfo?.districts[state.districtKey];
    const upazilaObj = distInfo?.upazilas.find((u) => u.nameBn === upazilaNameBn);

    const updater = (prev: AddressState): AddressState => ({
      ...prev,
      upazilaBn: upazilaNameBn,
      postCode: upazilaObj?.postCode || prev.postCode,
    });

    if (target === "present") {
      setPresent(updater);
    } else {
      setPermanent(updater);
    }
  };

  const renderAddressFields = (
    target: "present" | "permanent",
    state: AddressState,
    setState: React.Dispatch<React.SetStateAction<AddressState>>,
    villageSearch: string,
    setVillageSearch: (s: string) => void,
    filteredVillages: string[]
  ) => {
    const currentDivInfo = BANGLADESH_GEO_DATA[state.divisionKey];
    const currentDistricts = currentDivInfo?.districts || {};
    const currentDistInfo = currentDistricts[state.districtKey];
    const currentUpazilas = currentDistInfo?.upazilas || [];
    const isLocalCumilla = state.divisionKey === "chattogram" && state.districtKey === "cumilla";

    return (
      <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        {/* Manual vs Structured Switch */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-bold text-stone-800">
              {target === "present" ? "বর্তমান ঠিকানা তথ্য" : "স্থায়ী ঠিকানা তথ্য"}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              বাংলাদেশ পোস্টাল ফরম্যাট
            </span>
          </div>
          <button
            type="button"
            onClick={() => setState((p) => ({ ...p, isManualOverride: !p.isManualOverride }))}
            className="text-[11px] font-semibold text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition"
          >
            <Edit3 className="w-3 h-3" />
            {state.isManualOverride ? "তালিকা থেকে নির্বাচন মোড" : "সরাসরি ফ্রি-টেক্সট মোড"}
          </button>
        </div>

        {state.isManualOverride ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">সম্পূর্ণ ঠিকানা লিখুন</label>
            <textarea
              rows={3}
              value={state.manualText}
              onChange={(e) => setState((p) => ({ ...p, manualText: e.target.value }))}
              placeholder="গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা..."
              className="w-full p-3 border border-stone-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Division, District, Upazila Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Division */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">বিভাগ *</label>
                <div className="relative">
                  <select
                    value={state.divisionKey}
                    onChange={(e) => handleDivisionChange(target, e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 font-sans font-medium"
                  >
                    {Object.entries(BANGLADESH_GEO_DATA).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.nameBn} ({info.nameEn})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">জেলা *</label>
                <div className="relative">
                  <select
                    value={state.districtKey}
                    onChange={(e) => handleDistrictChange(target, e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 font-sans font-medium"
                  >
                    {Object.entries(currentDistricts).map(([key, dist]) => (
                      <option key={key} value={key}>
                        {dist.nameBn} ({dist.nameEn})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Upazila */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">উপজেলা / থানা *</label>
                <div className="relative">
                  <select
                    value={state.upazilaBn}
                    onChange={(e) => handleUpazilaChange(target, e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8 font-sans font-medium"
                  >
                    {currentUpazilas.map((u) => (
                      <option key={u.nameBn} value={u.nameBn}>
                        {u.nameBn} ({u.nameEn})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Post Office & Post Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">ডাকঘর (Post Office) *</label>
                <input
                  type="text"
                  value={state.postOffice}
                  onChange={(e) => setState((p) => ({ ...p, postOffice: e.target.value }))}
                  placeholder="যেমন: ইলিয়টগঞ্জ, দাউদকান্দি"
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">পোস্ট কোড (Postal Code)</label>
                <input
                  type="text"
                  value={state.postCode}
                  onChange={(e) => setState((p) => ({ ...p, postCode: e.target.value }))}
                  placeholder="যেমন: ৩৫১৬"
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Village / Para / Holding */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">গ্রাম / মহল্লা / পাড়া *</label>
                    <span className="text-[10px] text-stone-500">বাংলাদেশের যে কোনো গ্রাম লিখুন</span>
                  </div>
                  <input
                    type="text"
                    value={state.village}
                    onChange={(e) => setState((p) => ({ ...p, village: e.target.value }))}
                    placeholder="যেমন: পূর্ব লক্ষ্মীপুর / পশ্চিম লক্ষ্মীপুর / অন্যান্য"
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-sans font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">বাড়ি / সড়ক / হোল্ডিং নং (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={state.holdingRoad}
                    onChange={(e) => setState((p) => ({ ...p, holdingRoad: e.target.value }))}
                    placeholder="যেমন: হাজী বাড়ি, প্রধান সড়ক, বাসা #১২"
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Quick Select Village Badges for Eliotganj / Local Area */}
              {isLocalCumilla && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-200/80 rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>ইলিয়টগঞ্জ ও পার্শ্ববর্তী স্থানীয় গ্রামসমূহ (দ্রুত নির্বাচন):</span>
                    </div>

                    {/* Filter local villages input */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-stone-400 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="text"
                        value={villageSearch}
                        onChange={(e) => setVillageSearch(e.target.value)}
                        placeholder="গ্রাম খুঁজুন..."
                        className="pl-7 pr-2 py-1 text-[11px] border border-stone-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-emerald-500 w-28 sm:w-36"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {filteredVillages.slice(0, 30).map((vName) => {
                      const isSelected = state.village.trim() === vName;
                      return (
                        <button
                          key={vName}
                          type="button"
                          onClick={() =>
                            setState((p) => ({
                              ...p,
                              village: vName,
                              postOffice: vName.includes("ইলিয়টগঞ্জ") ? "ইলিয়টগঞ্জ" : p.postOffice,
                            }))
                          }
                          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition flex items-center gap-1 ${
                            isSelected
                              ? "bg-[#0D5C3A] text-white shadow-xs"
                              : "bg-white text-stone-700 hover:bg-emerald-100/70 border border-stone-200"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {vName}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    * আপনার গ্রাম তালিকায় না থাকলে উপরের ইনপুটে যেকোনো গ্রামের নাম সরাসরি টাইপ করুন।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Formatted Address Output Preview */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
              {target === "present" ? "বর্তমান ঠিকানার প্রমিত রূপ:" : "স্থায়ী ঠিকানার প্রমিত রূপ:"}
            </span>
            <p className="text-xs text-stone-800 font-medium break-words">
              {target === "present" ? formattedPresent || "ঠিকানা পূরণ করুন..." : formattedPermanent || "ঠিকানা পূরণ করুন..."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Present Address */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0D5C3A]" />
          <h3 className="text-sm font-bold text-stone-900 font-display">বর্তমান ঠিকানা (Present Address) *</h3>
        </div>
        {renderAddressFields(
          "present",
          present,
          setPresent,
          presentVillageSearch,
          setPresentVillageSearch,
          filteredPresentVillages
        )}
      </div>

      {/* 2. Same as Present Checkbox */}
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800 select-none">
          <input
            type="checkbox"
            checked={sameAsPresent}
            onChange={(e) => setSameAsPresent(e.target.checked)}
            className="w-4 h-4 rounded text-[#0D5C3A] focus:ring-emerald-500 cursor-pointer"
          />
          <span>স্থায়ী ঠিকানা বর্তমান ঠিকানার অনুরূপ (Same as Present Address)</span>
        </label>
        {sameAsPresent && (
          <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <Check className="w-3 h-3 text-emerald-600" />
            স্বয়ংক্রিয় সিঙ্ক সচল
          </span>
        )}
      </div>

      {/* 3. Permanent Address (if not same) */}
      {!sameAsPresent && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#0D5C3A]" />
            <h3 className="text-sm font-bold text-stone-900 font-display">স্থায়ী ঠিকানা (Permanent Address) *</h3>
          </div>
          {renderAddressFields(
            "permanent",
            permanent,
            setPermanent,
            permanentVillageSearch,
            setPermanentVillageSearch,
            filteredPermanentVillages
          )}
        </div>
      )}
    </div>
  );
}
