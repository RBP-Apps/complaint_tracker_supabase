"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ClipboardList,
  Search,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShieldCheck,
  MapPin,
  User,
  Phone
} from "lucide-react"
import * as XLSX from 'xlsx';
import supabase from "../utils/supabase";
import SearchableSelect from "./SearchableSelect";



function ComplaintsTable() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isExporting, setIsExporting] = useState(false);




  // Advanced Filter States
  const [filterInputs, setFilterInputs] = useState({
    complaintDate: "",
    resolvedDate: "",
    idNumber: "",
    beneficiaryName: "",
    village: "",
    block: "",
    district: "",
    timelineFilter: "All"
  })

  // Clear all filters
  const clearFilters = () => {
    setFilterInputs({
      complaintDate: "",
      resolvedDate: "",
      idNumber: "",
      beneficiaryName: "",
      village: "",
      block: "",
      district: "",
      timelineFilter: "All"
    })
    setSearchTerm("")
    setStatusFilter("All")
  }

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Active filters counter
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterInputs.complaintDate) count++
    if (filterInputs.resolvedDate) count++
    if (filterInputs.district) count++
    if (filterInputs.block) count++
    if (filterInputs.village) count++
    if (filterInputs.idNumber) count++
    if (filterInputs.beneficiaryName) count++
    if (filterInputs.timelineFilter && filterInputs.timelineFilter !== "All") count++
    return count
  }, [filterInputs])

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = String(status || "").toUpperCase()
    if (s === "APPROVED-CLOSE") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          APPROVED-CLOSE
        </span>
      )
    }
    if (s === "OK-OPEN") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          OK-OPEN
        </span>
      )
    }
    if (s === "REJECT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          REJECT
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        {status || "OPEN"}
      </span>
    )
  }

  // localStorage useEffect - ADD THIS
  useEffect(() => {
    const loggedInUser = localStorage.getItem('username')
    const loggedInRole = localStorage.getItem('userRole')

    console.log('Retrieved from localStorage:', { loggedInUser, loggedInRole })

    if (loggedInUser) {
      setUser(loggedInUser)
    }

    if (loggedInRole) {
      setUserRole(loggedInRole)
    }
  }, []) // Empty dependency array

  // Data fetching useEffect - KEEP WORKING VERSION
  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("FMS")
          .select("*")

        if (error) throw error

        const complaintData = []

        data.forEach((row) => {
          const complaint = {
            complaintId: row.complaint_id || "",
            companyName: row.company_name || "",
            modeOfCall: row.mode_of_call || "",
            idNumber: row.id_number || "",
            projectName: row.project_name || "",
            complaintNumber: row.complaint_number || "",
            complaintDate: row.complaint_date
              ? formatDateString(row.complaint_date)
              : "",
            rawComplaintDate: row.complaint_date || null,
            resolvedDate: row.resolved_date
              ? formatDateString(row.resolved_date)
              : "",
            rawResolvedDate: row.resolved_date || null,
            beneficiaryName: row.beneficiary_name || "",
            contactNumber: row.contact_number || "",
            village: row.village || "",
            block: row.block || "",
            district: row.district || "",
            product: row.product || "",
            make: row.make || "",
            rating: row.rating || "",
            qty: row.qty || "",
            insuranceType: row.insurance_type || "",
            natureOfComplaint: row.nature_of_complaint || "",
            technicianName: row.technician_name || "",
            technicianContact: row.technician_contact || "",
            assigneeWhatsApp: row.assignee_whatsapp_number || "",
            status: row.status || "Open",
            rawCloseDate: row.close_date || null,
            closeDate:
              row.status === "APPROVED-CLOSE" && row.close_date
                ? formatDateString(row.close_date)
                : "",
          }

          if (complaint.complaintId) {
            complaintData.push(complaint)
          }
        })

        setComplaints(complaintData)

      } catch (err) {
        console.error("Error fetching complaints data:", err)
        setError(err.message)
        setComplaints([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  const formatStatus = (statusValue) => {
    if (!statusValue) return "In Progress";

    const statusStr = String(statusValue);

    if (statusStr.includes("Completed") || statusStr.includes("COMPLETED")) {
      return "Completed";
    } else if (statusStr.includes("Progress") ||
      statusStr.includes("Date(") ||
      statusStr.includes("In Progress")) {
      return "In Progress";
    } else if (statusStr.includes("Insurance") ||
      statusStr.trim() === "") {
      return "Insurance";
    }

    return "In Progress";
  };

  const parseToDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
    if (typeof dateVal === 'number') {
      if (dateVal > 40000 && dateVal < 60000) {
        const googleEpoch = new Date(1899, 11, 30);
        return new Date(googleEpoch.getTime() + dateVal * 24 * 60 * 60 * 1000);
      }
      return new Date(dateVal);
    }
    if (typeof dateVal === 'string') {
      const trimmed = dateVal.trim();
      if (!trimmed) return null;
      const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (ddmmyyyy) {
        return new Date(parseInt(ddmmyyyy[3], 10), parseInt(ddmmyyyy[2], 10) - 1, parseInt(ddmmyyyy[1], 10));
      }
      if (trimmed.startsWith('Date(')) {
        const match = trimmed.match(/Date\((\d+),(\d+),(\d+)/);
        if (match) {
          return new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
        }
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const formatDateString = (dateValue) => {
    const d = parseToDate(dateValue);
    if (!d) return dateValue ? String(dateValue) : "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper to calculate timeline and days late
  const getTimelineInfo = (complaint) => {
    const rawResolved = complaint.rawResolvedDate || complaint.resolvedDate;
    const resolvedDate = parseToDate(rawResolved);
    if (!resolvedDate) {
      return {
        status: "no_date",
        isLate: false,
        days: 0,
        badgeText: "Not Set",
        formattedDate: "-",
        badgeClass: "bg-gray-100 text-gray-500 border-gray-200"
      };
    }

    const day = String(resolvedDate.getDate()).padStart(2, '0');
    const month = String(resolvedDate.getMonth() + 1).padStart(2, '0');
    const year = resolvedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const resolvedMidnight = new Date(year, resolvedDate.getMonth(), resolvedDate.getDate()).getTime();

    // If complaint is closed
    const isClosed = String(complaint.status || "").toUpperCase() === "APPROVED-CLOSE" || !!complaint.closeDate;
    if (isClosed && (complaint.rawCloseDate || complaint.closeDate)) {
      const closeDate = parseToDate(complaint.rawCloseDate || complaint.closeDate);
      if (closeDate) {
        const closeMidnight = new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate()).getTime();
        const diffDays = Math.round((closeMidnight - resolvedMidnight) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          return {
            status: "closed_late",
            isLate: true,
            days: diffDays,
            badgeText: `${diffDays}d late (Closed)`,
            formattedDate,
            badgeClass: "bg-purple-50 text-purple-700 border-purple-300"
          };
        } else {
          return {
            status: "closed_on_time",
            isLate: false,
            days: Math.abs(diffDays),
            badgeText: "Closed On Time",
            formattedDate,
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300"
          };
        }
      }
    }

    // If complaint is still pending / open
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((todayMidnight - resolvedMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        status: "overdue",
        isLate: true,
        days: diffDays,
        badgeText: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} late`,
        formattedDate,
        badgeClass: "bg-rose-100 text-rose-700 border-rose-300 font-bold"
      };
    } else if (diffDays === 0) {
      return {
        status: "due_today",
        isLate: false,
        days: 0,
        badgeText: "Due Today",
        formattedDate,
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300 font-semibold"
      };
    } else {
      const daysLeft = Math.abs(diffDays);
      return {
        status: "on_track",
        isLate: false,
        days: daysLeft,
        badgeText: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`,
        formattedDate,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300"
      };
    }
  };

  const getPriorityColor = (priority) => {
    const priorityStr = String(priority || "").toLowerCase();
    switch (priorityStr) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-blue-500"
      default: return "bg-green-500"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border border-green-200"
      case "In Progress": return "bg-blue-100 text-blue-800 border border-blue-200"
      case "Insurance": return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }



  // Role-based filtering function
  const getFilteredComplaintsByRole = () => {
    console.log('Current user:', user, 'Current role:', userRole) // Debug log

    let roleFilteredComplaints = complaints;

    // If no role is set, show all complaints
    if (!userRole) {
      console.log('No role set - showing all complaints') // Debug log
      return roleFilteredComplaints;
    }

    // If user is admin or user, show all complaints
    if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'user') {
      console.log('Admin/User role - showing all complaints') // Debug log
      return roleFilteredComplaints;
    }

    // If user is tech, filter by technician name
    if (userRole.toLowerCase() === 'tech') {
      if (user) {
        console.log('Tech role - filtering for user:', user) // Debug log
        roleFilteredComplaints = complaints.filter((complaint) => {
          const match = complaint.technicianName === user;
          console.log(`Comparing: "${complaint.technicianName}" === "${user}" = ${match}`) // Debug log
          return match;
        });
        console.log('Filtered complaints count:', roleFilteredComplaints.length) // Debug log
      } else {
        // Tech user with no username - show empty results
        console.log('Tech user with no username - showing no complaints') // Debug log
        roleFilteredComplaints = [];
      }
    }

    return roleFilteredComplaints;
  }

  // Handle Delete Complaint (Admin Only)
  const handleDelete = async (complaintId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("FMS")
        .delete()
        .eq("complaint_id", complaintId);

      if (error) throw error;

      alert("Record deleted successfully!");

      setComplaints(prev =>
        prev.filter(c => c.complaintId !== complaintId)
      );

    } catch (error) {
      console.error("Delete error:", error);
      alert(`Failed to delete record: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  // Memoized unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const getUnique = (key) => [...new Set(complaints.map(c => c[key]).filter(Boolean))].sort();

    return {
      idNumbers: getUnique('idNumber'),
      beneficiaries: getUnique('beneficiaryName'),
      districts: getUnique('district'),
      blocks: getUnique('block'),
      // Villages will be filtered dynamically based on block
      allVillages: getUnique('village')
    };
  }, [complaints]);

  // Derived villages based on selected block
  const availableVillages = useMemo(() => {
    if (!filterInputs.block) return uniqueValues.allVillages;
    return [...new Set(complaints
      .filter(c => c.block === filterInputs.block)
      .map(c => c.village)
      .filter(Boolean)
    )].sort();
  }, [complaints, filterInputs.block, uniqueValues.allVillages]);

  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Month is 0-indexed in JS Date
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  };

  const overdueCount = useMemo(() => {
    return complaints.filter(c => {
      const t = getTimelineInfo(c);
      return t.isLate && String(c.status || "").toUpperCase() !== "APPROVED-CLOSE";
    }).length;
  }, [complaints]);

  const filteredComplaints = getFilteredComplaintsByRole().filter((complaint) => {
    const search = searchTerm.toLowerCase();
    const timeline = getTimelineInfo(complaint);

    // 1. Text Search Filter
    const matchesSearch =
      String(complaint.beneficiaryName || "").toLowerCase().includes(search) ||
      String(complaint.complaintId || "").toLowerCase().includes(search) ||
      String(complaint.village || "").toLowerCase().includes(search) ||
      String(complaint.district || "").toLowerCase().includes(search) ||
      String(complaint.projectName || "").toLowerCase().includes(search) ||
      String(complaint.natureOfComplaint || "").toLowerCase().includes(search) ||
      String(complaint.complaintNumber || "").toLowerCase().includes(search) ||
      String(complaint.technicianName || "").toLowerCase().includes(search) ||
      timeline.badgeText.toLowerCase().includes(search) ||
      timeline.formattedDate.toLowerCase().includes(search);

    // 2. Status Filter
    const matchesStatus =
      statusFilter === "All" || complaint.status === statusFilter;

    // 3. Advanced Filters
    const matchesId = !filterInputs.idNumber || String(complaint.idNumber).toLowerCase().includes(filterInputs.idNumber.toLowerCase());

    const matchesBeneficiary = !filterInputs.beneficiaryName || String(complaint.beneficiaryName).toLowerCase().includes(filterInputs.beneficiaryName.toLowerCase());

    const matchesBlock = !filterInputs.block || complaint.block === filterInputs.block;

    const matchesDistrict = !filterInputs.district || complaint.district === filterInputs.district;

    const matchesVillage = !filterInputs.village || String(complaint.village).toLowerCase().includes(filterInputs.village.toLowerCase());

    // 4. Date Filter - Single Date Match
    let matchesDate = true;
    if (filterInputs.complaintDate) {
      const complaintDateObj = parseDateFromDDMMYYYY(complaint.complaintDate);
      if (complaintDateObj) {
        // Reset times for date comparison
        complaintDateObj.setHours(0, 0, 0, 0);
        const filterDateObj = new Date(filterInputs.complaintDate);
        filterDateObj.setHours(0, 0, 0, 0);

        if (complaintDateObj.getTime() !== filterDateObj.getTime()) {
          matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    // 5. Resolved Date Filter
    let matchesResolvedDate = true;
    if (filterInputs.resolvedDate) {
      const resolvedDateObj = parseDateFromDDMMYYYY(timeline.formattedDate);
      if (resolvedDateObj) {
        resolvedDateObj.setHours(0, 0, 0, 0);
        const filterDateObj = new Date(filterInputs.resolvedDate);
        filterDateObj.setHours(0, 0, 0, 0);

        if (resolvedDateObj.getTime() !== filterDateObj.getTime()) {
          matchesResolvedDate = false;
        }
      } else {
        matchesResolvedDate = false;
      }
    }

    // 6. Timeline Filter
    let matchesTimeline = true;
    if (filterInputs.timelineFilter && filterInputs.timelineFilter !== "All") {
      if (filterInputs.timelineFilter === "overdue") {
        matchesTimeline = timeline.isLate && String(complaint.status || "").toUpperCase() !== "APPROVED-CLOSE";
      } else if (filterInputs.timelineFilter === "due_today") {
        matchesTimeline = timeline.status === "due_today";
      } else if (filterInputs.timelineFilter === "on_track") {
        matchesTimeline = timeline.status === "on_track";
      } else if (filterInputs.timelineFilter === "closed") {
        matchesTimeline = String(complaint.status || "").toUpperCase() === "APPROVED-CLOSE";
      }
    }

    return matchesSearch && matchesStatus && matchesId && matchesBeneficiary && matchesBlock && matchesDistrict && matchesVillage && matchesDate && matchesResolvedDate && matchesTimeline;
  });

  // Export to Excel Function
  const handleExportToExcel = () => {
    try {
      setIsExporting(true);

      // Prepare data for export
      const exportData = filteredComplaints.map(item => {
        const timeline = getTimelineInfo(item);
        return {
          "Complaint ID": item.complaintId,
          "Complaint Date": item.complaintDate,
          "Resolved Date": timeline.formattedDate,
          "Timeline / Delay": timeline.badgeText,
          "Days Late": timeline.isLate ? timeline.days : 0,
          "ID Number": item.idNumber,
          "Beneficiary Name": item.beneficiaryName,
          "Contact Number": item.contactNumber,
          "Village": item.village,
          "Block": item.block,
          "District": item.district,
          "Project Name": item.projectName,
          "Nature of Complaint": item.natureOfComplaint,
          "Technician Name": item.technicianName,
          "Status": item.status,
          "Close Date": item.closeDate
        };
      });

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Create Workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");

      // Generate Excel File
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Dashboard_Complaints_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export Excel file.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col justify-center items-center h-64 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <div className="text-slate-500 font-medium text-sm">Loading complaints data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex justify-center items-center h-64 bg-white rounded-2xl border border-rose-200 shadow-xs">
        <div className="text-rose-600 text-sm font-semibold">Error loading data: {error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 transition-all">
      {/* Header Section */}
      <div className="mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Complaint Tracker
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {filteredComplaints.length} records
              </span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                  {overdueCount} Overdue (Late)
                </span>
              )}
              {userRole && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {userRole}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking of all filed complaints, timelines, technician assignments, and SLA delays
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="w-full sm:w-[160px]">
            <SearchableSelect
              placeholder="All Statuses"
              allOptionLabel="All Statuses"
              options={[
                { label: "OPEN", value: "Open" },
                { label: "APPROVED-CLOSE", value: "APPROVED-CLOSE" },
                { label: "OK-OPEN", value: "OK-OPEN" },
                { label: "REJECT", value: "Reject" },
              ]}
              value={statusFilter === "All" ? "" : statusFilter}
              onChange={(val) => setStatusFilter(val || "All")}
            />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search complaints..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showAdvancedFilters || activeFiltersCount > 0
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
            {showAdvancedFilters ? (
              <ChevronUp className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
            )}
          </button>

          {/* Export Button - Admin Only */}
          {userRole && userRole.toLowerCase() === 'admin' && (
            <button
              onClick={handleExportToExcel}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap ${
                isExporting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
              }`}
            >
              {isExporting ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Excel</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 mb-5 shadow-2xs">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                Advanced Filters
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {activeFiltersCount} applied
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {/* Complaint Date - Single Date Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Complaint Date</label>
              <input
                type="date"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={filterInputs.complaintDate}
                onChange={(e) => setFilterInputs({ ...filterInputs, complaintDate: e.target.value })}
              />
            </div>

            {/* Resolved Date - Single Date Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-blue-700">Resolved Date</label>
              <input
                type="date"
                className="w-full px-2.5 py-1.5 text-xs bg-blue-50/50 border border-blue-200 text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                value={filterInputs.resolvedDate}
                onChange={(e) => setFilterInputs({ ...filterInputs, resolvedDate: e.target.value })}
              />
            </div>

            {/* District Searchable Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">District</label>
              <SearchableSelect
                placeholder="All Districts"
                allOptionLabel="All Districts"
                options={uniqueValues.districts}
                value={filterInputs.district}
                onChange={(val) => setFilterInputs({ ...filterInputs, district: val })}
              />
            </div>

            {/* Block Searchable Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Block</label>
              <SearchableSelect
                placeholder="All Blocks"
                allOptionLabel="All Blocks"
                options={uniqueValues.blocks}
                value={filterInputs.block}
                onChange={(val) => setFilterInputs({ ...filterInputs, block: val, village: "" })}
              />
            </div>

            {/* Village Searchable Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Village</label>
              <SearchableSelect
                placeholder="Search Village..."
                allOptionLabel="All Villages"
                options={availableVillages}
                value={filterInputs.village}
                onChange={(val) => setFilterInputs({ ...filterInputs, village: val })}
              />
            </div>

            {/* ID Number Searchable Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">ID Number</label>
              <SearchableSelect
                placeholder="Search ID..."
                allOptionLabel="All ID Numbers"
                options={uniqueValues.idNumbers}
                value={filterInputs.idNumber}
                onChange={(val) => setFilterInputs({ ...filterInputs, idNumber: val })}
              />
            </div>

            {/* Beneficiary Name Searchable Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Beneficiary</label>
              <SearchableSelect
                placeholder="Search Name..."
                allOptionLabel="All Beneficiaries"
                options={uniqueValues.beneficiaries}
                value={filterInputs.beneficiaryName}
                onChange={(val) => setFilterInputs({ ...filterInputs, beneficiaryName: val })}
              />
            </div>

            {/* Timeline / Delay Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Timeline / Delay</label>
              <select
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                value={filterInputs.timelineFilter || "All"}
                onChange={(e) => setFilterInputs({ ...filterInputs, timelineFilter: e.target.value })}
              >
                <option value="All">All Timelines</option>
                <option value="overdue">⚠️ Overdue (Late Only)</option>
                <option value="due_today">⏳ Due Today</option>
                <option value="on_track">✓ On Track (Time Left)</option>
                <option value="closed">✓ Closed Complaints</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredComplaints.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-200">
              <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No complaints found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or resetting filters</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredComplaints.map((complaint, index) => (
                  <div
                    key={`complaint-${complaint.complaintId}-${index}`}
                    className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg font-mono">
                        {complaint.complaintId}
                      </span>
                      {renderStatusBadge(complaint.status)}
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Complaint Date</span>
                        <span className="text-slate-900 font-medium">{complaint.complaintDate || "-"}</span>
                      </div>
                      {/* Resolved Date Separately */}
                      {(() => {
                        const timeline = getTimelineInfo(complaint);
                        return (
                          <>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-blue-700 font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                Resolved Date
                              </span>
                              {timeline.formattedDate !== "-" ? (
                                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                  {timeline.formattedDate}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not Set</span>
                              )}
                            </div>

                            {/* Timeline / Delay Separately */}
                            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-1 mb-1">
                              <span className="text-slate-500 font-medium">Timeline / Delay</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${timeline.badgeClass}`}>
                                {timeline.isLate && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                                  </span>
                                )}
                                {timeline.badgeText}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Beneficiary</span>
                        <span className="text-slate-900 font-medium">{complaint.beneficiaryName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact</span>
                        <span className="text-slate-700 font-mono">{complaint.contactNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location</span>
                        <span className="text-slate-700 max-w-[200px] truncate text-right">
                          {[complaint.village, complaint.block, complaint.district].filter(Boolean).join(", ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Product</span>
                        <span className="text-slate-800">{complaint.product || "-"}</span>
                      </div>
                      {complaint.closeDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Close Date</span>
                          <span className="text-slate-900">{complaint.closeDate}</span>
                        </div>
                      )}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase font-semibold">Technician</div>
                          <div className="text-slate-800 font-medium">{complaint.technicianName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-[10px] uppercase font-semibold">Tech Contact</div>
                          <div className="text-slate-700 font-mono">{complaint.technicianContact}</div>
                        </div>
                      </div>

                      {userRole && userRole.toLowerCase() === 'admin' && (
                        <button
                          onClick={() => handleDelete(complaint.complaintId)}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Complaint</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200/90 rounded-xl shadow-2xs">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-bold text-slate-600 uppercase tracking-wider backdrop-blur-xs border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-3 whitespace-nowrap">Auto Complaint ID</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Complaint Date</th>
                      <th className="px-3.5 py-3 whitespace-nowrap bg-blue-50/90 text-blue-700 font-bold border-b-2 border-blue-400">
                        Resolved Date
                      </th>
                      <th className="px-3.5 py-3 whitespace-nowrap bg-rose-50/90 text-rose-700 font-bold border-b-2 border-rose-300">
                        Timeline / Delay
                      </th>
                      <th className="px-3.5 py-3 whitespace-nowrap">ID Number</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Beneficiary Name</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Contact Number</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Village</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Block</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">District</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Project Name</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Nature of Complaint</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Technician Name</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Status</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Close Date</th>
                      {userRole && userRole.toLowerCase() === 'admin' && (
                        <th className="px-3.5 py-3 whitespace-nowrap text-right">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredComplaints.map((complaint, index) => {
                      const timeline = getTimelineInfo(complaint);
                      return (
                        <tr key={`complaint-${complaint.complaintId}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3.5 py-3.5 whitespace-nowrap font-bold text-blue-600 font-mono">
                            {complaint.complaintId}
                          </td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                            {complaint.complaintDate}
                          </td>

                          {/* SEPARATE COLUMN 1: Resolved Date */}
                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            {timeline.formattedDate !== "-" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs font-mono">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                {timeline.formattedDate}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                Not Set
                              </span>
                            )}
                          </td>

                          {/* SEPARATE COLUMN 2: Timeline / Delay */}
                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            {timeline.formattedDate !== "-" ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide shadow-2xs ${timeline.badgeClass}`}>
                                {timeline.isLate ? (
                                  <>
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                                    </span>
                                    <span>⚠️ {timeline.badgeText}</span>
                                  </>
                                ) : timeline.status === 'due_today' ? (
                                  <>
                                    <span>⏳</span>
                                    <span>{timeline.badgeText}</span>
                                  </>
                                ) : timeline.status === 'on_track' ? (
                                  <>
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>{timeline.badgeText}</span>
                                  </>
                                ) : (
                                  <span>{timeline.badgeText}</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">-</span>
                            )}
                          </td>

                          <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">{complaint.idNumber}</td>
                          <td className="px-3.5 py-3.5 min-w-[130px] max-w-[200px] whitespace-normal break-words font-medium text-slate-900">{complaint.beneficiaryName}</td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap font-mono text-slate-600">{complaint.contactNumber}</td>
                          <td className="px-3.5 py-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words text-slate-600">{complaint.village}</td>
                          <td className="px-3.5 py-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words text-slate-600">{complaint.block}</td>
                          <td className="px-3.5 py-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words text-slate-600">{complaint.district}</td>
                          <td className="px-3.5 py-3.5 min-w-[120px] max-w-[180px] whitespace-normal break-words text-slate-600">{complaint.projectName}</td>
                          <td className="px-3.5 py-3.5 min-w-[200px] max-w-[320px] whitespace-normal break-words text-slate-700" title={complaint.natureOfComplaint}>
                            {complaint.natureOfComplaint}
                          </td>
                          <td className="px-3.5 py-3.5 min-w-[120px] max-w-[160px] whitespace-normal break-words text-slate-800">{complaint.technicianName}</td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            {renderStatusBadge(complaint.status)}
                          </td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                            {complaint.closeDate || "-"}
                          </td>
                          {userRole && userRole.toLowerCase() === 'admin' && (
                            <td className="px-3.5 py-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleDelete(complaint.complaintId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer ml-auto"
                                title="Delete Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplaintsTable
