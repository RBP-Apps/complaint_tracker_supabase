import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import supabase from "./supabase";

/**
 * Format a Date object to YYYY-MM-DD
 */
export const formatDateISO = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format a Date object or string to DD/MM/YYYY
 */
export const formatDateDisplay = (d) => {
  if (!d) return "N/A";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parse any date representation into standard Date object
 */
export const parseAnyDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "number" && dateVal > 40000) {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + dateVal * 24 * 60 * 60 * 1000);
  }
  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Get date presets based on Report Type
 */
export const getPresetDateRange = (reportType, params = {}) => {
  const now = new Date();
  const year = params.year || now.getFullYear();
  const month = params.month !== undefined ? params.month : now.getMonth();

  switch (reportType) {
    case "Daily Report": {
      const target = params.selectedDate ? new Date(params.selectedDate) : now;
      const start = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0);
      const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59);
      return { start, end, label: `Day: ${formatDateDisplay(start)}` };
    }
    case "Weekly Report": {
      const curr = params.selectedDate ? new Date(params.selectedDate) : now;
      const day = curr.getDay(); // 0 is Sun
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(curr.setDate(diffToMonday));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `Week: ${formatDateDisplay(start)} to ${formatDateDisplay(end)}` };
    }
    case "Monthly Report": {
      const start = new Date(year, month, 1, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return { start, end, label: `Month: ${monthNames[month]} ${year}` };
    }
    case "Quarterly Report": {
      const quarter = params.quarter || Math.floor(now.getMonth() / 3) + 1; // 1, 2, 3, 4
      const startMonth = (quarter - 1) * 3;
      const start = new Date(year, startMonth, 1, 0, 0, 0);
      const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
      return { start, end, label: `Quarter: Q${quarter} (${year})` };
    }
    case "Yearly Report": {
      const start = new Date(year, 0, 1, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59);
      return { start, end, label: `Year: ${year}` };
    }
    case "Custom Date Range Report": {
      const start = params.startDate ? new Date(params.startDate) : null;
      const end = params.endDate ? new Date(params.endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        label: start && end
          ? `${formatDateDisplay(start)} to ${formatDateDisplay(end)}`
          : "Custom Range"
      };
    }
    default: {
      return { start: null, end: null, label: "All Records / Preset" };
    }
  }
};

/**
 * Calculate KPI summary metrics for records
 */
export const calculateReportSummary = (records = []) => {
  const total = records.length;
  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let overdue = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  records.forEach((r) => {
    const status = String(r.status || "").trim().toLowerCase();
    const lastAttend = String(r.last_attend_status || "").trim().toLowerCase();
    const isCompleted =
      status === "completed" ||
      status === "approved-close" ||
      lastAttend === "completed" ||
      lastAttend === "close";

    if (isCompleted) {
      completed++;
    } else {
      // Check if in progress
      if (
        status === "in-progress" ||
        status === "attended" ||
        lastAttend === "in-progress" ||
        lastAttend === "attended"
      ) {
        inProgress++;
      } else {
        pending++;
      }

      // Check if overdue
      const dueDate = r.resolved_date ? parseAnyDate(r.resolved_date) : null;
      if (dueDate && dueDate < today) {
        overdue++;
      }
    }
  });

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    completionRate,
  };
};

/**
 * Generate Professional PDF Report using jsPDF + autoTable
 */
export const generateReportPDF = async ({
  reportTitle = "Complaint Tracker Report",
  reportType = "General Report",
  dateRangeStr = "All Dates",
  appliedFilters = {},
  summary = {},
  records = [],
  generatedBy = "System",
  companyName = "Complaints Management & Tracker System",
  saveToFile = true,
  filename = "report.pdf",
}) => {
  // Use Landscape for wide table view
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary brand palette
  const primaryColor = [30, 58, 138]; // Deep Navy
  const secondaryColor = [51, 65, 85]; // Slate
  const lightBg = [248, 250, 252];
  const accentColor = [37, 99, 235]; // Royal Blue

  // 1. Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 48, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName.toUpperCase(), 30, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("Official Service & Performance Report", 30, 39);

  // Generation timestamp on right
  const nowStr = new Date().toLocaleString();
  doc.text(`Generated: ${nowStr} | By: ${generatedBy}`, pageWidth - 30, 28, { align: "right" });

  // 2. Report Sub-Header
  doc.setTextColor(...secondaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(reportTitle, 30, 75);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Type: ${reportType}   |   Date Range: ${dateRangeStr}`, 30, 90);

  // 3. Summary Metric Cards Row
  const startY = 105;
  const cardWidth = (pageWidth - 60 - 24) / 5;
  const cardHeight = 44;

  const metrics = [
    { label: "Total Records", value: summary.total || 0, color: [30, 58, 138] },
    { label: "Completed", value: summary.completed || 0, color: [16, 185, 129] },
    { label: "Pending", value: summary.pending || 0, color: [245, 158, 11] },
    { label: "In-Progress", value: summary.inProgress || 0, color: [59, 130, 246] },
    { label: "Overdue", value: summary.overdue || 0, color: [239, 68, 68] },
  ];

  metrics.forEach((m, idx) => {
    const x = 30 + idx * (cardWidth + 6);
    doc.setFillColor(...lightBg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, "FD");

    // Indicator bar
    doc.setFillColor(...m.color);
    doc.rect(x, startY, 4, cardHeight, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 10, startY + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...m.color);
    doc.text(String(m.value), x + 10, startY + 34);
  });

  // 4. Applied Filters Line
  const filterEntries = Object.entries(appliedFilters)
    .filter(([_, v]) => v && v !== "all" && v !== "")
    .map(([k, v]) => `${k}: ${v}`);

  const filterText = filterEntries.length > 0
    ? `Active Filters: ${filterEntries.join(" | ")}`
    : "Active Filters: None (Showing all matching scope)";

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(filterText, 30, startY + cardHeight + 14);

  // 5. Detailed Records Table
  const tableColumns = [
    { header: "#", dataKey: "index" },
    { header: "Complaint ID", dataKey: "complaint_id" },
    { header: "Date", dataKey: "complaint_date" },
    { header: "Company", dataKey: "company_name" },
    { header: "Beneficiary", dataKey: "beneficiary_name" },
    { header: "Contact", dataKey: "contact_number" },
    { header: "District", dataKey: "district" },
    { header: "Product", dataKey: "product" },
    { header: "Technician / Vendor", dataKey: "assignee" },
    { header: "Status", dataKey: "status" },
    { header: "Resolved Date", dataKey: "resolved_date" },
  ];

  const tableRows = records.map((r, i) => {
    const assignee = r.assign_to_vendor
      ? (r.vendor_name || "Assigned to Vendor")
      : (r.technician_name || "Unassigned");

    return {
      index: i + 1,
      complaint_id: r.complaint_id || "N/A",
      complaint_date: formatDateDisplay(r.complaint_date || r.timestamp),
      company_name: r.company_name || r.company || "-",
      beneficiary_name: r.beneficiary_name || "-",
      contact_number: r.contact_number || "-",
      district: r.district || "-",
      product: r.product || "-",
      assignee,
      status: (r.status || "Pending").toUpperCase(),
      resolved_date: formatDateDisplay(r.resolved_date),
    };
  });

  autoTable(doc, {
    startY: startY + cardHeight + 22,
    margin: { left: 30, right: 30, bottom: 40 },
    columns: tableColumns,
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      index: { cellWidth: 20, halign: "center" },
      complaint_id: { cellWidth: 55, fontStyle: "bold" },
      complaint_date: { cellWidth: 50 },
      company_name: { cellWidth: 70 },
      beneficiary_name: { cellWidth: 80 },
      contact_number: { cellWidth: 60 },
      district: { cellWidth: 55 },
      product: { cellWidth: 65 },
      assignee: { cellWidth: 80 },
      status: { cellWidth: 55 },
      resolved_date: { cellWidth: 55 },
    },
    didDrawPage: (data) => {
      // Footer with page numbering
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 30, pageHeight - 16, { align: "right" });
      doc.text(
        "Confidential - Complaints Tracker Management System",
        30,
        pageHeight - 16
      );
    },
  });

  if (saveToFile) {
    doc.save(filename);
  }

  // Return base64 and blob for email / sharing
  const pdfBlob = doc.output("blob");
  const pdfBase64 = doc.output("datauristring").split(",")[1];

  return { doc, blob: pdfBlob, base64: pdfBase64 };
};

/**
 * Generate Real Multi-Sheet Excel Workbook (.xlsx) using xlsx
 */
export const generateReportExcel = ({
  reportTitle = "Complaint Tracker Report",
  reportType = "General Report",
  dateRangeStr = "All Dates",
  appliedFilters = {},
  summary = {},
  records = [],
  generatedBy = "System",
  filename = "report.xlsx",
  saveToFile = true,
}) => {
  const wb = XLSX.utils.book_new();

  // 1. Report Summary Sheet
  const summaryData = [
    ["COMPLAINTS TRACKER - OFFICIAL REPORT"],
    [],
    ["Report Title", reportTitle],
    ["Report Type", reportType],
    ["Date Range", dateRangeStr],
    ["Generated On", new Date().toLocaleString()],
    ["Generated By", generatedBy],
    [],
    ["SUMMARY METRICS", "COUNT"],
    ["Total Records", summary.total || 0],
    ["Completed Records", summary.completed || 0],
    ["Pending Records", summary.pending || 0],
    ["In-Progress Records", summary.inProgress || 0],
    ["Overdue Records", summary.overdue || 0],
    ["Completion Percentage", `${summary.completionRate || 0}%`],
    [],
    ["APPLIED FILTERS"],
    ...Object.entries(appliedFilters)
      .filter(([_, v]) => v && v !== "all" && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  // Column widths
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Report Summary");

  // 2. Detailed Data Sheet
  const detailHeaders = [
    "S.No",
    "Complaint ID",
    "Complaint Date",
    "Company Name",
    "Project Name",
    "Beneficiary Name",
    "Contact Number",
    "Village",
    "Block",
    "District",
    "Product",
    "Make",
    "Rating / System Voltage",
    "Nature of Complaint",
    "Assigned To (Vendor/Technician)",
    "Technician Contact",
    "Status",
    "Last Attend Status",
    "Resolved Date",
    "Challan No",
    "Reporter Name",
    "Created At",
  ];

  const detailRows = records.map((r, i) => [
    i + 1,
    r.complaint_id || "",
    formatDateDisplay(r.complaint_date || r.timestamp),
    r.company_name || r.company || "",
    r.project_name || "",
    r.beneficiary_name || "",
    r.contact_number || "",
    r.village || "",
    r.block || "",
    r.district || "",
    r.product || "",
    r.make || "",
    r.rating || r.system_voltage || "",
    r.nature_of_complaint || "",
    r.assign_to_vendor ? (r.vendor_name || "Vendor") : (r.technician_name || "Technician"),
    r.technician_contact || "",
    r.status || "Pending",
    r.last_attend_status || "",
    formatDateDisplay(r.resolved_date),
    r.challan_no || "",
    r.reporter_name || "",
    formatDateDisplay(r.created_at),
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  wsDetail["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 25 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, "Detailed Data");

  if (saveToFile) {
    XLSX.writeFile(wb, filename);
  }

  // Generate base64 string for email attachment
  const excelBase64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

  return { wb, base64: excelBase64 };
};

/**
 * Save report history entry to Supabase and LocalStorage fallback
 */
export const saveReportHistory = async (historyEntry) => {
  const timestamp = new Date().toISOString();
  const reportId = historyEntry.reportId || `REP-${Date.now().toString().slice(-6)}`;

  const recordToSave = {
    report_id: reportId,
    report_name: historyEntry.reportName || "Generated Report",
    report_type: historyEntry.reportType || "Custom",
    date_range: historyEntry.dateRange || "All Time",
    applied_filters: historyEntry.appliedFilters || {},
    summary_metrics: historyEntry.summary || {},
    total_records: historyEntry.totalRecords || 0,
    generated_by: historyEntry.generatedBy || "User",
    export_format: historyEntry.exportFormat || "PDF",
    file_url: historyEntry.fileUrl || null,
    email_recipient: historyEntry.emailRecipient || null,
    email_status: historyEntry.emailStatus || null,
    whatsapp_recipient: historyEntry.whatsappRecipient || null,
    whatsapp_status: historyEntry.whatsappStatus || null,
    status: historyEntry.status || "Completed",
    created_at: timestamp,
  };

  // 1. Save to LocalStorage cache immediately
  try {
    const existing = JSON.parse(localStorage.getItem("report_history_cache") || "[]");
    const updated = [recordToSave, ...existing.filter((item) => item.report_id !== reportId)].slice(0, 100);
    localStorage.setItem("report_history_cache", JSON.stringify(updated));
  } catch (lsErr) {
    console.warn("LocalStorage save error:", lsErr);
  }

  // 2. Try saving to Supabase report_history table
  try {
    const { data, error } = await supabase
      .from("report_history")
      .insert([recordToSave])
      .select();

    if (error) {
      console.warn("Could not write to Supabase report_history table (using local cache):", error.message);
    }
    return data ? data[0] : recordToSave;
  } catch (err) {
    console.warn("Supabase report_history insert error:", err);
    return recordToSave;
  }
};

/**
 * Fetch report history from Supabase with LocalStorage fallback
 */
export const fetchReportHistory = async () => {
  try {
    const { data, error } = await supabase
      .from("report_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw error || new Error("No data returned");
    }

    // Merge/sync with local cache
    const local = JSON.parse(localStorage.getItem("report_history_cache") || "[]");
    const idSet = new Set(data.map((r) => r.report_id));
    const merged = [...data];

    local.forEach((item) => {
      if (!idSet.has(item.report_id)) {
        merged.push(item);
      }
    });

    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return merged;
  } catch (err) {
    console.warn("Falling back to local report history cache:", err?.message || err);
    const local = JSON.parse(localStorage.getItem("report_history_cache") || "[]");
    return local;
  }
};

/**
 * Delete a report history entry
 */
export const deleteReportHistory = async (reportId) => {
  try {
    await supabase.from("report_history").delete().eq("report_id", reportId);
  } catch (err) {
    console.warn("Could not delete from Supabase report_history table:", err);
  }

  try {
    const local = JSON.parse(localStorage.getItem("report_history_cache") || "[]");
    const updated = local.filter((r) => r.report_id !== reportId);
    localStorage.setItem("report_history_cache", JSON.stringify(updated));
  } catch (lsErr) {
    console.warn("LocalStorage delete error:", lsErr);
  }

  return true;
};
