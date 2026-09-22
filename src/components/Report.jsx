"use client"

import { useState, useEffect } from "react"
import SearchableSelect from "./SearchableSelect"
import supabase from "../utils/supabase"

function ReportsTable() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [modeOfCallFilter, setModeOfCallFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    if (typeof dateValue === 'number' && dateValue > 40000) {
      const googleEpoch = new Date(1899, 11, 30);
      date = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    } else if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('/') && dateValue.includes(',')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    } else {
      return String(dateValue);
    }

    if (isNaN(date.getTime())) {
      return String(dateValue);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to extract unique modes of call for filter dropdown
  const getUniqueModeOfCalls = () => {
    const modes = reports
      .map(report => report.modeOfCall)
      .filter(mode => mode && mode.trim() !== "")
    return [...new Set(modes)].sort()
  }

  // Function to extract unique statuses for filter dropdown
  const getUniqueStatuses = () => {
    const statuses = reports
      .map(report => report.status)
      .filter(status => status && status.trim() !== "")
    return [...new Set(statuses)].sort()
  }

  // Function to fetch data from Supabase
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let { data, error: repError } = await supabase
          .from("Reports")
          .select("*")
          .order("id", { ascending: false });

        if (repError) {
          const fallback = await supabase
            .from("reports")
            .select("*")
            .order("id", { ascending: false });
          if (!fallback.error) {
            data = fallback.data;
            repError = null;
          }
        }

        if (!data || data.length === 0) {
          const [{ data: fmsData, error: fmsErr }, { data: trackerData }] = await Promise.all([
            supabase.from("FMS").select("*").order("id", { ascending: false }),
            supabase.from("Tracker").select("*").order("id", { ascending: false }),
          ]);

          if (fmsErr) throw fmsErr;

          const trackerMap = new Map();
          (trackerData || []).forEach((t) => {
            if (t.complaint_id && !trackerMap.has(t.complaint_id)) {
              trackerMap.set(t.complaint_id, t);
            }
          });

          const reportData = (fmsData || []).map((row, index) => {
            const t = trackerMap.get(row.complaint_id) || {};
            const dateStr = formatDateString(row.complaint_date || row.timestamp);
            let srMonth = "";
            if (dateStr && dateStr.includes("/")) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                srMonth = d.toLocaleString("default", { month: "short" });
              }
            }

            return {
              slNo: index + 1,
              modeOfCall: row.mode_of_call || "",
              srLogDate: dateStr,
              complaintNo: row.complaint_id || "",
              beneficiaryInfo: [row.beneficiary_name, row.contact_number ? `(${row.contact_number})` : ""].filter(Boolean).join(" "),
              village: row.village || "",
              block: row.block || "",
              district: row.district || "",
              srMonth,
              projectName: row.project_name || "",
              product: row.product || "",
              make: row.make || "",
              rating: row.rating || "",
              productSlNo: row.product_sl_no || "",
              surfaceSubmersible: row.ac_dc || "",
              observation: row.nature_of_complaint || "",
              actionTaken: t.action_taken || row.action_taken || "",
              techName: row.technician_name || t.technician_name || "",
              techContactNo: row.technician_contact || t.technician_number || "",
              attendDate: formatDateString(row.challan_date || row.planned1 || t.actual),
              closedDate: formatDateString(row.close_date || row.actual1),
              status: row.status || t.tracker_status || "Pending",
              remarks: row.notes_for_technician || t.remark || "",
            };
          });

          setReports(reportData);
        } else {
          const reportData = (data || []).map((row, index) => ({
            slNo: row.sl_no || index + 1,
            modeOfCall: row.mode_of_call || "",
            srLogDate: formatDateString(row.sr_log_date || row.created_at),
            complaintNo: row.complaint_no || row.complaint_id || "",
            beneficiaryInfo: row.beneficiary_info || row.beneficiary_name || "",
            village: row.village || "",
            block: row.block || "",
            district: row.district || "",
            srMonth: row.sr_month || "",
            projectName: row.project_name || "",
            product: row.product || "",
            make: row.make || "",
            rating: row.rating || "",
            productSlNo: row.product_sl_no || "",
            surfaceSubmersible: row.surface_submersible || "",
            observation: row.observation || "",
            actionTaken: row.action_taken || "",
            techName: row.tech_name || row.technician_name || "",
            techContactNo: row.tech_contact_no || row.technician_contact || "",
            attendDate: formatDateString(row.attend_date),
            closedDate: formatDateString(row.closed_date),
            status: row.status || "",
            remarks: row.remarks || "",
          }));

          setReports(reportData);
        }
      } catch (err) {
        console.error("Error fetching reports from Supabase:", err);
        setError(err.message);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Filter reports based on search term and filters
  const filteredReports = reports.filter(
    (report) => {
      // Enhanced search functionality - searches across ALL fields
      const searchFields = [
        report.slNo,
        report.modeOfCall,
        report.srLogDate,
        report.complaintNo,
        report.beneficiaryInfo,
        report.village,
        report.block,
        report.district,
        report.srMonth,
        report.projectName,
        report.product,
        report.make,
        report.rating,
        report.productSlNo,
        report.surfaceSubmersible,
        report.observation,
        report.actionTaken,
        report.techName,
        report.techContactNo,
        report.attendDate,
        report.closedDate,
        report.status,
        report.remarks
      ]

      // Function to normalize text for better searching
      const normalizeText = (text) => {
        if (!text) return ""
        return text.toString().toLowerCase().trim()
      }

      // Function to check if search term matches any field
      const matchesSearch = () => {
        if (!searchTerm || searchTerm.trim() === "") return true

        const normalizedSearchTerm = normalizeText(searchTerm)

        // Split search term by spaces to allow multiple word search
        const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0)

        // Check if all search words are found in at least one field
        return searchWords.every(word =>
          searchFields.some(field =>
            normalizeText(field).includes(word)
          )
        )
      }

      // Filter conditions
      const matchesSearchTerm = matchesSearch()
      const matchesModeOfCall = modeOfCallFilter === "" || report.modeOfCall === modeOfCallFilter
      const matchesStatus = statusFilter === "" || report.status === statusFilter

      return matchesSearchTerm && matchesModeOfCall && matchesStatus
    }
  )

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading reports data...</div>
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
    <div className="p-4">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl font-bold">Reports</h1>

        <div className="relative">
          <input
            type="search"
            placeholder="Search across all fields..."
            className="pl-8 w-full sm:w-[280px] lg:w-[320px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-2 h-6 w-6 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded-full hover:bg-gray-100"
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Mode of Call Filter */}
        <div className="w-full sm:w-[180px]">
          <SearchableSelect
            placeholder="All Modes"
            allOptionLabel="All Modes"
            options={getUniqueModeOfCalls()}
            value={modeOfCallFilter}
            onChange={(val) => setModeOfCallFilter(val)}
          />
        </div>

        {/* Status Filter */}
        {/* <select
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {getUniqueStatuses().map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select> */}
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[500px] -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredReports.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No reports found matching your criteria</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Sl No.
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Mode of Call
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    SR Log Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint No.
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Beneficiary Name & Contact
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Village
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Block
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    District
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    SR Month
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Project Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Make
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Rating
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Product SL No.
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Surface/Submersible
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Observation
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Action Taken
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tech Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tech Contact No
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Attend Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Closed Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <tr key={`report-${report.slNo}-${index}`} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.slNo}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.modeOfCall}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.srLogDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.complaintNo}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.beneficiaryInfo}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.village}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.block}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.district}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.srMonth}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.projectName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.product}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.make}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.rating}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.productSlNo}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.surfaceSubmersible}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.observation}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.actionTaken}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.techName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.techContactNo}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.attendDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.closedDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${report.status === "Closed" ? "bg-green-100 text-green-800" :
                        report.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"

                        }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{report.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsTable