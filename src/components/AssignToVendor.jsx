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
  Briefcase
} from "lucide-react";

function AssignToVendorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorDate, setVendorDate] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // States for dropdown options
  const [vendorNameOptions, setVendorNameOptions] = useState([]);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Table data states
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("pending");
  const [assignToVendorData, setAssignToVendorData] = useState([]);
  const [assignToVendorLoading, setAssignToVendorLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState("all");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");

  // Form data state
  const [formData, setFormData] = useState({
    vendorName: "",
    productType: "",
    sendDetailsToVendor: false,
    vendorComplaintId: "",
  });

  const fetchAssignToVendorData = async () => {
    try {
      setAssignToVendorLoading(true);
      const { data, error } = await supabase
        .from("AssignToVendor")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignToVendorData(data || []);
    } catch (error) {
      console.error("❌ Error fetching AssignToVendor:", error);
    } finally {
      setAssignToVendorLoading(false);
    }
  };

  const fetchComplaintsForVendor = async () => {
    try {
      setTableLoading(true);
      setDataError(null);

      const { data, error } = await supabase
        .from("FMS")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter complaints where assign_to_vendor === true
      const filteredData = (data || []).filter(
        (row) => String(row.assign_to_vendor).toLowerCase() === "true"
      );

      setTableData(filteredData);
    } catch (error) {
      console.error("❌ Error fetching complaints:", error);
      setDataError(error.message);
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  // Fetch dropdown options from Master table
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        setIsLoading(true);
        setDataError(null);

        const { data, error } = await supabase
          .from("Master")
          .select("vendor_name, product_type");

        if (error) throw error;

        const vendorNames = (data || []).map((i) => i.vendor_name).filter(Boolean);
        const productTypes = (data || []).map((i) => i.product_type).filter(Boolean);

        setVendorNameOptions([...new Set(vendorNames)].sort());
        setProductTypeOptions([...new Set(productTypes)].sort());
      } catch (error) {
        console.error("Error fetching dropdown options:", error);
        setDataError("Error loading master options");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownOptions();
    fetchComplaintsForVendor();
    fetchAssignToVendorData();
  }, []);

  // Compute pending vs history datasets
  const existingComplaintIds = useMemo(() => {
    return new Set(
      (assignToVendorData || []).map((row) => row.complaint_id).filter(Boolean)
    );
  }, [assignToVendorData]);

  const rawPendingList = useMemo(() => {
    return (tableData || []).filter(
      (row) => !existingComplaintIds.has(row.complaint_id)
    );
  }, [tableData, existingComplaintIds]);

  const rawHistoryList = useMemo(() => {
    return assignToVendorData || [];
  }, [assignToVendorData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending: rawPendingList.length,
      history: rawHistoryList.length,
      total: rawPendingList.length + rawHistoryList.length,
    };
  }, [rawPendingList, rawHistoryList]);

  // Unique lists for filter dropdowns
  const filterOptions = useMemo(() => {
    const vendorsSet = new Set();
    const districtsSet = new Set();
    const productsSet = new Set();

    // From history
    rawHistoryList.forEach((r) => {
      if (r.vendor_name) vendorsSet.add(r.vendor_name.trim());
      if (r.product_type) productsSet.add(r.product_type.trim());
    });

    // From pending
    rawPendingList.forEach((r) => {
      const v = r.company_name || r.company;
      if (v) vendorsSet.add(v.trim());
      if (r.district) districtsSet.add(r.district.trim());
      if (r.product) productsSet.add(r.product.trim());
    });

    // Master vendor list
    vendorNameOptions.forEach((v) => {
      if (v) vendorsSet.add(v.trim());
    });

    return {
      vendors: Array.from(vendorsSet).sort(),
      districts: Array.from(districtsSet).sort(),
      products: Array.from(productsSet).sort(),
    };
  }, [rawHistoryList, rawPendingList, vendorNameOptions]);

  // Vendor summary counts (How many records per vendor)
  const vendorBreakdown = useMemo(() => {
    const counts = {};

    // History counts per vendor
    rawHistoryList.forEach((row) => {
      const name = (row.vendor_name || "Unassigned").trim();
      if (!counts[name]) counts[name] = { total: 0, pending: 0, history: 0 };
      counts[name].total += 1;
      counts[name].history += 1;
    });

    // Pending counts per company/vendor
    rawPendingList.forEach((row) => {
      const name = (row.company_name || row.company || "Pending Assignment").trim();
      if (!counts[name]) counts[name] = { total: 0, pending: 0, history: 0 };
      counts[name].total += 1;
      counts[name].pending += 1;
    });

    return Object.entries(counts)
      .map(([vendor, stat]) => ({ vendor, ...stat }))
      .sort((a, b) => b.total - a.total);
  }, [rawHistoryList, rawPendingList]);

  // Filtered dataset for the active tab
  const filteredData = useMemo(() => {
    const baseList = activeTab === "pending" ? rawPendingList : rawHistoryList;

    return baseList.filter((item) => {
      // Vendor Filter
      if (selectedVendorFilter !== "all") {
        if (activeTab === "history") {
          if ((item.vendor_name || "").trim().toLowerCase() !== selectedVendorFilter.toLowerCase()) {
            return false;
          }
        } else {
          const comp = (item.company_name || item.company || "").trim().toLowerCase();
          if (comp !== selectedVendorFilter.toLowerCase()) {
            return false;
          }
        }
      }

      // District Filter (Pending tab has district)
      if (selectedDistrictFilter !== "all" && activeTab === "pending") {
        if ((item.district || "").trim().toLowerCase() !== selectedDistrictFilter.toLowerCase()) {
          return false;
        }
      }

      // Product Filter
      if (selectedProductFilter !== "all") {
        const prod = activeTab === "history" ? item.product_type : item.product;
        if ((prod || "").trim().toLowerCase() !== selectedProductFilter.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        if (activeTab === "history") {
          const matchComplaintId = String(item.complaint_id || "").toLowerCase().includes(q);
          const matchVendor = String(item.vendor_name || "").toLowerCase().includes(q);
          const matchVendorId = String(item.vendor_complaint_id || "").toLowerCase().includes(q);
          const matchProduct = String(item.product_type || "").toLowerCase().includes(q);
          if (!matchComplaintId && !matchVendor && !matchVendorId && !matchProduct) {
            return false;
          }
        } else {
          const matchComplaintId = String(item.complaint_id || "").toLowerCase().includes(q);
          const matchBeneficiary = String(item.beneficiary_name || "").toLowerCase().includes(q);
          const matchCompany = String(item.company_name || item.company || "").toLowerCase().includes(q);
          const matchContact = String(item.contact_number || "").toLowerCase().includes(q);
          const matchDistrict = String(item.district || "").toLowerCase().includes(q);
          const matchProduct = String(item.product || "").toLowerCase().includes(q);
          if (
            !matchComplaintId &&
            !matchBeneficiary &&
            !matchCompany &&
            !matchContact &&
            !matchDistrict &&
            !matchProduct
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    activeTab,
    rawPendingList,
    rawHistoryList,
    selectedVendorFilter,
    selectedDistrictFilter,
    selectedProductFilter,
    searchTerm,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedVendorFilter("all");
    setSelectedDistrictFilter("all");
    setSelectedProductFilter("all");
  };

  const isFiltered =
    searchTerm !== "" ||
    selectedVendorFilter !== "all" ||
    selectedDistrictFilter !== "all" ||
    selectedProductFilter !== "all";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "sendDetailsToVendor") {
      setShowUpload(checked);
      if (!checked) {
        setSelectedFiles([]);
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
    });
    setVendorDate(null);
    setShowUpload(false);
    setSelectedFiles([]);
  };

  const uploadFileToSupabase = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("assign_to_vendor")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("assign_to_vendor")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedFileUrl = null;
      if (selectedFiles.length > 0) {
        setUploading(true);
        const file = selectedFiles[0];
        uploadedFileUrl = await uploadFileToSupabase(file);
        setUploading(false);
      }

      const { error } = await supabase.from("AssignToVendor").insert([
        {
          timestamp: new Date(),
          vendor_name: formData.vendorName,
          product_type: formData.productType,
          send_details_to_vendor: formData.sendDetailsToVendor,
          vendor_complaint_id: formData.vendorComplaintId,
          date: vendorDate,
          complaint_id: selectedComplaint?.complaint_id || null,
          upload_file: uploadedFileUrl || null,
        },
      ]);

      if (error) throw error;

      alert("Vendor Assignment successfully created! ✅");
      handleBackToTable();
      await fetchComplaintsForVendor();
      await fetchAssignToVendorData();
      setActiveTab("history");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Assign To Vendor
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Assign complaints to certified service vendors, manage workloads, and monitor history
            </p>
          </div>

          {showAssignmentForm && (
            <button
              onClick={handleBackToTable}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Table
            </button>
          )}
        </div>

        {/* Global Error Banner */}
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
                Vendor Record Summary ({vendorBreakdown.length} Vendors)
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
                  <Layers size={14} className={selectedVendorFilter === "all" ? "text-white" : "text-blue-600"} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black">{tabCounts.total}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedVendorFilter === "all" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
                  }`}>
                    Total Records
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
                            {item.pending} Pnd
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
                  <span>Pending Assignment</span>
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
                  <span>Assignment History</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "history" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tabCounts.history}
                  </span>
                </button>
              </div>

              {/* Status info */}
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredData.length} records
              </span>
            </div>
          )}

          {/* ==================== FILTERS BAR ==================== */}
          {!showAssignmentForm && (
            <div className="p-4 md:px-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-3">
              {/* Search Field */}
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

              {/* Product Dropdown */}
              {filterOptions.products.length > 0 && (
                <div className="w-full sm:w-auto min-w-[140px]">
                  <select
                    value={selectedProductFilter}
                    onChange={(e) => setSelectedProductFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Products</option>
                    {filterOptions.products.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reset Filters Button */}
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
                    Loading vendor assignments...
                  </p>
                </div>
              ) : filteredData.length > 0 ? (
                <div className="overflow-x-auto max-h-[520px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                      {activeTab === "history" ? (
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Complaint ID</th>
                          <th className="py-3 px-4">Vendor Name</th>
                          <th className="py-3 px-4">Product Type</th>
                          <th className="py-3 px-4 text-center">Details Sent</th>
                          <th className="py-3 px-4">Vendor Complaint ID</th>
                          <th className="py-3 px-4 text-center">Attachment</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-3 px-4 text-center w-24">Action</th>
                          <th className="py-3 px-4">Complaint ID</th>
                          <th className="py-3 px-4">Company Name</th>
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
                        if (activeTab === "history") {
                          return (
                            <tr
                              key={row.id || index}
                              className="hover:bg-blue-50/40 transition-colors"
                            >
                              {/* Date */}
                              <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                {row.date
                                  ? new Date(row.date).toLocaleDateString("en-GB")
                                  : row.timestamp
                                  ? new Date(row.timestamp).toLocaleDateString("en-GB")
                                  : "-"}
                              </td>

                              {/* Complaint ID */}
                              <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-blue-600">
                                {row.complaint_id || "-"}
                              </td>

                              {/* Vendor Name */}
                              <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                                <div className="inline-flex items-center gap-1.5">
                                  <Building2 size={13} className="text-blue-600" />
                                  <span>{row.vendor_name || "-"}</span>
                                </div>
                              </td>

                              {/* Product Type */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium">
                                  {row.product_type || "-"}
                                </span>
                              </td>

                              {/* Details Sent */}
                              <td className="py-3 px-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.send_details_to_vendor
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {row.send_details_to_vendor ? "Sent" : "No"}
                                </span>
                              </td>

                              {/* Vendor Complaint ID */}
                              <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                                {row.vendor_complaint_id || "-"}
                              </td>

                              {/* Attachment */}
                              <td className="py-3 px-4 whitespace-nowrap text-center">
                                {row.upload_file ? (
                                  <a
                                    href={row.upload_file}
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

                        // Pending Tab Row
                        return (
                          <tr
                            key={row.complaint_id || index}
                            className="hover:bg-blue-50/40 transition-colors"
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleViewComplaint(row)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                <Send size={12} />
                                <span>Assign</span>
                              </button>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-blue-600">
                              {row.complaint_id || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                              {row.company_name || row.company || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                              {row.beneficiary_name || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                              {row.contact_number || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                              {row.district || "-"}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium">
                                {row.product || "-"}
                              </span>
                            </td>

                            <td
                              className="py-3 px-4 max-w-xs truncate text-slate-600"
                              title={row.nature_of_complaint}
                            >
                              {row.nature_of_complaint || "-"}
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
                    <FileText size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">
                    No Complaints Found
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {isFiltered
                      ? "No records match your selected filters. Try resetting the filters."
                      : activeTab === "pending"
                      ? "No pending complaints ready for vendor assignment at this moment."
                      : "No vendor assignment history recorded yet."}
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

          {/* ==================== ASSIGNMENT FORM ==================== */}
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
                      {selectedComplaint.complaint_id || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Beneficiary</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                      {selectedComplaint.beneficiary_name || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Contact Number</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">
                      {selectedComplaint.contact_number || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Location</span>
                    <span className="text-slate-700 mt-0.5 block truncate">
                      {[selectedComplaint.village, selectedComplaint.block, selectedComplaint.district]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Company</span>
                    <span className="font-medium text-slate-800 mt-0.5 block truncate">
                      {selectedComplaint.company_name || selectedComplaint.company || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Product & Make</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      {[selectedComplaint.product, selectedComplaint.make].filter(Boolean).join(" - ") || "-"}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Nature of Complaint</span>
                    <span className="text-slate-700 mt-0.5 block truncate" title={selectedComplaint.nature_of_complaint}>
                      {selectedComplaint.nature_of_complaint || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Input Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Vendor Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Assign to Vendor <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="vendorName"
                      value={formData.vendorName}
                      onChange={(e) => handleSelectChange("vendorName", e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Select Vendor</option>
                      {vendorNameOptions.map((v, i) => (
                        <option key={i} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Type Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Product Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="productType"
                      value={formData.productType}
                      onChange={(e) => handleSelectChange("productType", e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Select Product Type</option>
                      {productTypeOptions.map((p, i) => (
                        <option key={i} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vendor Complaint ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Vendor Complaint ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="vendorComplaintId"
                      value={formData.vendorComplaintId}
                      onChange={handleChange}
                      placeholder="e.g. VEND-9921"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Assignment Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Assignment Date <span className="text-rose-500">*</span>
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
                </div>

                {/* Send details checkbox */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sendDetailsToVendor"
                      name="sendDetailsToVendor"
                      checked={formData.sendDetailsToVendor}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="sendDetailsToVendor"
                      className="text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Send details & upload documents for vendor
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Enable to attach PDFs, photos, or job reports
                  </span>
                </div>

                {/* Document Upload Area */}
                {showUpload && (
                  <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload size={14} className="text-blue-600" />
                      Attach Document (Stored in Supabase Storage)
                    </h4>
                    <div className="border-2 border-dashed border-slate-200 bg-white rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="fileUpload"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label htmlFor="fileUpload" className="cursor-pointer block">
                        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-blue-600">
                          Click to upload file
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PDF, JPG, PNG up to 10MB
                        </p>
                      </label>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-semibold text-slate-700 truncate max-w-sm">
                          {selectedFiles[0].name}
                        </span>
                        <span className="text-slate-400">
                          {(selectedFiles[0].size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Footer Action Buttons */}
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
                        <span>Submitting Assignment...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Assignment</span>
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

export default AssignToVendorForm;
