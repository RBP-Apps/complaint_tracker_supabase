"use client";

import { useEffect, useState, useMemo } from "react";
import supabase from "../utils/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  Building2,
  PhoneCall,
  Folder,
  MapPin,
  UserCheck,
  Shield,
  Activity,
  Building,
  Handshake,
  Package,
  CheckSquare,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Database
} from "lucide-react";

// Master categories definition with icons and description
const MASTER_CATEGORIES = [
  {
    id: "company_name",
    label: "Company Name",
    dbField: "company_name",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Master list of company names, modes of call, and project references.",
    inputs: [
      { key: "company_name", label: "Company Name", placeholder: "e.g. Tata Power, Adani Solar, NTPC", type: "text", required: true },
      { key: "mode_of_call", label: "Mode of Call", placeholder: "e.g. Phone Call, WhatsApp, Email, Web Portal", type: "text" },
      { key: "project_name", label: "Project Name", placeholder: "e.g. PM-KUSUM Scheme, Rooftop Phase-2", type: "text" }
    ]
  },
  {
    id: "mode_of_call",
    label: "Mode of Call",
    dbField: "mode_of_call",
    icon: PhoneCall,
    color: "from-purple-500 to-pink-600",
    lightBg: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Intake channels for complaints (e.g. Phone, WhatsApp, Email, Portal, In-Person).",
    inputs: [
      { key: "mode_of_call", label: "Mode of Call", placeholder: "e.g. Phone Call, WhatsApp, Email, Web Portal", type: "text", required: true }
    ]
  },
  {
    id: "mode_of_letter",
    label: "Mode of Letter",
    dbField: "mode_of_letter",
    icon: Mail,
    color: "from-fuchsia-500 to-rose-600",
    lightBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    description: "Dispatch modes for letters (e.g. Speed Post, Registered Post, Courier, By Hand, Email).",
    inputs: [
      { key: "mode_of_letter", label: "Mode of Letter", placeholder: "e.g. Speed Post, Registered Post, Courier, By Hand, Email", type: "text", required: true }
    ]
  },
  {
    id: "project_name",
    label: "Project Name",
    dbField: "project_name",
    icon: Folder,
    color: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Active project names, solar installations, and operational sites.",
    inputs: [
      { key: "project_name", label: "Project Name", placeholder: "e.g. PM-KUSUM Scheme, Rooftop Phase-2", type: "text", required: true }
    ]
  },
  {
    id: "district",
    label: "District",
    dbField: "district",
    icon: MapPin,
    color: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Districts, cities, and operational regions for complaint filtering.",
    inputs: [
      { key: "district", label: "District Name", placeholder: "e.g. Patna, Gaya, Muzaffarpur, Bhagalpur", type: "text", required: true }
    ]
  },
  {
    id: "technician",
    label: "Technician",
    dbField: "technician_name",
    icon: UserCheck,
    color: "from-cyan-500 to-blue-600",
    lightBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Service technicians with contact numbers for job dispatch and tracking.",
    inputs: [
      { key: "technician_name", label: "Technician Name", placeholder: "e.g. Ramesh Kumar", type: "text", required: true },
      { key: "technician_contact", label: "Contact Number", placeholder: "e.g. 9876543210", type: "tel", maxLength: 15 }
    ]
  },
  {
    id: "insurance_type",
    label: "Insurance Type",
    dbField: "insurance_type",
    icon: Shield,
    color: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Insurance policy and warranty coverage categories.",
    inputs: [
      { key: "insurance_type", label: "Insurance Type", placeholder: "e.g. Comprehensive, Transit, Equipment Warranty", type: "text", required: true }
    ]
  },
  {
    id: "tracker_status",
    label: "Tracker Status",
    dbField: "tracker_status",
    icon: Activity,
    color: "from-rose-500 to-red-600",
    lightBg: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Status options used across technician and complaint trackers.",
    inputs: [
      { 
        key: "tracker_status", 
        label: "Tracker Status", 
        placeholder: "Select or type status", 
        type: "select", 
        options: ["Active", "Inactive", "Pending", "Resolved", "In Progress"],
        required: true 
      }
    ]
  },
  {
    id: "company_name1",
    label: "Beneficiary / Company 1",
    dbField: "company_name1",
    icon: Building,
    color: "from-indigo-500 to-violet-600",
    lightBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Official beneficiary firms, mailing address, email, and phone for letters.",
    inputs: [
      { key: "company_name1", label: "Company / Beneficiary Name", placeholder: "e.g. Bihar Renewable Energy Agency", type: "text", required: true },
      { key: "phone_no", label: "Phone Number", placeholder: "e.g. 0612-2500000 / 9876543210", type: "tel", maxLength: 15 },
      { key: "email_id", label: "Email Address", placeholder: "e.g. contact@agency.org", type: "email" },
      { key: "address", label: "Office Address", placeholder: "e.g. Vidyut Bhawan, Bailey Road, Patna", type: "textarea", fullWidth: true }
    ]
  },
  {
    id: "vendor_name",
    label: "Vendor Name",
    dbField: "vendor_name",
    icon: Handshake,
    color: "from-teal-500 to-emerald-600",
    lightBg: "bg-teal-50 text-teal-700 border-teal-200",
    description: "Authorized third-party equipment and service vendors.",
    inputs: [
      { key: "vendor_name", label: "Vendor Name", placeholder: "e.g. SolarTech Solutions Pvt Ltd", type: "text", required: true }
    ]
  },
  {
    id: "product_type",
    label: "Product Type",
    dbField: "product_type",
    icon: Package,
    color: "from-fuchsia-500 to-pink-600",
    lightBg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    description: "Product categories, solar pump types, panels, and inverters.",
    inputs: [
      { key: "product_type", label: "Product Type", placeholder: "e.g. 3HP AC Submersible, 5HP Solar Pump, Mono PERC Panel", type: "text", required: true }
    ]
  },
  {
    id: "checked",
    label: "Checked Status",
    dbField: "checked",
    icon: CheckSquare,
    color: "from-sky-500 to-blue-600",
    lightBg: "bg-sky-50 text-sky-700 border-sky-200",
    description: "Verification and quality approval flags (e.g. Approved, Reject, Pending).",
    inputs: [
      { 
        key: "checked", 
        label: "Checked Status Option", 
        placeholder: "e.g. Approved, Reject, Verified", 
        type: "select",
        options: ["Approved", "Reject", "Pending", "Verified"],
        required: true 
      }
    ]
  },
  {
    id: "all_records",
    label: "All Master Records",
    dbField: null,
    icon: Layers,
    color: "from-slate-700 to-gray-800",
    lightBg: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Overview of all master records stored in the database.",
    inputs: []
  }
];

export default function MasterDataManagement() {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("company_name");
  const [categorySearch, setCategorySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Creation form state for active category
  const [newEntryData, setNewEntryData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Show message banner with auto-hide
  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 4000);
  };

  // ================= FETCH MASTER DATA =================
  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Master")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterData(data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
      showToast("Error fetching records: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Active Category Object
  const activeCategory = useMemo(() => {
    return (
      MASTER_CATEGORIES.find((cat) => cat.id === activeCategoryId) ||
      MASTER_CATEGORIES[0]
    );
  }, [activeCategoryId]);

  // Reset form when switching category
  useEffect(() => {
    setNewEntryData({});
    setEditId(null);
    setEditData({});
    setItemSearch("");
  }, [activeCategoryId]);

  // Dynamic counts for each category
  const categoryCounts = useMemo(() => {
    const counts = {};
    MASTER_CATEGORIES.forEach((cat) => {
      if (cat.id === "all_records") {
        counts[cat.id] = masterData.length;
      } else if (cat.id === "technician") {
        counts[cat.id] = masterData.filter(
          (item) =>
            (item.technician_name && item.technician_name.toString().trim() !== "") ||
            (item.technician_contact && item.technician_contact.toString().trim() !== "")
        ).length;
      } else if (cat.id === "company_name1") {
        counts[cat.id] = masterData.filter(
          (item) =>
            (item.company_name1 && item.company_name1.toString().trim() !== "") ||
            (item.address && item.address.toString().trim() !== "") ||
            (item.email_id && item.email_id.toString().trim() !== "") ||
            (item.phone_no && item.phone_no.toString().trim() !== "")
        ).length;
      } else if (cat.id === "checked") {
        counts[cat.id] = masterData.filter(
          (item) => item.checked !== null && item.checked !== undefined && item.checked !== ""
        ).length;
      } else {
        counts[cat.id] = masterData.filter(
          (item) => item[cat.dbField] && item[cat.dbField].toString().trim() !== ""
        ).length;
      }
    });
    return counts;
  }, [masterData]);

  // Filtered categories for left sidebar search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return MASTER_CATEGORIES;
    const q = categorySearch.toLowerCase();
    return MASTER_CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        (cat.dbField && cat.dbField.toLowerCase().includes(q))
    );
  }, [categorySearch]);

  // Filtered items for selected category
  const activeItems = useMemo(() => {
    let items = [];
    if (activeCategory.id === "all_records") {
      items = masterData;
    } else if (activeCategory.id === "technician") {
      items = masterData.filter(
        (item) =>
          (item.technician_name && item.technician_name.toString().trim() !== "") ||
          (item.technician_contact && item.technician_contact.toString().trim() !== "")
      );
    } else if (activeCategory.id === "company_name1") {
      items = masterData.filter(
        (item) =>
          (item.company_name1 && item.company_name1.toString().trim() !== "") ||
          (item.address && item.address.toString().trim() !== "") ||
          (item.email_id && item.email_id.toString().trim() !== "") ||
          (item.phone_no && item.phone_no.toString().trim() !== "")
      );
    } else if (activeCategory.id === "checked") {
      items = masterData.filter(
        (item) => item.checked !== null && item.checked !== undefined && item.checked !== ""
      );
    } else {
      items = masterData.filter(
        (item) => item[activeCategory.dbField] && item[activeCategory.dbField].toString().trim() !== ""
      );
    }

    // Filter by item search query
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();

    return items.filter((item) => {
      return Object.entries(item).some(([k, val]) => {
        if (!val) return false;
        return val.toString().toLowerCase().includes(q);
      });
    });
  }, [masterData, activeCategory, itemSearch]);

  // Handle Input Changes for Quick Add
  const handleNewInputChange = (key, value, type) => {
    if (type === "tel") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 15);
      setNewEntryData((prev) => ({ ...prev, [key]: digitsOnly }));
      return;
    }
    setNewEntryData((prev) => ({ ...prev, [key]: value }));
  };

  // Handle Input Changes for Edit Mode
  const handleEditInputChange = (key, value, type) => {
    if (type === "tel") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 15);
      setEditData((prev) => ({ ...prev, [key]: digitsOnly }));
      return;
    }
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  // ================= CREATE RECORD =================
  const handleCreateRecord = async (e) => {
    e.preventDefault();

    // Check if at least one input has value
    const hasValues = Object.values(newEntryData).some(
      (val) => val !== undefined && val !== null && val.toString().trim() !== ""
    );

    if (!hasValues) {
      showToast("Please provide a value to add.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload for active category
      const payload = {};
      if (activeCategory.inputs) {
        activeCategory.inputs.forEach((input) => {
          if (newEntryData[input.key] !== undefined && newEntryData[input.key] !== "") {
            payload[input.key] = newEntryData[input.key];
          }
        });
      }

      const { error } = await supabase.from("Master").insert([payload]);
      if (error) throw error;

      showToast(`Added successfully to ${activeCategory.label}!`, "success");
      setNewEntryData({});
      fetchMasterData();
    } catch (error) {
      console.error("Error adding master record:", error);
      showToast("Error adding record: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a record
  const startEdit = (item) => {
    setEditId(item.id);
    setEditData({ ...item });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  // ================= UPDATE RECORD =================
  const handleUpdateRecord = async (id) => {
    try {
      setIsUpdating(true);

      // Build update payload
      const payload = {};
      if (activeCategory.id === "all_records") {
        Object.keys(editData).forEach((key) => {
          if (key !== "id" && key !== "created_at") {
            payload[key] = editData[key];
          }
        });
      } else {
        activeCategory.inputs.forEach((input) => {
          payload[input.key] = editData[input.key] || null;
        });
      }

      const { error } = await supabase
        .from("Master")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      showToast("Record updated successfully!", "success");
      setEditId(null);
      setEditData({});
      fetchMasterData();
    } catch (error) {
      console.error("Error updating record:", error);
      showToast("Error updating record: " + error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ================= DELETE RECORD =================
  const handleDeleteRecord = async (id, label = "record") => {
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;

    try {
      const { error } = await supabase.from("Master").delete().eq("id", id);
      if (error) throw error;

      showToast("Record deleted successfully.", "success");
      if (editId === id) cancelEdit();
      fetchMasterData();
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast("Error deleting record: " + error.message, "error");
    }
  };

  const ActiveIcon = activeCategory.icon;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/20 p-3 sm:p-5 md:p-8">
        {/* ================= TOP HEADER ================= */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-md shadow-purple-200">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Master Data Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Manage all dropdown options, lookup values, and system fields across forms
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Master Records
              </p>
              <p className="text-2xl font-extrabold text-purple-700">
                {masterData.length}
              </p>
            </div>

            <button
              onClick={fetchMasterData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 shadow-sm hover:shadow transition active:scale-95 disabled:opacity-60"
              title="Refresh Records"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : "text-gray-500"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* TOAST / ALERT MESSAGE */}
        {message.text && (
          <div
            className={`mb-5 flex items-center justify-between p-4 rounded-xl text-sm font-medium border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              message.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ text: "", type: "" })}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================= MOBILE FIELD SELECTOR (SCROLLABLE PILLS) ================= */}
        <div className="lg:hidden mb-4 overflow-x-auto pb-2 scrollbar-none flex gap-2">
          {MASTER_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;
            const isActive = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 scale-100"
                    : "bg-white text-gray-700 hover:bg-purple-50 border border-gray-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-purple-600"}`} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: FIELD CATEGORIES ================= */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-4 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4">
              {/* Category Search Box */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                <span>Master Fields ({filteredCategories.length})</span>
                <span>Entries</span>
              </div>

              {/* Categories Navigation List */}
              <div className="space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.id] || 0;
                  const isActive = activeCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-300/40 font-semibold translate-x-0.5"
                          : "bg-white hover:bg-purple-50/60 text-gray-700 hover:text-purple-700 border border-transparent hover:border-purple-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">
                            {cat.label}
                          </p>
                          {cat.dbField && (
                            <p
                              className={`text-[10px] truncate ${
                                isActive ? "text-purple-100" : "text-gray-400"
                              }`}
                            >
                              {cat.dbField}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700"
                          }`}
                        >
                          {count}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            isActive
                              ? "text-white translate-x-0.5"
                              : "text-gray-300 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 px-4 text-xs text-gray-400">
                    No matching fields found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SELECTED FIELD CRUD WORKSPACE ================= */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-5">
            {/* WORKSPACE HEADER */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-tr ${activeCategory.color} text-white shadow-md`}
                  >
                    <ActiveIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {activeCategory.label}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        {activeItems.length} {activeItems.length === 1 ? "Record" : "Records"}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                      {activeCategory.description}
                    </p>
                  </div>
                </div>

                {/* In-category search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeCategory.label}...`}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                  />
                  {itemSearch && (
                    <button
                      onClick={() => setItemSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ================= ADD NEW RECORD FORM (FOR ACTIVE FIELD) ================= */}
              {activeCategory.id !== "all_records" && (
                <div className="mt-5 bg-gradient-to-br from-purple-50/50 via-indigo-50/20 to-white rounded-xl border border-purple-100 p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 rounded-md bg-purple-600 text-white">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">
                      Add New {activeCategory.label}
                    </h3>
                  </div>

                  <form onSubmit={handleCreateRecord} className="space-y-3">
                    <div className={`grid grid-cols-1 ${activeCategory.inputs.length === 3 ? "md:grid-cols-3" : activeCategory.inputs.length >= 2 ? "md:grid-cols-2" : ""} gap-3`}>
                      {activeCategory.inputs.map((input) => {
                        const isFullWidth = input.fullWidth || (activeCategory.inputs.length === 1);

                        return (
                          <div
                            key={input.key}
                            className={isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"}
                          >
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              {input.label} {input.required && <span className="text-red-500">*</span>}
                            </label>

                            {input.type === "textarea" ? (
                              <textarea
                                rows={2}
                                placeholder={input.placeholder}
                                value={newEntryData[input.key] || ""}
                                onChange={(e) =>
                                  handleNewInputChange(input.key, e.target.value, input.type)
                                }
                                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                              />
                            ) : input.type === "select" ? (
                              <div className="flex gap-2">
                                <select
                                  value={newEntryData[input.key] || ""}
                                  onChange={(e) =>
                                    handleNewInputChange(input.key, e.target.value, input.type)
                                  }
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                                >
                                  <option value="">-- Select {input.label} --</option>
                                  {input.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Or custom status"
                                  value={newEntryData[input.key] || ""}
                                  onChange={(e) =>
                                    handleNewInputChange(input.key, e.target.value, "text")
                                  }
                                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                                />
                              </div>
                            ) : (
                              <input
                                type={input.type || "text"}
                                maxLength={input.maxLength}
                                placeholder={input.placeholder}
                                value={newEntryData[input.key] || ""}
                                onChange={(e) =>
                                  handleNewInputChange(input.key, e.target.value, input.type)
                                }
                                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 transition"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span>Add {activeCategory.label}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= EXISTING ENTRIES LIST (FULL CRUD) ================= */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Existing {activeCategory.label} Entries ({activeItems.length})
                  </h3>
                  {itemSearch && (
                    <span className="text-xs text-purple-600 font-medium">
                      Filtered by "{itemSearch}"
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading master records...</p>
                  </div>
                ) : activeItems.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                    <ActiveIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      No records found for {activeCategory.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {itemSearch
                        ? "No results matched your search keyword. Try clearing the search."
                        : `Use the form above to add your first entry for ${activeCategory.label}.`}
                    </p>
                    {itemSearch && (
                      <button
                        onClick={() => setItemSearch("")}
                        className="mt-3 text-xs text-purple-600 font-semibold hover:underline"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeItems.map((item, index) => {
                      const isEditing = editId === item.id;

                      // Display rendering based on category
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border transition-all duration-200 ${
                            isEditing
                              ? "bg-purple-50/40 border-purple-300 ring-2 ring-purple-400/20 shadow-md p-4"
                              : "bg-white hover:bg-gray-50/80 border-gray-200 shadow-sm p-3.5 sm:p-4 hover:border-purple-200"
                          }`}
                        >
                          {isEditing ? (
                            /* ================= INLINE EDIT MODE ================= */
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                                <span className="text-xs font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Editing Entry #{index + 1}
                                </span>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              <div className={`grid grid-cols-1 ${activeCategory.id === "all_records" ? "md:grid-cols-2" : activeCategory.inputs.length === 3 ? "md:grid-cols-3" : activeCategory.inputs.length >= 2 ? "md:grid-cols-2" : ""} gap-3`}>
                                {activeCategory.id === "all_records" ? (
                                  // In "All Records", allow editing any populated field
                                  Object.keys(editData).map((k) => {
                                    if (["id", "created_at"].includes(k)) return null;
                                    return (
                                      <div key={k} className="col-span-1">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">
                                          {k.replace(/_/g, " ")}
                                        </label>
                                        <input
                                          type="text"
                                          value={editData[k] || ""}
                                          onChange={(e) =>
                                            handleEditInputChange(k, e.target.value, "text")
                                          }
                                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                      </div>
                                    );
                                  })
                                ) : (
                                  activeCategory.inputs.map((input) => {
                                    const isFullWidth =
                                      input.fullWidth || activeCategory.inputs.length === 1;

                                    return (
                                      <div
                                        key={input.key}
                                        className={
                                          isFullWidth
                                            ? "col-span-1 md:col-span-2"
                                            : "col-span-1"
                                        }
                                      >
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          {input.label}
                                        </label>

                                        {input.type === "textarea" ? (
                                          <textarea
                                            rows={2}
                                            value={editData[input.key] || ""}
                                            onChange={(e) =>
                                              handleEditInputChange(
                                                input.key,
                                                e.target.value,
                                                input.type
                                              )
                                            }
                                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                          />
                                        ) : input.type === "select" ? (
                                          <input
                                            type="text"
                                            value={editData[input.key] || ""}
                                            onChange={(e) =>
                                              handleEditInputChange(
                                                input.key,
                                                e.target.value,
                                                "text"
                                              )
                                            }
                                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                          />
                                        ) : (
                                          <input
                                            type={input.type || "text"}
                                            maxLength={input.maxLength}
                                            value={editData[input.key] || ""}
                                            onChange={(e) =>
                                              handleEditInputChange(
                                                input.key,
                                                e.target.value,
                                                input.type
                                              )
                                            }
                                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                          />
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRecord(item.id)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95 disabled:opacity-60"
                                >
                                  {isUpdating ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5" />
                                  )}
                                  <span>Save Changes</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ================= DISPLAY MODE ================= */
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                  {/* Custom Display Per Category */}
                                  {activeCategory.id === "technician" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.technician_name || "Unnamed Technician"}
                                      </p>
                                      {item.technician_contact && (
                                        <div className="flex items-center gap-1 text-xs text-purple-700 mt-0.5">
                                          <Phone className="h-3 w-3" />
                                          <span>{item.technician_contact}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : activeCategory.id === "company_name1" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.company_name1 || "Unnamed Beneficiary"}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                        {item.phone_no && (
                                          <span className="flex items-center gap-1 text-purple-700">
                                            <Phone className="h-3 w-3" />
                                            {item.phone_no}
                                          </span>
                                        )}
                                        {item.email_id && (
                                          <span className="flex items-center gap-1 text-blue-700">
                                            <Mail className="h-3 w-3" />
                                            {item.email_id}
                                          </span>
                                        )}
                                        {item.address && (
                                          <span className="flex items-center gap-1 text-gray-600 line-clamp-1">
                                            <MapPin className="h-3 w-3 text-gray-400" />
                                            {item.address}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : activeCategory.id === "tracker_status" ? (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          item.tracker_status === "Active"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : item.tracker_status === "Inactive"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {item.tracker_status || "None"}
                                      </span>
                                    </div>
                                  ) : activeCategory.id === "checked" ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                        {typeof item.checked === "boolean"
                                          ? item.checked
                                            ? "True (Checked)"
                                            : "False (Unchecked)"
                                          : String(item.checked)}
                                      </span>
                                    </div>
                                  ) : activeCategory.id === "all_records" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.company_name ||
                                          item.project_name ||
                                          item.technician_name ||
                                          item.district ||
                                          `Record #${item.id}`}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {Object.entries(item).map(([k, val]) => {
                                          if (
                                            ["id", "created_at"].includes(k) ||
                                            !val ||
                                            val.toString().trim() === ""
                                          )
                                            return null;
                                          return (
                                            <span
                                              key={k}
                                              className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 text-gray-700 border border-gray-200"
                                            >
                                              <strong className="text-gray-500 font-medium">
                                                {k}:
                                              </strong>{" "}
                                              {String(val)}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : activeCategory.id === "company_name" ? (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.company_name || "-"}
                                      </p>
                                      {(item.mode_of_call || item.project_name) && (
                                        <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                                          {item.mode_of_call && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                              <PhoneCall className="h-3 w-3" />
                                              <strong className="text-purple-500 font-medium">Mode:</strong> {item.mode_of_call}
                                            </span>
                                          )}
                                          {item.project_name && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              <Folder className="h-3 w-3" />
                                              <strong className="text-emerald-500 font-medium">Project:</strong> {item.project_name}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item[activeCategory.dbField] || "-"}
                                      </p>
                                    </div>
                                  )}

                                  {/* Created timestamp */}
                                  {item.created_at && (
                                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-gray-300" />
                                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons: Edit & Delete */}
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition border border-purple-200 active:scale-95"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteRecord(
                                      item.id,
                                      activeCategory.id === "all_records"
                                        ? "record"
                                        : activeCategory.label
                                    )
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition border border-red-200 active:scale-95"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}