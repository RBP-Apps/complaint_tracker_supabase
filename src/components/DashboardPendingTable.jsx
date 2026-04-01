"use client"

import { useState, useEffect, useMemo } from "react"
import * as XLSX from 'xlsx';
import supabase from "../utils/supabase";



function ComplaintsTable() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isExporting, setIsExporting] = useState(false);




  // Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec"


  // Advanced Filter States
  const [filterInputs, setFilterInputs] = useState({
    complaintDate: "",
    idNumber: "",
    beneficiaryName: "",
    village: "",
    block: "",
    district: ""
  })

  // Clear all filters
  const clearFilters = () => {
    setFilterInputs({
      complaintDate: "",
      idNumber: "",
      beneficiaryName: "",
      village: "",
      block: "",
      district: ""
    })
    setSearchTerm("")
    setStatusFilter("All")
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

  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    if (typeof dateValue === 'number' && dateValue > 40000) {
      const googleEpoch = new Date(1899, 11, 30);
      date = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    }
    else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        date = new Date(year, month, day);
      } else {
        return dateValue;
      }
    }
    else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    }
    else {
      return dateValue;
    }

    if (isNaN(date.getTime())) {
      return dateValue;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  const filteredComplaints = getFilteredComplaintsByRole().filter((complaint) => {
    const search = searchTerm.toLowerCase();

    // 1. Text Search Filter
    const matchesSearch =
      String(complaint.beneficiaryName || "").toLowerCase().includes(search) ||
      String(complaint.complaintId || "").toLowerCase().includes(search) ||
      String(complaint.village || "").toLowerCase().includes(search) ||
      String(complaint.district || "").toLowerCase().includes(search) ||
      String(complaint.projectName || "").toLowerCase().includes(search) ||
      String(complaint.natureOfComplaint || "").toLowerCase().includes(search) ||
      String(complaint.complaintNumber || "").toLowerCase().includes(search) ||
      String(complaint.technicianName || "").toLowerCase().includes(search);

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
        // If date is invalid but filter is set, it shouldn't match
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesId && matchesBeneficiary && matchesBlock && matchesDistrict && matchesVillage && matchesDate;
  });

  // Export to Excel Function
  const handleExportToExcel = () => {
    try {
      setIsExporting(true);

      // Prepare data for export
      const exportData = filteredComplaints.map(item => ({
        "Complaint ID": item.complaintId,
        "Complaint Date": item.complaintDate,
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
      }));

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
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading complaints data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold">
          Complaint Tracker
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredComplaints.length} records)
          </span>
          {userRole && (
            <span className="ml-2 text-sm font-normal text-blue-600">
              Role: {userRole}
            </span>
          )}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">

          <select
            className="w-full sm:w-[200px] px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Open">OPEN</option>
            <option value="APPROVED-CLOSE">APPROVED-CLOSE</option>
            <option value="OK-OPEN">OK-OPEN</option>
            <option value="Reject">REJECT</option>
          </select>

          <div className="relative flex items-center">
            <input
              type="search"
              placeholder="Search complaints..."
              className="pl-8 w-[200px] md:w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Export Button - Admin Only */}
          {userRole && userRole.toLowerCase() === 'admin' && (
            <button
              onClick={handleExportToExcel}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium transition-colors ${isExporting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Complaint Date - Single Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Complaint Date</label>
            <input
              type="date"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              value={filterInputs.complaintDate}
              onChange={(e) => setFilterInputs({ ...filterInputs, complaintDate: e.target.value })}
            />
          </div>

          {/* District Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">District</label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              value={filterInputs.district}
              onChange={(e) => setFilterInputs({ ...filterInputs, district: e.target.value })}
            >
              <option value="">All Districts</option>
              {uniqueValues.districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Block Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Block</label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              value={filterInputs.block}
              onChange={(e) => setFilterInputs({ ...filterInputs, block: e.target.value, village: "" })} // Reset village when block changes
            >
              <option value="">All Blocks</option>
              {uniqueValues.blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Village Searchable */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Village</label>
            <input
              list="villages-list"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Search Village..."
              value={filterInputs.village}
              onChange={(e) => setFilterInputs({ ...filterInputs, village: e.target.value })}
            />
            <datalist id="villages-list">
              {availableVillages.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          {/* ID Number Searchable */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">ID Number</label>
            <input
              list="id-numbers-list"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Search ID..."
              value={filterInputs.idNumber}
              onChange={(e) => setFilterInputs({ ...filterInputs, idNumber: e.target.value })}
            />
            <datalist id="id-numbers-list">
              {uniqueValues.idNumbers.map(id => <option key={id} value={id} />)}
            </datalist>
          </div>

          {/* Beneficiary Name Searchable */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Beneficiary</label>
            <input
              list="beneficiaries-list"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Search Name..."
              value={filterInputs.beneficiaryName}
              onChange={(e) => setFilterInputs({ ...filterInputs, beneficiaryName: e.target.value })}
            />
            <datalist id="beneficiaries-list">
              {uniqueValues.beneficiaries.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredComplaints.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No complaints found matching your criteria</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredComplaints.map((complaint, index) => (
                  <div key={`complaint-${complaint.complaintId}-${index}`} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{complaint.complaintId}</span>
                      <span className="text-xs px-2 py-1 rounded">{complaint.status}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Company</span>
                        <span className="text-gray-900 font-medium">{complaint.companyName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Complaint No</span>
                        <span className="text-gray-900">{complaint.complaintNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Date</span>
                        <span className="text-gray-900">{complaint.complaintDate}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Beneficiary</span>
                        <span className="text-gray-900 font-medium">{complaint.beneficiaryName}</span>
                      </div>
                      {complaint.closeDate && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Close Date</span>
                          <span className="text-gray-900">{complaint.closeDate}</span>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex-1">
                            <div className="text-gray-500 mb-0.5">Technician</div>
                            <div className="text-gray-900 font-medium">{complaint.technicianName}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 mb-0.5">Contact</div>
                            <div className="text-gray-900">{complaint.technicianContact}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Auto Complaint ID</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Complaint Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ID Number</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact Number</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Village</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Block</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">District</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nature of Complaint</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Technician Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Close Date</th>
                      {userRole && userRole.toLowerCase() === 'admin' && (
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredComplaints.map((complaint, index) => (
                      <tr key={`complaint-${complaint.complaintId}-${index}`} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{complaint.complaintId}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.complaintDate}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.idNumber}</td>


                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.beneficiaryName}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.contactNumber}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.village}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.block}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.district}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.projectName}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.natureOfComplaint}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.technicianName}</td>

                        <td className="px-3 py-4 whitespace-nowrap">{complaint.status}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {complaint.closeDate || "-"}
                        </td>
                        {userRole && userRole.toLowerCase() === 'admin' && (
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDelete(complaint.complaintId)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-150 flex items-center gap-1 ml-auto"
                              title="Delete Record"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} Complaints Tracker. All rights reserved. | Powered By - Botivate
      </div>
    </div>
  )
}

export default ComplaintsTable
