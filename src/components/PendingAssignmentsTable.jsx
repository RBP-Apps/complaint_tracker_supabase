"use client"

import { useState, useEffect } from "react"
import AssignComplaintForm from "./AssignComplaintForm"
import supabase from "../utils/supabase"

function PendingAssignmentsTable() {
  const [pendingComplaints, setPendingComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [selectedComplaintData, setSelectedComplaintData] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [modeOfCallFilter, setModeOfCallFilter] = useState("")


  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    // Handle Google Sheets serial date numbers (like 45466 for 21/06/2025)
    if (typeof dateValue === 'number' && dateValue > 40000) {
      // Google Sheets date serial number starts from 1900-01-01
      const googleEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      date = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    }
    // Handle ISO string format (2025-05-22T07:38:28.052Z)
    else if (typeof dateValue === 'string' && dateValue.includes('T')) {
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
    // Handle DD/MM/YYYY format
    else if (typeof dateValue === 'string' && dateValue.includes('/') && !dateValue.includes(',')) {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY format
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateValue);
      }
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

  const getUniqueCompanyNames = () => {
    const companies = pendingComplaints
      .map(complaint => complaint.companyName)
      .filter(name => name && name.trim() !== "")
    return [...new Set(companies)].sort()
  }

  const getUniqueModeOfCalls = () => {
    const modes = pendingComplaints
      .map(complaint => complaint.modeOfCall)
      .filter(mode => mode && mode.trim() !== "")
    return [...new Set(modes)].sort()
  }

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch FMS from Supabase: planned not null, actual is null (pending assignment)
        const { data, error } = await supabase
          .from("FMS")
          .select("*")
          .not("planned", "is", null)
          .is("actual", null)

        if (error) throw error

        const complaintData = (data || [])
          .filter(row => row.complaint_id)
          .map((row, index) => ({
            actualRowIndex: index + 1,
            timestamp: row.timestamp || "",
            complaintNo: row.complaint_id || "",
            date: row.timestamp || "",
            head: row.company_name || "",
            companyName: row.company_name || "",
            modeOfCall: row.mode_of_call || "",
            idNumber: row.id_number || "",
            projectName: row.project_name || "",
            complaintNumber: row.complaint_id || "",
            complaintDate: row.complaint_date || "",
            beneficiaryName: row.beneficiary_name || "",
            contactNumber: row.contact_number || "",
            village: row.village || "",
            block: row.block || "",
            district: row.district || "",
            product: row.product || "",
            make: row.make || "",
            system: row.system_voltage || "",
            voltageRating: row.rating || "",
            qty: row.qty || "",
            priority: row.rating || "Medium",
            insuranceType: row.insurance_type || "",
            natureOfComplaint: row.nature_of_complaint || "",
            status: "Pending",
            fullRowData: row
          }))

        setPendingComplaints(complaintData)
      } catch (err) {
        console.error("Error fetching complaints data:", err)
        setError(err.message)
        setPendingComplaints([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchComplaints()
  }, [])
  const handleAssignComplaint = async (complaintId, assigneeData) => {
    try {
      console.log("Starting assignment for complaint:", complaintId);

      // Update FMS table in Supabase directly
      const { error } = await supabase
        .from("FMS")
        .update({
          technician_name: assigneeData.technicianName || "",
          technician_contact: assigneeData.technicianContact || "",
          assignee_name: assigneeData.assigneeName || "",
          assignee_whatsapp_number: assigneeData.assigneeWhatsapp || "",
          location: assigneeData.location || "",
          complaint_details: assigneeData.complaintDetails || "",
          expected_completion_date: assigneeData.expectedCompletionDate || null,
          notes_for_technician: assigneeData.notesForTechnician || "",
          actual: new Date().toISOString()
        })
        .eq("complaint_id", complaintId)

      if (error) throw error

      setPendingComplaints(prev => prev.filter(c => c.complaintNo !== complaintId))
      setIsDialogOpen(false)
      alert(`Complaint ${complaintId} assigned successfully!`)
    } catch (error) {
      console.error("Assignment error:", error)
      alert(`Failed to assign: ${error.message}`)
    }
  };
  // ... (keep rest of the component code the same)
  // Function to get appropriate color for priority badges
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-red-500"
      case "High": return "bg-orange-500"
      case "Medium": return "bg-blue-500"
      default: return "bg-green-500"
    }
  }

  // Filter complaints based on search term
  const filteredComplaints = pendingComplaints.filter(
    (complaint) => {
      // Enhanced search functionality - searches across ALL fields
      const searchFields = [
        complaint.complaintNo,
        complaint.date,
        complaint.head,
        complaint.companyName,
        complaint.modeOfCall,
        complaint.idNumber,
        complaint.projectName,
        complaint.complaintNumber,
        complaint.complaintDate,
        complaint.beneficiaryName,
        complaint.contactNumber,
        complaint.village,
        complaint.block,
        complaint.district,
        complaint.product,
        complaint.make,
        complaint.system,
        complaint.voltageRating,
        complaint.qty,
        complaint.acDc,
        complaint.priority,
        complaint.insuranceType,
        complaint.natureOfComplaint,
        complaint.status
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
      const matchesCompany = companyFilter === "" || complaint.companyName === companyFilter
      const matchesModeOfCall = modeOfCallFilter === "" || complaint.modeOfCall === modeOfCallFilter

      return matchesSearchTerm && matchesCompany && matchesModeOfCall
    }
  )

  // Handle opening the assignment dialog
  const handleOpenAssignDialog = (complaint) => {
    // ✅ CHANGED: Use complaintNo (Column B) instead of complaintNumber
    const complaintId = complaint.complaintNo;

    if (!complaintId || complaintId.toString().trim() === "") {
      alert("❌ This complaint does not have a valid Complaint No. Cannot assign.");
      return;
    }

    console.log("Opening assignment dialog for Complaint No:", complaintId);
    console.log("Complaint data:", {
      complaintNo: complaint.complaintNo,
      actualRowIndex: complaint.actualRowIndex
    });

    setSelectedComplaint(complaintId);
    setSelectedComplaintData(complaint);
    setIsDialogOpen(true);
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
    <div className="p-4">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl font-bold">Pending Complaint Assignments ({filteredComplaints.length})</h1>

        <div className="relative">
          <input
            type="search"
            placeholder="Search across all fields (complaint no, name, village, etc.)"
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
        <select
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="">All Companies</option>
          {getUniqueCompanyNames().map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>

        {/* Mode of Call Filter */}
        <select
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={modeOfCallFilter}
          onChange={(e) => setModeOfCallFilter(e.target.value)}
        >
          <option value="">All Modes</option>
          {getUniqueModeOfCalls().map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredComplaints.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No pending complaints found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {/* <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Row #
                  </th> */}
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint Number
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Head
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Company Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Mode Of Call
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Beneficiary Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Contact Number
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Village
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    District
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Priority
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Nature Of Complaint
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint, index) => (
                  <tr key={`complaint-${complaint.complaintNumber}-${index}`} className="hover:bg-gray-50">
                    {/* <td className="px-3 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{complaint.actualRowIndex}</td> */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                        onClick={() => handleOpenAssignDialog(complaint)}
                        disabled={!complaint.complaintNumber || complaint.complaintNumber.toString().trim() === ""}
                      >
                        Assign
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{complaint.complaintNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.complaintDate}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.head}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.companyName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.modeOfCall}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.beneficiaryName}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.contactNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.village}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.district}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.product}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{complaint.natureOfComplaint}</td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsDialogOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Assign Complaint: {selectedComplaintData?.complaintNumber || selectedComplaint}
                      <span className="text-sm text-gray-500 ml-2">(Row: {selectedComplaintData?.actualRowIndex})</span>
                    </h3>
                    <div className="mt-4 max-h-[60vh] overflow-auto">
                      <AssignComplaintForm
                        complaintId={selectedComplaint}
                        onClose={() => setIsDialogOpen(false)}
                        onSubmit={handleAssignComplaint}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingAssignmentsTable