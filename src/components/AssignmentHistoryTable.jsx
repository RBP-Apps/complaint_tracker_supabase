"use client"

import { useState, useEffect } from "react"
import SearchableSelect from "./SearchableSelect"
import supabase from "../utils/supabase"

function AssignmentHistoryTable() {
  const [assignmentHistory, setAssignmentHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [modeOfCallFilter, setModeOfCallFilter] = useState("")

  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    // Handle ISO string format (2025-05-22T07:38:28.052Z)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    }
    // Handle date format (2025-05-21)
    else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets format like "5/22/2025, 2:32:51 PM"
    else if (typeof dateValue === 'string' && dateValue.includes('/') && dateValue.includes(',')) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets Date constructor format like "Date(2025,4,21)" or "Date(2025,4,22,14,32,51)"
    else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      // Extract the date parts from "Date(2025,4,21)" or "Date(2025,4,22,14,32,51)" format
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]); // Month is 0-indexed in this format
        const day = parseInt(match[3]);
        // Optional time components
        const hours = match[4] ? parseInt(match[4]) : 0;
        const minutes = match[5] ? parseInt(match[5]) : 0;
        const seconds = match[6] ? parseInt(match[6]) : 0;
        date = new Date(year, month, day, hours, minutes, seconds);
      } else {
        return dateValue;
      }
    }
    // Handle if it's already a Date object
    else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    }
    else {
      return dateValue; // Return as is if not a recognizable date format
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateValue; // Return original value if invalid date
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to extract unique companies for filter dropdown
  const getUniqueCompanies = () => {
    const companies = assignmentHistory
      .map(assignment => assignment.companyName)
      .filter(company => company && company.trim() !== "")
    return [...new Set(companies)].sort()
  }

  // Function to extract unique modes of call for filter dropdown
  const getUniqueModesOfCall = () => {
    const modes = assignmentHistory
      .map(assignment => assignment.modeOfCall)
      .filter(mode => mode && mode.trim() !== "")
    return [...new Set(modes)].sort()
  }

  // Function to fetch data from Supabase
  useEffect(() => {
    const fetchAssignmentHistory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("FMS")
          .select("*")
          .not("planned", "is", null)
          .not("actual", "is", null)
          .order("id", { ascending: false });

        if (error) throw error;

        const historyData = (data || []).map((row, index) => ({
          rowIndex: index + 1,
          complaintNo: row.complaint_id || "",
          date: formatDateString(row.complaint_date || row.timestamp),
          head: row.company_name || "",
          companyName: row.company_name || "",
          modeOfCall: row.mode_of_call || "",
          idNumber: row.id_number || "",
          projectName: row.project_name || "",
          complaintNumber: row.complaint_id || "",
          complaintDate: formatDateString(row.complaint_date),
          beneficiaryName: row.beneficiary_name || "",
          contactNumber: row.contact_number || "",
          village: row.village || "",
          block: row.block || "",
          district: row.district || "",
          product: row.product || "",
          make: row.make || "",
          systemVoltage: row.system_voltage || "",
          rating: row.rating || "",
          qty: row.qty || "",
          acDc: row.ac_dc || "",
          priority: row.rating || "",
          insuranceType: row.insurance_type || "",
          natureOfComplaint: row.nature_of_complaint || "",
          delay: row.delay || "",
          technicianName: row.technician_name || "",
          technicianContact: row.technician_contact || "",
          assigneeName: row.assignee_name || "",
          assigneeWhatsApp: row.assignee_whatsapp_number || "",
          location: row.location || "",
          complaintDetails: row.complaint_details || "",
          expectedCompletionDate: formatDateString(row.expected_completion_date),
          notesForTechnician: row.notes_for_technician || "",
        }));

        setAssignmentHistory(historyData);
      } catch (err) {
        console.error("Error fetching assignment history from Supabase:", err);
        setError(err.message);
        setAssignmentHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentHistory();
  }, []);

  // Function to get appropriate color for priority badges
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-blue-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  // Filter assignments based on search term
  const filteredAssignments = assignmentHistory.filter(
    (assignment) => {
      // Enhanced search functionality - searches across ALL fields
      const searchFields = [
        assignment.complaintNo,
        assignment.date,
        assignment.head,
        assignment.companyName,
        assignment.modeOfCall,
        assignment.idNumber,
        assignment.projectName,
        assignment.complaintNumber,
        assignment.complaintDate,
        assignment.beneficiaryName,
        assignment.contactNumber,
        assignment.village,
        assignment.block,
        assignment.district,
        assignment.product,
        assignment.make,
        assignment.systemVoltage,
        assignment.rating,
        assignment.qty,
        assignment.acDc,
        assignment.priority,
        assignment.insuranceType,
        assignment.natureOfComplaint,
        assignment.delay,
        assignment.technicianName,
        assignment.technicianContact,
        assignment.assigneeName,
        assignment.assigneeWhatsApp,
        assignment.location,
        assignment.complaintDetails,
        assignment.expectedCompletionDate,
        assignment.notesForTechnician
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
      const matchesCompany = companyFilter === "" || assignment.companyName === companyFilter
      const matchesModeOfCall = modeOfCallFilter === "" || assignment.modeOfCall === modeOfCallFilter

      return matchesSearchTerm && matchesCompany && matchesModeOfCall
    }
  )


  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading assignment history...</div>
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
        <h1 className="text-2xl font-bold">Assignment History</h1>

        <div className="relative">
          <input
            type="search"
            placeholder="Search across all fields (assignments, technicians, etc.)"
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

        {/* Company Name Filter */}
        <div className="w-full sm:w-[180px]">
          <SearchableSelect
            placeholder="All Companies"
            allOptionLabel="All Companies"
            options={getUniqueCompanyNames()}
            value={companyFilter}
            onChange={(val) => setCompanyFilter(val)}
          />
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
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredAssignments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No assignment history found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint Number
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Head
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Company Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Mode Of Call
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ID Number
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Project Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Beneficiary Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Contact Number
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Village
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Block
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    District
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Product
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Make
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    System Voltage
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Rating
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    AC/DC
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Priority
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Insurance Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Nature Of Complaint
                  </th>
                  {/* <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Delay
                  </th> */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Technician Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Technician Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Assignee Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Assignee WhatsApp
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Location
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint Details
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Expected Completion
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Notes for Technician
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment, index) => (
                  <tr key={assignment.complaintNo || index} className="hover:bg-gray-50">
                    {/* <td className="px-3 py-4 whitespace-nowrap font-medium text-sm">{assignment.complaintNo}</td> */}
                    {/* <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.date}</td> */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.complaintNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.complaintDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.head}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.companyName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.modeOfCall}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.idNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.projectName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{assignment.beneficiaryName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.contactNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.village}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.block}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.district}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.product}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.make}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.systemVoltage}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.rating}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.qty}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.acDc}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {assignment.priority && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getPriorityColor(assignment.priority)}`}>
                          {assignment.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.insuranceType}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={assignment.natureOfComplaint}>
                      {assignment.natureOfComplaint}
                    </td>
                    {/* <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.delay}</td> */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{assignment.technicianName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.technicianContact}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.assigneeName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.assigneeWhatsApp}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.location}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={assignment.complaintDetails}>
                      {assignment.complaintDetails}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{assignment.expectedCompletionDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={assignment.notesForTechnician}>
                      {assignment.notesForTechnician}
                    </td>
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

export default AssignmentHistoryTable