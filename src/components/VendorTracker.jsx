"use client";

import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DashboardLayout from "../components/DashboardLayout";
import supabase from "../utils/supabase";
import {
  Search,
  Filter,
  RotateCcw,
  Building2,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Send,
  Calendar,
  Layers,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Activity,
  CheckSquare
} from "lucide-react";

function VendorTracker() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorDate, setVendorDate] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [vendorTrackerData, setVendorTrackerData] = useState([]);

  // States for dropdown options
  const [vendorNameOptions, setVendorNameOptions] = useState([]);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Table states
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // Tab states
  const [activeTab, setActiveTab] = useState("pending");
  const [assignToVendorData, setAssignToVendorData] = useState([]);
  const [assignToVendorLoading, setAssignToVendorLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Form data state
  const [formData, setFormData] = useState({
    vendorName: "",
    productType: "",
    sendDetailsToVendor: false,
    vendorComplaintId: "",
    status: "",
    remark: "",
  });

  const fetchVendorTrackerData = async () => {
    try {
      const { data, error } = await supabase
        .from("VendorTracker")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((row) => [
        row.timestamp,
        row.serial_number,
        row.complaint_id,
        row.date,
        row.status,
        row.remark,
        row.upload,
        row.planned,
        row.actual,
      ]);

      setVendorTrackerData(formattedData);
    } catch (err) {
      console.error("❌ VendorTracker fetch error:", err);
    }
  };

  const fetchAssignToVendorData = async () => {
    try {
      setAssignToVendorLoading(true);

      const { data, error } = await supabase
        .from("AssignToVendor")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((row) => [
        row.timestamp,
        row.vendor_name,
        row.product_type,
        row.send_details_to_vendor,
        row.vendor_complaint_id,
        row.date,
        row.complaint_id,
        row.upload_file,
        row.planned,
        row.actual,
      ]);

      setAssignToVendorData(formattedData);
    } catch (error) {
      console.error("Error fetching AssignToVendor:", error);
    } finally {
      setAssignToVendorLoading(false);
    }
  };

  const fetchComplaintsForVendor = async () => {
    try {
      setTableLoading(true);
      setDataError(null);

      const { data, error } = await supabase.from("FMS").select("*");
      if (error) throw error;

      const formattedData = (data || []).map((row) => [
        row.timestamp,        // 0
        row.id,               // 1
        row.complaint_id,     // 2
        row.company_name,     // 3
        row.mode_of_call,     // 4
        row.id_number,        // 5
        row.project_name,     // 6
        row.complaint_number, // 7
        row.complaint_date,   // 8
        row.beneficiary_name, // 9
        row.contact_number,   // 10
        row.village,          // 11
        row.block,            // 12
        row.district,         // 13
        row.product,          // 14
        row.make,             // 15
        row.rating,           // 16
        row.qty,              // 17
        row.insurance_type,   // 18
        row.nature_of_complaint, // 19
        row.technician_name,  // 20
        row.technician_contact, // 21
        row.assignee_whatsapp_number, // 22
        row.planned,          // 23
        row.actual,           // 24
        row.delay,            // 25
        row.status,           // 26
        row.attend,           // 27
        row.controller_rid_no,// 28
        row.product_sl_no,    // 29
        row.challan_date,     // 30
        row.close_date,       // 31
        row.challan_no,       // 32
        row.last_attend_status,// 33
        row.planned1,         // 34
        row.actual1,          // 35
        row.delay1,           // 36
        row.company,          // 37
        row.email,            // 38
        row.pdf,              // 39
        row.assign_to_vendor, // 40
      ]);

      const filteredData = formattedData.filter((row) => {
        const columnAN = row[40];
        if (!columnAN) return false;
        return String(columnAN).toLowerCase().trim() === "true";
      });

      setTableData(filteredData);
    } catch (error) {
      console.error("❌ Error fetching complaints:", error);
      setDataError(error.message);
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        setIsLoading(true);
        setDataError(null);

        const { data, error } = await supabase
          .from("Master")
          .select("vendor_name, product_type");

        if (error) throw error;

        const vendorNames = (data || []).map((item) => item.vendor_name).filter(Boolean);
        const productTypes = (data || []).map((item) => item.product_type).filter(Boolean);

        setVendorNameOptions([...new Set(vendorNames)].sort());
        setProductTypeOptions([...new Set(productTypes)].sort());
      } catch (error) {
        console.error("Error fetching dropdown options:", error);
        setDataError("Error loading form options.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownOptions();
    fetchComplaintsForVendor();
    fetchAssignToVendorData();
    fetchVendorTrackerData();
  }, []);

  // Map complaint_id to vendor name
  const complaintToVendorMap = useMemo(() => {
    const map = {};
    // From AssignToVendor
    assignToVendorData.forEach((row) => {
      const cid = row[6]?.toString().trim();
      const vname = row[1]?.toString().trim();
      if (cid && vname) map[cid] = vname;
    });
    // Fallback from FMS tableData
    tableData.forEach((row) => {
      const cid = row[2]?.toString().trim();
      const comp = (row[3] || row[37] || "").toString().trim();
      if (cid && !map[cid] && comp) map[cid] = comp;
    });
    return map;
  }, [assignToVendorData, tableData]);

  // Base raw lists for Pending and History
  const rawHistoryList = useMemo(() => {
    return (vendorTrackerData || []).filter((row) => {
      const plannedDate = row[7]?.toString().trim();
      const actualDate = row[8]?.toString().trim();
      return (
        plannedDate &&
        actualDate &&
        plannedDate !== "" &&
        actualDate !== "" &&
        plannedDate !== "null" &&
        actualDate !== "null" &&
        plannedDate !== "undefined" &&
        actualDate !== "undefined"
      );
    });
  }, [vendorTrackerData]);

  const rawPendingList = useMemo(() => {
    if (!tableData || !vendorTrackerData) return [];
    return tableData.filter((row) => {
      const complaintId = row[2]?.toString().trim();
      const match = vendorTrackerData.find(
        (v) => v[2]?.toString().trim() === complaintId
      );
      if (!match) return true;
      const status = match[4]?.toString().toLowerCase().trim();
      return status !== "completed";
    });
  }, [tableData, vendorTrackerData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending: rawPendingList.length,
      history: rawHistoryList.length,
      total: rawPendingList.length + rawHistoryList.length,
    };
  }, [rawPendingList, rawHistoryList]);

  // Vendor summary counts (How many records per vendor)
  const vendorBreakdown = useMemo(() => {
    const counts = {};

    // History rows
    rawHistoryList.forEach((row) => {
      const cid = row[2]?.toString().trim();
      const vendor = complaintToVendorMap[cid] || "Unassigned";
      if (!counts[vendor]) counts[vendor] = { total: 0, pending: 0, history: 0 };
      counts[vendor].total += 1;
      counts[vendor].history += 1;
    });

    // Pending rows
    rawPendingList.forEach((row) => {
      const cid = row[2]?.toString().trim();
      const vendor = complaintToVendorMap[cid] || row[3] || "Pending Assignment";
      if (!counts[vendor]) counts[vendor] = { total: 0, pending: 0, history: 0 };
      counts[vendor].total += 1;
      counts[vendor].pending += 1;
    });

    return Object.entries(counts)
      .map(([vendor, stat]) => ({ vendor, ...stat }))
      .sort((a, b) => b.total - a.total);
  }, [rawHistoryList, rawPendingList, complaintToVendorMap]);

  // Unique filter lists
  const filterOptions = useMemo(() => {
    const vendorsSet = new Set();
    const districtsSet = new Set();
    const statusSet = new Set();

    // From breakdown
    vendorBreakdown.forEach((v) => vendorsSet.add(v.vendor));

    // Master vendor list
    vendorNameOptions.forEach((v) => vendorsSet.add(v));

    // Districts from pending
    rawPendingList.forEach((r) => {
      if (r[13]) districtsSet.add(r[13].toString().trim());
    });

    // Statuses from history
    rawHistoryList.forEach((r) => {
      if (r[4]) statusSet.add(r[4].toString().trim());
    });

    return {
      vendors: Array.from(vendorsSet).sort(),
      districts: Array.from(districtsSet).sort(),
      statuses: Array.from(statusSet).sort(),
    };
  }, [vendorBreakdown, vendorNameOptions, rawPendingList, rawHistoryList]);

  // Filtered dataset for active tab
  const filteredData = useMemo(() => {
    const baseList = activeTab === "history" ? rawHistoryList : rawPendingList;

    return baseList.filter((row) => {
      const cid = row[2]?.toString().trim();
      const vendor = complaintToVendorMap[cid] || (activeTab === "pending" ? row[3] : "Unassigned");

      // Vendor Filter
      if (selectedVendorFilter !== "all") {
        if (vendor.toLowerCase() !== selectedVendorFilter.toLowerCase()) {
          return false;
        }
      }

      // District Filter (Pending tab)
      if (activeTab === "pending" && selectedDistrictFilter !== "all") {
        const district = row[13]?.toString().trim().toLowerCase();
        if (district !== selectedDistrictFilter.toLowerCase()) {
          return false;
        }
      }

      // Status Filter (History tab)
      if (activeTab === "history" && selectedStatusFilter !== "all") {
        const status = row[4]?.toString().trim().toLowerCase();
        if (status !== selectedStatusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        if (activeTab === "history") {
          const matchCid = String(row[2] || "").toLowerCase().includes(q);
          const matchSerial = String(row[1] || "").toLowerCase().includes(q);
          const matchVendor = vendor.toLowerCase().includes(q);
          const matchStatus = String(row[4] || "").toLowerCase().includes(q);
          const matchRemark = String(row[5] || "").toLowerCase().includes(q);
          if (!matchCid && !matchSerial && !matchVendor && !matchStatus && !matchRemark) {
            return false;
          }
        } else {
          const matchCid = String(row[2] || "").toLowerCase().includes(q);
          const matchBeneficiary = String(row[9] || "").toLowerCase().includes(q);
          const matchVendor = vendor.toLowerCase().includes(q);
          const matchContact = String(row[10] || "").toLowerCase().includes(q);
          const matchDistrict = String(row[13] || "").toLowerCase().includes(q);
          const matchProduct = String(row[14] || "").toLowerCase().includes(q);
          const matchNature = String(row[19] || "").toLowerCase().includes(q);
          if (
            !matchCid &&
            !matchBeneficiary &&
            !matchVendor &&
            !matchContact &&
            !matchDistrict &&
            !matchProduct &&
            !matchNature
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    activeTab,
    rawHistoryList,
    rawPendingList,
    complaintToVendorMap,
    selectedVendorFilter,
    selectedDistrictFilter,
    selectedStatusFilter,
    searchTerm,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedVendorFilter("all");
    setSelectedDistrictFilter("all");
    setSelectedStatusFilter("all");
  };

  const isFiltered =
    searchTerm !== "" ||
    selectedVendorFilter !== "all" ||
    selectedDistrictFilter !== "all" ||
    selectedStatusFilter !== "all";

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignmentForm(true);
  };

  const handleBackToTable = () => {
    setShowAssignmentForm(false);
    setSelectedComplaint(null);
    setFormData({
      vendorName: "",
      productType: "",
      sendDetailsToVendor: false,
      vendorComplaintId: "",
      status: "",
      remark: "",
    });
    setVendorDate(null);
    setShowUpload(false);
    setSelectedFiles([]);
  };

  const uploadFileToDrive = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("vendor_tracker")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("vendor_tracker")
        .getPublicUrl(fileName);

      return {
        name: file.name,
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      console.error("❌ Upload error:", error);
      throw error;
    }
  };

  const generateVTId = async () => {
    const { data, error } = await supabase.rpc("generate_vt_id");
    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDataError(null);

    try {
      if (!vendorDate) throw new Error("Please select date");
      if (!formData.status) throw new Error("Please select status");

      const uploadedFiles = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        for (const file of selectedFiles) {
          const uploadedFile = await uploadFileToDrive(file);
          uploadedFiles.push(uploadedFile);
        }
        setUploading(false);
      }

      const timestamp = new Date();
      const vtId = await generateVTId();
      const plannedDate = vendorDate;
      const actualDate = new Date();

      const { error } = await supabase.from("VendorTracker").insert([
        {
          timestamp,
          serial_number: vtId,
          complaint_id: selectedComplaint?.[2] || "",
          date: plannedDate,
          status: formData.status,
          remark: formData.remark || "",
          upload: uploadedFiles.map((f) => f.url).join(", "),
          planned: plannedDate,
          actual: actualDate,
        },
      ]);

      if (error) throw error;

      alert("Vendor Tracker record submitted successfully! ✅");
      handleBackToTable();
      await fetchComplaintsForVendor();
      await fetchAssignToVendorData();
      await fetchVendorTrackerData();
      setActiveTab("history");
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Vendor Tracker
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Track vendor operational progress, service logs, and historical resolutions
            </p>
          </div>

          {showAssignmentForm && (
            <button
              onClick={handleBackToTable}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Tracker
            </button>
          )}
        </div>

        {/* Error Banner */}
        {dataError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            <span>{dataError}</span>
            <button
              onClick={() => setDataError(null)}
              className="text-xs font-bold text-rose-600 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================== VENDOR SUMMARY CARDS ==================== */}
        {!showAssignmentForm && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 size={15} className="text-blue-600" />
                Vendor Workload Summary ({vendorBreakdown.length} Vendors)
              </h2>
              {selectedVendorFilter !== "all" && (
                <button
                  onClick={() => setSelectedVendorFilter("all")}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear Vendor Filter ({selectedVendorFilter})
                </button>
              )}
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Overall Total Card */}
              <div
                onClick={() => setSelectedVendorFilter("all")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedVendorFilter === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    selectedVendorFilter === "all" ? "text-blue-100" : "text-slate-400"
                  }`}>
                    All Vendors
                  </span>
                  <Activity size={14} className={selectedVendorFilter === "all" ? "text-white" : "text-blue-600"} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black">{tabCounts.total}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedVendorFilter === "all" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
                  }`}>
                    Total Tasks
                  </span>
                </div>
              </div>

              {/* Individual Vendor Cards */}
              {vendorBreakdown.map((item) => {
                const isSelected =
                  selectedVendorFilter.toLowerCase() === item.vendor.toLowerCase();

                return (
                  <div
                    key={item.vendor}
                    onClick={() =>
                      setSelectedVendorFilter(
                        isSelected ? "all" : item.vendor
                      )
                    }
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-900 shadow-md"
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold truncate max-w-[120px] ${
                          isSelected ? "text-white" : "text-slate-800"
                        }`}
                        title={item.vendor}
                      >
                        {item.vendor}
                      </span>
                      <Building2
                        size={13}
                        className={isSelected ? "text-blue-400" : "text-slate-400"}
                      />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-bold">{item.total}</span>
                      <div className="flex gap-1">
                        {item.pending > 0 && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isSelected ? "bg-amber-500/20 text-amber-300" : "bg-amber-50 text-amber-700"
                          }`}>
                            {item.pending} Active
                          </span>
                        )}
                        {item.history > 0 && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {item.history} Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== MAIN CARD ==================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Top Bar with Tabs */}
          {!showAssignmentForm && (
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              {/* Tabs Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "pending"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Clock size={14} />
                  <span>Pending Action</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "pending" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tabCounts.pending}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "history"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>Completed History</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "history" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tabCounts.history}
                  </span>
                </button>
              </div>

              {/* Showing count */}
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredData.length} records
              </span>
            </div>
          )}

          {/* ==================== FILTERS BAR ==================== */}
          {!showAssignmentForm && (
            <div className="p-4 md:px-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search complaint ID, vendor, beneficiary, district..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Vendor Dropdown */}
              <div className="w-full sm:w-auto min-w-[160px]">
                <select
                  value={selectedVendorFilter}
                  onChange={(e) => setSelectedVendorFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">All Vendors</option>
                  {filterOptions.vendors.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown (Pending tab) */}
              {activeTab === "pending" && filterOptions.districts.length > 0 && (
                <div className="w-full sm:w-auto min-w-[140px]">
                  <select
                    value={selectedDistrictFilter}
                    onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Districts</option>
                    {filterOptions.districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Dropdown (History tab) */}
              {activeTab === "history" && filterOptions.statuses.length > 0 && (
                <div className="w-full sm:w-auto min-w-[140px]">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    {filterOptions.statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters Button */}
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} /> Clear
                </button>
              )}
            </div>
          )}

          {/* ==================== TABLE SECTION ==================== */}
          {!showAssignmentForm && (
            <div>
              {tableLoading || assignToVendorLoading ? (
                <div className="flex flex-col justify-center items-center h-64 gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">
                    Loading vendor tracker records...
                  </p>
                </div>
              ) : filteredData.length > 0 ? (
                <div className="overflow-x-auto max-h-[520px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                      {activeTab === "history" ? (
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Serial No.</th>
                          <th className="py-3 px-4">Complaint ID</th>
                          <th className="py-3 px-4">Vendor</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Remark</th>
                          <th className="py-3 px-4 text-center">Attachment</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-3 px-4 text-center w-24">Action</th>
                          <th className="py-3 px-4">Complaint ID</th>
                          <th className="py-3 px-4">Company / Vendor</th>
                          <th className="py-3 px-4">Beneficiary</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">District</th>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Nature of Complaint</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredData.map((row, index) => {
                        const cid = row[2]?.toString().trim();
                        const vendor = complaintToVendorMap[cid] || (activeTab === "pending" ? row[3] : "Unassigned");

                        if (activeTab === "history") {
                          const isCompleted = String(row[4] || "").toLowerCase().includes("complete");

                          return (
                            <tr
                              key={row[1] || index}
                              className="hover:bg-blue-50/40 transition-colors"
                            >
                              {/* Date */}
                              <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                {row[0]
                                  ? new Date(row[0]).toLocaleDateString("en-GB")
                                  : "-"}
                              </td>

                              {/* Serial No */}
                              <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                                {row[1] || "-"}
                              </td>

                              {/* Complaint ID */}
                              <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-blue-600">
                                {row[2] || "-"}
                              </td>

                              {/* Vendor */}
                              <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                                <div className="inline-flex items-center gap-1.5">
                                  <Building2 size={13} className="text-blue-600" />
                                  <span>{vendor}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isCompleted
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {isCompleted ? <CheckSquare size={11} /> : <Clock size={11} />}
                                  <span>{row[4] || "-"}</span>
                                </span>
                              </td>

                              {/* Remark */}
                              <td
                                className="py-3 px-4 max-w-xs truncate text-slate-600"
                                title={row[5]}
                              >
                                {row[5] || "-"}
                              </td>

                              {/* Attachment */}
                              <td className="py-3 px-4 whitespace-nowrap text-center">
                                {row[6] ? (
                                  <a
                                    href={row[6]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                                  >
                                    <ExternalLink size={12} />
                                    <span>View File</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        // Pending Tab
                        return (
                          <tr
                            key={row[2] || index}
                            className="hover:bg-blue-50/40 transition-colors"
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleViewComplaint(row)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                <Send size={12} />
                                <span>Action</span>
                              </button>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-blue-600">
                              {row[2] || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                              {vendor}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                              {row[9] || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                              {row[10] || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                              {row[13] || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium">
                                {row[14] || "-"}
                              </span>
                            </td>

                            <td
                              className="py-3 px-4 max-w-xs truncate text-slate-600"
                              title={row[19]}
                            >
                              {row[19] || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">
                    No Complaints Found
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {isFiltered
                      ? "No records match your selected filters. Try resetting the filters."
                      : activeTab === "pending"
                      ? "No pending complaints ready for vendor action."
                      : "No vendor action history recorded yet."}
                  </p>
                  {isFiltered && (
                    <button
                      onClick={handleClearFilters}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                    >
                      <RotateCcw size={13} /> Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== ACTION / ASSIGNMENT FORM ==================== */}
          {showAssignmentForm && selectedComplaint && (
            <div className="p-6">
              {/* Complaint Details Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  Selected Complaint Details
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Complaint ID</span>
                    <span className="font-mono font-bold text-blue-600 text-sm mt-0.5 block">
                      {selectedComplaint[2] || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Beneficiary</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                      {selectedComplaint[9] || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Contact Number</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">
                      {selectedComplaint[10] || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Location</span>
                    <span className="text-slate-700 mt-0.5 block truncate">
                      {[selectedComplaint[11], selectedComplaint[12], selectedComplaint[13]]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Company</span>
                    <span className="font-medium text-slate-800 mt-0.5 block truncate">
                      {selectedComplaint[3] || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Product & Make</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      {[selectedComplaint[14], selectedComplaint[15]].filter(Boolean).join(" - ") || "-"}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Nature of Complaint</span>
                    <span className="text-slate-700 mt-0.5 block truncate" title={selectedComplaint[19]}>
                      {selectedComplaint[19] || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Date Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Service Date <span className="text-rose-500">*</span>
                    </label>
                    <DatePicker
                      selected={vendorDate}
                      onChange={(date) => setVendorDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholderText="Select date"
                      required
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Select Status</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Upload Box */}
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload size={14} className="text-blue-600" />
                    Attach Service Record / Report
                  </h4>
                  <div className="border-2 border-dashed border-slate-200 bg-white rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      id="fileUpload"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer block">
                      <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-blue-600">
                        Click to upload service files
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-700 truncate max-w-sm">
                            {file.name}
                          </span>
                          <span className="text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remarks Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Remark / Service Notes
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        remark: e.target.value,
                      }))
                    }
                    rows="3"
                    placeholder="Enter any technician observations or remarks..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleBackToTable}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                    disabled={isSubmitting || uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting || uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Record</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default VendorTracker;
