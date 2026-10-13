import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import supabase from "../utils/supabase";
import {
  formatDateDisplay,
  formatDateISO,
  parseAnyDate,
  getPresetDateRange,
  calculateReportSummary,
  generateReportPDF,
  generateReportExcel,
  saveReportHistory,
  fetchReportHistory,
  deleteReportHistory,
} from "../utils/reportUtils";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Mail,
  Share2,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Layers,
  Building2,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Trash2,
  RefreshCw,
  Send,
  X,
  Eye,
  Check,
  AlertTriangle,
  FileCheck2,
  BarChart3,
  ListFilter
} from "lucide-react";

const REPORT_CATEGORIES = [
  "Daily Report",
  "Weekly Report",
  "Monthly Report",
  "Quarterly Report",
  "Yearly Report",
  "Custom Date Range Report",
  "Pending Report",
  "Completed Report",
  "In-Progress Report",
  "Overdue Report",
  "Historical Report",
  "Summary Report",
  "Detailed Report",
  "User-wise Report",
  "Status-wise Report",
];

export default function GenerateReportPage() {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState("studio"); // 'studio' | 'history'

  // Master Raw Data from DB
  const [fmsData, setFmsData] = useState([]);
  const [trackerData, setTrackerData] = useState([]);
  const [assignVendorData, setAssignVendorData] = useState([]);
  const [masterData, setMasterData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Selected Report Configuration
  const [selectedCategory, setSelectedCategory] = useState("Monthly Report");
  const [moduleFilter, setModuleFilter] = useState("all"); // 'all' | 'complaints' | 'vendor'

  // Date selection states
  const now = new Date();
  const [selectedSingleDate, setSelectedSingleDate] = useState(formatDateISO(now));
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [customStartDate, setCustomStartDate] = useState(formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customEndDate, setCustomEndDate] = useState(formatDateISO(now));

  // Dynamic entity filters
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedTechnician, setSelectedTechnician] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination & Sorting for table preview
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Modal States
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [recordDetailModalOpen, setRecordDetailModalOpen] = useState(false);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);

  // Email Form State
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailFormat, setEmailFormat] = useState("PDF");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState(null);

  // WhatsApp Form State
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappNotes, setWhatsappNotes] = useState("");
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsappFeedback, setWhatsappFeedback] = useState(null);

  // Report History State
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState("");

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Fetch All Database Data Dynamically
  const loadDatabaseData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setDataError(null);

      const [fmsRes, trackerRes, vendorRes, masterRes] = await Promise.all([
        supabase.from("FMS").select("*").order("id", { ascending: false }),
        supabase.from("Tracker").select("*").order("id", { ascending: false }),
        supabase.from("AssignToVendor").select("*").order("id", { ascending: false }),
        supabase.from("Master").select("*"),
      ]);

      if (fmsRes.error) throw fmsRes.error;

      setFmsData(fmsRes.data || []);
      setTrackerData(trackerRes.data || []);
      setAssignVendorData(vendorRes.data || []);
      setMasterData(masterRes.data || []);
    } catch (err) {
      console.error("Error loading database records for report:", err);
      setDataError(err.message || "Failed to load database records.");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // 2. Fetch Report History
  const loadReportHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const data = await fetchReportHistory();
      setHistoryList(data || []);
    } catch (err) {
      console.error("Error loading report history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
    loadReportHistory();
  }, [loadDatabaseData, loadReportHistory]);

  // Combined Dataset with Enrichment
  const unifiedRecords = useMemo(() => {
    const trackerMap = new Map();
    (trackerData || []).forEach((t) => {
      if (t.complaint_id && !trackerMap.has(t.complaint_id)) {
        trackerMap.set(t.complaint_id, t);
      }
    });

    const vendorMap = new Map();
    (assignVendorData || []).forEach((v) => {
      if (v.complaint_id && !vendorMap.has(v.complaint_id)) {
        vendorMap.set(v.complaint_id, v);
      }
    });

    return (fmsData || []).map((row) => {
      const t = trackerMap.get(row.complaint_id) || {};
      const v = vendorMap.get(row.complaint_id) || {};

      return {
        ...row,
        tracker_status: t.tracker_status || row.status || "Pending",
        action_taken: t.action_taken || null,
        vendor_name: v.vendor_name || null,
        vendor_complaint_id: v.vendor_complaint_id || null,
        vendor_assigned_date: v.date || null,
      };
    });
  }, [fmsData, trackerData, assignVendorData]);

  // Compute Active Date Range Preset
  const activeDateRange = useMemo(() => {
    return getPresetDateRange(selectedCategory, {
      selectedDate: selectedSingleDate,
      month: Number(selectedMonth),
      year: Number(selectedYear),
      quarter: Number(selectedQuarter),
      startDate: customStartDate,
      endDate: customEndDate,
    });
  }, [
    selectedCategory,
    selectedSingleDate,
    selectedMonth,
    selectedYear,
    selectedQuarter,
    customStartDate,
    customEndDate,
  ]);

  // Extract unique values for cascading dropdowns
  const filterOptions = useMemo(() => {
    const companies = new Set();
    const districts = new Set();
    const products = new Set();
    const technicians = new Set();

    unifiedRecords.forEach((r) => {
      const c = r.company_name || r.company;
      if (c && c.trim()) companies.add(c.trim());
      if (r.district && r.district.trim()) districts.add(r.district.trim());
      if (r.product && r.product.trim()) products.add(r.product.trim());
      if (r.technician_name && r.technician_name.trim()) technicians.add(r.technician_name.trim());
      if (r.vendor_name && r.vendor_name.trim()) technicians.add(r.vendor_name.trim());
    });

    (masterData || []).forEach((m) => {
      if (m.company_name && m.company_name.trim()) companies.add(m.company_name.trim());
      if (m.district && m.district.trim()) districts.add(m.district.trim());
      if (m.vendor_name && m.vendor_name.trim()) technicians.add(m.vendor_name.trim());
      if (m.technician_name && m.technician_name.trim()) technicians.add(m.technician_name.trim());
    });

    return {
      companies: Array.from(companies).sort(),
      districts: Array.from(districts).sort(),
      products: Array.from(products).sort(),
      technicians: Array.from(technicians).sort(),
    };
  }, [unifiedRecords, masterData]);

  // Core Filtering Logic
  const filteredRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return unifiedRecords.filter((row) => {
      // 1. Module Filter
      if (moduleFilter === "vendor" && !row.assign_to_vendor) return false;
      if (moduleFilter === "complaints" && row.assign_to_vendor) return false;

      // 2. Report Category Specific Conditions
      const statusLower = String(row.status || "").trim().toLowerCase();
      const lastAttendLower = String(row.last_attend_status || "").trim().toLowerCase();
      const isCompleted =
        statusLower === "completed" ||
        statusLower === "approved-close" ||
        lastAttendLower === "completed" ||
        lastAttendLower === "close";

      const dueDate = row.resolved_date ? parseAnyDate(row.resolved_date) : null;
      const isOverdue = !isCompleted && dueDate && dueDate < today;
      const isInProgress =
        !isCompleted &&
        (statusLower === "in-progress" ||
          statusLower === "attended" ||
          lastAttendLower === "in-progress" ||
          lastAttendLower === "attended");
      const isPending = !isCompleted && !isInProgress;

      if (selectedCategory === "Pending Report" && !isPending) return false;
      if (selectedCategory === "Completed Report" && !isCompleted) return false;
      if (selectedCategory === "In-Progress Report" && !isInProgress) return false;
      if (selectedCategory === "Overdue Report" && !isOverdue) return false;

      // 3. Date Range Filter
      if (activeDateRange.start || activeDateRange.end) {
        const rawDate = row.complaint_date || row.timestamp || row.created_at;
        const recordDate = parseAnyDate(rawDate);

        if (recordDate) {
          if (activeDateRange.start && recordDate < activeDateRange.start) return false;
          if (activeDateRange.end && recordDate > activeDateRange.end) return false;
        }
      }

      // 4. Entity Filters
      if (selectedCompany !== "all") {
        const rowComp = (row.company_name || row.company || "").trim().toLowerCase();
        if (rowComp !== selectedCompany.toLowerCase()) return false;
      }

      if (selectedDistrict !== "all") {
        const rowDist = (row.district || "").trim().toLowerCase();
        if (rowDist !== selectedDistrict.toLowerCase()) return false;
      }

      if (selectedProduct !== "all") {
        const rowProd = (row.product || "").trim().toLowerCase();
        if (rowProd !== selectedProduct.toLowerCase()) return false;
      }

      if (selectedTechnician !== "all") {
        const rowTech = (row.technician_name || row.vendor_name || "").trim().toLowerCase();
        if (rowTech !== selectedTechnician.toLowerCase()) return false;
      }

      if (selectedStatus !== "all") {
        if (selectedStatus === "completed" && !isCompleted) return false;
        if (selectedStatus === "pending" && !isPending) return false;
        if (selectedStatus === "in-progress" && !isInProgress) return false;
        if (selectedStatus === "overdue" && !isOverdue) return false;
      }

      // 5. Global Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchId = String(row.complaint_id || "").toLowerCase().includes(q);
        const matchBeneficiary = String(row.beneficiary_name || "").toLowerCase().includes(q);
        const matchContact = String(row.contact_number || "").toLowerCase().includes(q);
        const matchChallan = String(row.challan_no || "").toLowerCase().includes(q);
        const matchDistrict = String(row.district || "").toLowerCase().includes(q);
        const matchProduct = String(row.product || "").toLowerCase().includes(q);

        if (!matchId && !matchBeneficiary && !matchContact && !matchChallan && !matchDistrict && !matchProduct) {
          return false;
        }
      }

      return true;
    });
  }, [
    unifiedRecords,
    moduleFilter,
    selectedCategory,
    activeDateRange,
    selectedCompany,
    selectedDistrict,
    selectedProduct,
    selectedTechnician,
    selectedStatus,
    searchTerm,
  ]);

  // Dynamic Summary Metrics
  const summaryMetrics = useMemo(() => {
    return calculateReportSummary(filteredRecords);
  }, [filteredRecords]);

  // Sort & Paginate Table
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "complaint_date") {
        valA = parseAnyDate(a.complaint_date || a.timestamp) || new Date(0);
        valB = parseAnyDate(b.complaint_date || b.timestamp) || new Date(0);
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRecords, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Sort toggle handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSelectedCategory("Monthly Report");
    setModuleFilter("all");
    setSelectedCompany("all");
    setSelectedDistrict("all");
    setSelectedProduct("all");
    setSelectedTechnician("all");
    setSelectedStatus("all");
    setSearchTerm("");
    setSelectedSingleDate(formatDateISO(now));
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    setSelectedQuarter(Math.floor(now.getMonth() / 3) + 1);
    setCustomStartDate(formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)));
    setCustomEndDate(formatDateISO(now));
    setCurrentPage(1);
    showToast("Filters successfully reset to defaults", "info");
  };

  // -------------------------------------------------------------
  // EXPORT: DOWNLOAD PDF
  // -------------------------------------------------------------
  const handleDownloadPDF = async () => {
    if (filteredRecords.length === 0) {
      alert("No matching records found to generate PDF report.");
      return;
    }

    try {
      const filename = `${selectedCategory.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const currentUser = localStorage.getItem("username") || "Admin";

      await generateReportPDF({
        reportTitle: `${selectedCategory} - Summary & Details`,
        reportType: selectedCategory,
        dateRangeStr: activeDateRange.label,
        appliedFilters: {
          Category: selectedCategory,
          Company: selectedCompany,
          District: selectedDistrict,
          Product: selectedProduct,
          Technician: selectedTechnician,
          Status: selectedStatus,
        },
        summary: summaryMetrics,
        records: filteredRecords,
        generatedBy: currentUser,
        filename,
        saveToFile: true,
      });

      // Log in Report History
      await saveReportHistory({
        reportName: `${selectedCategory}`,
        reportType: selectedCategory,
        dateRange: activeDateRange.label,
        appliedFilters: {
          category: selectedCategory,
          company: selectedCompany,
          district: selectedDistrict,
          product: selectedProduct,
        },
        summary: summaryMetrics,
        totalRecords: filteredRecords.length,
        generatedBy: currentUser,
        exportFormat: "PDF",
        status: "Completed",
      });

      loadReportHistory();
      showToast("PDF report downloaded and logged in history! 📄");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // EXPORT: DOWNLOAD EXCEL (.xlsx)
  // -------------------------------------------------------------
  const handleDownloadExcel = async () => {
    if (filteredRecords.length === 0) {
      alert("No matching records found to export Excel report.");
      return;
    }

    try {
      const filename = `${selectedCategory.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
      const currentUser = localStorage.getItem("username") || "Admin";

      generateReportExcel({
        reportTitle: selectedCategory,
        reportType: selectedCategory,
        dateRangeStr: activeDateRange.label,
        appliedFilters: {
          Category: selectedCategory,
          Company: selectedCompany,
          District: selectedDistrict,
          Product: selectedProduct,
          Technician: selectedTechnician,
          Status: selectedStatus,
        },
        summary: summaryMetrics,
        records: filteredRecords,
        generatedBy: currentUser,
        filename,
        saveToFile: true,
      });

      // Log in Report History
      await saveReportHistory({
        reportName: `${selectedCategory}`,
        reportType: selectedCategory,
        dateRange: activeDateRange.label,
        appliedFilters: {
          category: selectedCategory,
          company: selectedCompany,
          district: selectedDistrict,
          product: selectedProduct,
        },
        summary: summaryMetrics,
        totalRecords: filteredRecords.length,
        generatedBy: currentUser,
        exportFormat: "Excel",
        status: "Completed",
      });

      loadReportHistory();
      showToast("Excel spreadsheet downloaded and logged in history! 📊");
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Failed to export Excel: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // SHARE: EMAIL REPORT
  // -------------------------------------------------------------
  const openEmailModal = () => {
    if (filteredRecords.length === 0) {
      alert("No matching records found to share.");
      return;
    }
    setEmailSubject(`Complaints Tracker: ${selectedCategory} (${activeDateRange.label})`);
    setEmailMessage(
      `Please find attached the official ${selectedCategory}.\n\nTotal Records: ${summaryMetrics.total}\nCompleted: ${summaryMetrics.completed}\nPending: ${summaryMetrics.pending}\nOverdue: ${summaryMetrics.overdue}\n\nGenerated on: ${new Date().toLocaleString()}`
    );
    setEmailFeedback(null);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailRecipients.trim()) {
      alert("Please enter at least one recipient email address.");
      return;
    }

    const recipientsArr = emailRecipients
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidList = recipientsArr.filter(r => !emailRegex.test(r));
    if (invalidList.length > 0) {
      alert(`Invalid email address: ${invalidList.join(", ")}`);
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailFeedback(null);

      // Generate base64 files
      let pdfBase64 = null;
      let excelBase64 = null;
      const currentUser = localStorage.getItem("username") || "Admin";

      if (emailFormat === "PDF" || emailFormat === "Both") {
        const pdfRes = await generateReportPDF({
          reportTitle: selectedCategory,
          reportType: selectedCategory,
          dateRangeStr: activeDateRange.label,
          appliedFilters: { Category: selectedCategory },
          summary: summaryMetrics,
          records: filteredRecords,
          generatedBy: currentUser,
          saveToFile: false,
        });
        pdfBase64 = pdfRes.base64;
      }

      if (emailFormat === "Excel" || emailFormat === "Both") {
        const xlRes = generateReportExcel({
          reportTitle: selectedCategory,
          reportType: selectedCategory,
          dateRangeStr: activeDateRange.label,
          appliedFilters: { Category: selectedCategory },
          summary: summaryMetrics,
          records: filteredRecords,
          generatedBy: currentUser,
          saveToFile: false,
        });
        excelBase64 = xlRes.base64;
      }

      // Call Edge function
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("send-report-email", {
        body: {
          recipients: recipientsArr,
          subject: emailSubject,
          message: emailMessage,
          reportTitle: selectedCategory,
          format: emailFormat,
          pdfBase64,
          excelBase64,
          fileName: `${selectedCategory.replace(/\s+/g, "_")}_${Date.now()}`,
        },
      });

      if (edgeErr) throw edgeErr;

      const isSuccess = edgeData?.success;
      const isConfigured = edgeData?.serviceConfigured !== false;

      // Log in Report History
      await saveReportHistory({
        reportName: `${selectedCategory} (Email)`,
        reportType: selectedCategory,
        dateRange: activeDateRange.label,
        totalRecords: filteredRecords.length,
        generatedBy: currentUser,
        exportFormat: "Email",
        emailRecipient: recipientsArr.join(", "),
        emailStatus: isSuccess ? "success" : "failed",
        status: isSuccess ? "Completed" : "Failed",
      });

      loadReportHistory();

      if (isSuccess) {
        setEmailFeedback({
          type: "success",
          message: `Report successfully dispatched to: ${recipientsArr.join(", ")}`,
        });
        setTimeout(() => {
          setEmailModalOpen(false);
          showToast("Email sent successfully! ✉️");
        }, 1500);
      } else {
        setEmailFeedback({
          type: isConfigured ? "error" : "warning",
          message: edgeData?.message || "Email service is pending configuration (RESEND_API_KEY in Supabase secrets). A mailto link has also been prepared.",
          mailtoUrl: `mailto:${recipientsArr.join(",")}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`,
        });
      }
    } catch (err) {
      console.error("Email send error:", err);
      setEmailFeedback({
        type: "error",
        message: err.message || "Failed to send email.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // -------------------------------------------------------------
  // SHARE: WHATSAPP REPORT
  // -------------------------------------------------------------
  const openWhatsappModal = () => {
    if (filteredRecords.length === 0) {
      alert("No matching records found to share on WhatsApp.");
      return;
    }
    setWhatsappFeedback(null);
    setWhatsappNotes(
      `📊 Summary for ${selectedCategory}:\n• Total: ${summaryMetrics.total}\n• Completed: ${summaryMetrics.completed}\n• Pending: ${summaryMetrics.pending}\n• Overdue: ${summaryMetrics.overdue}`
    );
    setWhatsappModalOpen(true);
  };

  const handleShareWhatsApp = async (e) => {
    e.preventDefault();
    if (!whatsappPhone.trim()) {
      alert("Please enter a WhatsApp phone number.");
      return;
    }

    let cleanPhone = whatsappPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setIsSharingWhatsApp(true);
      setWhatsappFeedback(null);
      const currentUser = localStorage.getItem("username") || "Admin";

      // Call Edge Function
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("share-report-whatsapp", {
        body: {
          phoneNumber: cleanPhone,
          reportTitle: selectedCategory,
          dateRange: activeDateRange.label,
          summaryText: `Total: ${summaryMetrics.total} | Completed: ${summaryMetrics.completed} | Pending: ${summaryMetrics.pending} | Overdue: ${summaryMetrics.overdue}`,
          customMessage: whatsappNotes,
        },
      });

      // Construct 1-click WhatsApp Web launch URL
      const shareText = `📊 *${selectedCategory}*\n📅 *Period:* ${activeDateRange.label}\n\n${whatsappNotes}\n\n_Generated from Complaints Tracker System_`;
      const waWebUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`;

      // Log in Report History
      await saveReportHistory({
        reportName: `${selectedCategory} (WhatsApp)`,
        reportType: selectedCategory,
        dateRange: activeDateRange.label,
        totalRecords: filteredRecords.length,
        generatedBy: currentUser,
        exportFormat: "WhatsApp",
        whatsappRecipient: cleanPhone,
        whatsappStatus: edgeData?.success ? "success" : "sent_via_fallback",
        status: "Completed",
      });

      loadReportHistory();

      if (edgeData?.success) {
        setWhatsappFeedback({
          type: "success",
          message: `WhatsApp message dispatched directly to +${cleanPhone}!`,
        });
        setTimeout(() => {
          setWhatsappModalOpen(false);
          showToast("Report shared on WhatsApp! 💬");
        }, 1500);
      } else {
        // Fallback to WhatsApp Web
        setWhatsappFeedback({
          type: "info",
          message: "Opening WhatsApp Web with prefilled report message...",
          waUrl: waWebUrl,
        });
        window.open(waWebUrl, "_blank");
        setTimeout(() => {
          setWhatsappModalOpen(false);
          showToast("WhatsApp Web opened with prefilled report!", "info");
        }, 1200);
      }
    } catch (err) {
      console.error("WhatsApp share error:", err);
      setWhatsappFeedback({
        type: "error",
        message: err.message || "Failed to share on WhatsApp.",
      });
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // -------------------------------------------------------------
  // REGENERATE FROM HISTORY
  // -------------------------------------------------------------
  const handleRegenerateFromHistory = (item) => {
    if (item.report_type && REPORT_CATEGORIES.includes(item.report_type)) {
      setSelectedCategory(item.report_type);
    }
    if (item.applied_filters) {
      if (item.applied_filters.company) setSelectedCompany(item.applied_filters.company);
      if (item.applied_filters.district) setSelectedDistrict(item.applied_filters.district);
      if (item.applied_filters.product) setSelectedProduct(item.applied_filters.product);
    }
    setActiveTab("studio");
    showToast(`Loaded filters for ${item.report_name}! Fresh data generated.`, "info");
  };

  const handleDeleteHistory = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report history entry?")) return;
    await deleteReportHistory(reportId);
    loadReportHistory();
    showToast("History entry deleted", "info");
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 transition-all ${
              toastMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : toastMessage.type === "info"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {toastMessage.type === "success" && <CheckCircle2 size={18} className="text-emerald-600" />}
            {toastMessage.type === "info" && <TrendingUp size={18} className="text-blue-600" />}
            {toastMessage.type === "error" && <AlertCircle size={18} className="text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <BarChart3 size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Report</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Generate, download, and share reports from your application data.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === "studio"
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <FileText size={15} />
              Report Studio
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Clock size={15} />
              View Report History ({historyList.length})
            </button>

            <button
              onClick={handleResetFilters}
              title="Reset all filters to defaults"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* 2. Main Tab: REPORT STUDIO */}
        {activeTab === "studio" && (
          <div className="space-y-6">
            {/* Filter Section Card */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <ListFilter size={16} className="text-blue-600" />
                  <span>Report Configuration & Parameters</span>
                </div>
                <span className="text-xs text-blue-700 bg-blue-50 font-medium px-2.5 py-1 rounded-full border border-blue-100">
                  Active Period: {activeDateRange.label}
                </span>
              </div>

              {/* Row 1: Report Categories & Modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Report Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Report Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    {REPORT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Module / Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Module / Department
                  </label>
                  <select
                    value={moduleFilter}
                    onChange={(e) => {
                      setModuleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Modules (Complaints & Vendors)</option>
                    <option value="complaints">Technician Complaints (In-house)</option>
                    <option value="vendor">Vendor Assignments</option>
                  </select>
                </div>

                {/* 3. Dynamic Date Control based on Category */}
                {selectedCategory === "Daily Report" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedSingleDate}
                      onChange={(e) => setSelectedSingleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}

                {selectedCategory === "Weekly Report" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Date in Target Week
                    </label>
                    <input
                      type="date"
                      value={selectedSingleDate}
                      onChange={(e) => setSelectedSingleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}

                {selectedCategory === "Monthly Report" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ].map((mName, idx) => (
                          <option key={idx} value={idx}>{mName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {[2024, 2025, 2026, 2027].map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {selectedCategory === "Quarterly Report" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quarter</label>
                      <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value={1}>Q1 (Jan - Mar)</option>
                        <option value={2}>Q2 (Apr - Jun)</option>
                        <option value={3}>Q3 (Jul - Sep)</option>
                        <option value={4}>Q4 (Oct - Dec)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {[2024, 2025, 2026, 2027].map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {selectedCategory === "Yearly Report" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {[2024, 2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedCategory === "Custom Date Range Report" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Row 2: Cascading Entity Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                {/* Company Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Company / Firm</label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Companies</option>
                    {filterOptions.companies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Districts</option>
                    {filterOptions.districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Products</option>
                    {filterOptions.products.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Technician / Vendor Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned Person/Vendor</label>
                  <select
                    value={selectedTechnician}
                    onChange={(e) => {
                      setSelectedTechnician(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Technicians & Vendors</option>
                    {filterOptions.technicians.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In-Progress / Attended</option>
                    <option value="completed">Completed / Closed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Summary Dashboard KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Records */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Records</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{summaryMetrics.total}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">100% of scope</span>
              </div>

              {/* Completed */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Completed</span>
                <span className="text-2xl font-bold text-emerald-700 mt-1 block">{summaryMetrics.completed}</span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">{summaryMetrics.completionRate}% resolved</span>
              </div>

              {/* Pending */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Pending</span>
                <span className="text-2xl font-bold text-amber-700 mt-1 block">{summaryMetrics.pending}</span>
                <span className="text-[10px] text-amber-600 mt-0.5 block">Awaiting action</span>
              </div>

              {/* In-Progress */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
                <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider block">In-Progress</span>
                <span className="text-2xl font-bold text-sky-700 mt-1 block">{summaryMetrics.inProgress}</span>
                <span className="text-[10px] text-sky-600 mt-0.5 block">Attended & active</span>
              </div>

              {/* Overdue */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Overdue</span>
                <span className="text-2xl font-bold text-rose-700 mt-1 block">{summaryMetrics.overdue}</span>
                <span className="text-[10px] text-rose-600 mt-0.5 block">Past due date</span>
              </div>

              {/* Completion Rate */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">Rate</span>
                <span className="text-2xl font-bold text-indigo-700 mt-1 block">{summaryMetrics.completionRate}%</span>
                <span className="text-[10px] text-indigo-600 mt-0.5 block">Efficiency score</span>
              </div>
            </div>

            {/* 4. Action Export & Sharing Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300">
                  Ready to export <strong className="text-white font-bold">{filteredRecords.length}</strong> matching records:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isLoadingData || filteredRecords.length === 0}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Download PDF
                </button>

                {/* Download Excel */}
                <button
                  onClick={handleDownloadExcel}
                  disabled={isLoadingData || filteredRecords.length === 0}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet size={14} />
                  Download Excel
                </button>

                {/* Send Email */}
                <button
                  onClick={openEmailModal}
                  disabled={isLoadingData || filteredRecords.length === 0}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail size={14} />
                  Send Email
                </button>

                {/* Share WhatsApp */}
                <button
                  onClick={openWhatsappModal}
                  disabled={isLoadingData || filteredRecords.length === 0}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 size={14} />
                  Share WhatsApp
                </button>
              </div>
            </div>

            {/* 5. Detailed Preview Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Table search & pagination header */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search ID, Name, Contact, Product..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-600">
                  <span>Page Size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-slate-400 ml-2">
                    Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length}
                  </span>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th
                        onClick={() => handleSort("complaint_id")}
                        className="py-3 px-3 cursor-pointer hover:text-blue-600 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>Complaint ID</span>
                          <ArrowUpDown size={11} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("complaint_date")}
                        className="py-3 px-3 cursor-pointer hover:text-blue-600 transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          <ArrowUpDown size={11} />
                        </div>
                      </th>
                      <th className="py-3 px-3">Company</th>
                      <th className="py-3 px-3">Beneficiary</th>
                      <th className="py-3 px-3">District</th>
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">Assigned To</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {isLoadingData ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span>Querying live database records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle size={28} className="text-slate-300" />
                            <span className="font-medium text-slate-600">No records found matching current parameters.</span>
                            <span className="text-xs text-slate-400">Try choosing a wider date range or clearing your entity filters.</span>
                            <button
                              onClick={handleResetFilters}
                              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((r, idx) => {
                        const statusLower = String(r.status || "").toLowerCase();
                        const isCompleted =
                          statusLower === "completed" ||
                          statusLower === "approved-close" ||
                          String(r.last_attend_status || "").toLowerCase() === "completed";

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dueDate = r.resolved_date ? parseAnyDate(r.resolved_date) : null;
                        const isOverdue = !isCompleted && dueDate && dueDate < today;

                        return (
                          <tr key={r.id || idx} className="hover:bg-slate-50/75 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-blue-700 font-mono">
                              {r.complaint_id || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {formatDateDisplay(r.complaint_date || r.timestamp)}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-[140px]">
                              {r.company_name || r.company || "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-800">{r.beneficiary_name || "-"}</div>
                              <div className="text-[10px] text-slate-400">{r.contact_number || ""}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{r.district || "-"}</td>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]">{r.product || "-"}</td>
                            <td className="py-2.5 px-3">
                              {r.assign_to_vendor ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                  {r.vendor_name || "Vendor"}
                                </span>
                              ) : (
                                <span className="text-slate-700 font-medium">{r.technician_name || "Unassigned"}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  COMPLETED
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  OVERDUE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  {(r.status || "PENDING").toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                              {formatDateDisplay(r.resolved_date)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedRecordDetail(r);
                                  setRecordDetailModalOpen(true);
                                }}
                                title="View Record Details"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Tab: REPORT HISTORY */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  Report Generation & Dispatch History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail of reports exported, downloaded, or shared via Email & WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder="Filter history..."
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <button
                  onClick={loadReportHistory}
                  title="Refresh History"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoadingHistory ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Report Name</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Date Range</th>
                    <th className="py-2.5 px-3">Records</th>
                    <th className="py-2.5 px-3">Generated By</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Delivery Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {historyList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No report history recorded yet. Generate or download a report to begin logging.
                      </td>
                    </tr>
                  ) : (
                    historyList
                      .filter((h) => {
                        if (!historySearchTerm.trim()) return true;
                        const q = historySearchTerm.toLowerCase();
                        return (
                          (h.report_id || "").toLowerCase().includes(q) ||
                          (h.report_name || "").toLowerCase().includes(q) ||
                          (h.export_format || "").toLowerCase().includes(q)
                        );
                      })
                      .map((item, idx) => (
                        <tr key={item.report_id || idx} className="hover:bg-slate-50/75">
                          <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">
                            {item.report_id}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {item.report_name}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.export_format}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {item.date_range || "-"}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.total_records || 0}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.generated_by || "User"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.email_status ? (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                item.email_status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}>
                                Email: {item.email_status}
                              </span>
                            ) : item.whatsapp_status ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                                WA: {item.whatsapp_status}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">
                                Downloaded
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRegenerateFromHistory(item)}
                                title="Regenerate with these filters"
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              >
                                <RefreshCw size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteHistory(item.report_id)}
                                title="Delete entry"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL: SEND EMAIL                                             */}
        {/* ------------------------------------------------------------- */}
        {emailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Mail size={18} className="text-blue-600" />
                  <span>Send Report via Email</span>
                </div>
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {emailFeedback && (
                <div className={`p-3 rounded-xl text-xs border ${
                  emailFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : emailFeedback.type === "warning"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  <p className="font-semibold">{emailFeedback.message}</p>
                  {emailFeedback.mailtoUrl && (
                    <a
                      href={emailFeedback.mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-bold underline text-blue-700"
                    >
                      Open Email Client (Mailto Fallback) <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Recipient Email(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="e.g. manager@firm.com, admin@rbp.org"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Separate multiple emails with commas.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attachment Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["PDF", "Excel", "Both"].map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setEmailFormat(fmt)}
                        className={`py-2 rounded-xl text-center font-semibold border cursor-pointer ${
                          emailFormat === fmt
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message Body</label>
                  <textarea
                    rows={4}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={13} />
                    {isSendingEmail ? "Generating & Sending..." : "Send Email"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL: SHARE ON WHATSAPP                                      */}
        {/* ------------------------------------------------------------- */}
        {whatsappModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Share2 size={18} className="text-teal-600" />
                  <span>Share Report on WhatsApp</span>
                </div>
                <button
                  onClick={() => setWhatsappModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {whatsappFeedback && (
                <div className={`p-3 rounded-xl text-xs border ${
                  whatsappFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : whatsappFeedback.type === "info"
                    ? "bg-teal-50 text-teal-800 border-teal-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  <p className="font-semibold">{whatsappFeedback.message}</p>
                  {whatsappFeedback.waUrl && (
                    <a
                      href={whatsappFeedback.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-bold underline text-teal-700"
                    >
                      Open in WhatsApp Web <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              <form onSubmit={handleShareWhatsApp} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    WhatsApp Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="Enter 10-digit number (e.g. 9876543210)"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Indian numbers will automatically prepend country code +91.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Report Summary Message</label>
                  <textarea
                    rows={4}
                    value={whatsappNotes}
                    onChange={(e) => setWhatsappNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWhatsappModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSharingWhatsApp}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={13} />
                    {isSharingWhatsApp ? "Dispatching..." : "Send on WhatsApp"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL: RECORD DETAILS PREVIEW                                 */}
        {/* ------------------------------------------------------------- */}
        {recordDetailModalOpen && selectedRecordDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Complaint Details:</span>
                    <span className="font-mono text-blue-600">{selectedRecordDetail.complaint_id}</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Registered: {formatDateDisplay(selectedRecordDetail.complaint_date || selectedRecordDetail.timestamp)}
                  </span>
                </div>
                <button
                  onClick={() => setRecordDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beneficiary & Location</span>
                  <p><strong>Name:</strong> {selectedRecordDetail.beneficiary_name || "N/A"}</p>
                  <p><strong>Contact:</strong> {selectedRecordDetail.contact_number || "N/A"}</p>
                  <p><strong>District:</strong> {selectedRecordDetail.district || "N/A"}</p>
                  <p><strong>Block:</strong> {selectedRecordDetail.block || "N/A"}</p>
                  <p><strong>Village:</strong> {selectedRecordDetail.village || "N/A"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technical Details</span>
                  <p><strong>Company:</strong> {selectedRecordDetail.company_name || selectedRecordDetail.company || "N/A"}</p>
                  <p><strong>Product:</strong> {selectedRecordDetail.product || "N/A"}</p>
                  <p><strong>Make:</strong> {selectedRecordDetail.make || "N/A"}</p>
                  <p><strong>Rating / Voltage:</strong> {selectedRecordDetail.rating || selectedRecordDetail.system_voltage || "N/A"}</p>
                  <p><strong>Nature of Complaint:</strong> {selectedRecordDetail.nature_of_complaint || "N/A"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assignment & Staff</span>
                  <p><strong>Type:</strong> {selectedRecordDetail.assign_to_vendor ? "Vendor Assignment" : "Technician"}</p>
                  <p><strong>Assignee:</strong> {selectedRecordDetail.assign_to_vendor ? selectedRecordDetail.vendor_name : selectedRecordDetail.technician_name || "Unassigned"}</p>
                  <p><strong>Technician Contact:</strong> {selectedRecordDetail.technician_contact || "N/A"}</p>
                  <p><strong>Challan No:</strong> {selectedRecordDetail.challan_no || "N/A"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolution & Status</span>
                  <p><strong>Current Status:</strong> <span className="font-semibold text-blue-700">{selectedRecordDetail.status || "Pending"}</span></p>
                  <p><strong>Last Attend:</strong> {selectedRecordDetail.last_attend_status || "N/A"}</p>
                  <p><strong>Target Due Date:</strong> {formatDateDisplay(selectedRecordDetail.resolved_date)}</p>
                  <p><strong>Close Date:</strong> {formatDateDisplay(selectedRecordDetail.close_date)}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setRecordDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
