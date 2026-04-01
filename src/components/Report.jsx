"use client"

import { useState, useEffect } from "react"

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

  const getUniqueModeOfCalls = () => {
    const modes = reports
      .map(report => report.modeOfCall)
      .filter(mode => mode && mode.trim() !== "")
    return [...new Set(modes)].sort()
  }

  const getUniqueStatuses = () => {
    const statuses = reports
      .map(report => report.status)
      .filter(status => status && status.trim() !== "")
    return [...new Set(statuses)].sort()
  }

  // Function to fetch data from Google Sheets
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the entire sheet using Google Sheets API directly
        const sheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=Reports"
        const response = await fetch(sheetUrl)
        const text = await response.text()

        // Extract the JSON part from the response
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}') + 1
        const jsonData = text.substring(jsonStart, jsonEnd)

        const data = JSON.parse(jsonData)

        // Process the reports data
        if (data && data.table && data.table.rows) {
          const reportData = []

          // Skip the header row and process the data rows
          data.table.rows.slice(1).forEach((row, index) => {
            if (row.c) {
              const report = {
                slNo: row.c[0] ? row.c[0].v : "", // Column A
                modeOfCall: row.c[1] ? row.c[1].v : "", // Column B
                srLogDate: row.c[2] ? (row.c[2].f || formatDateString(row.c[2].v) || row.c[2].v) : "", // Column C
                complaintNo: row.c[3] ? row.c[3].v : "", // Column D
                beneficiaryInfo: row.c[4] ? row.c[4].v : "", // Column E
                village: row.c[5] ? row.c[5].v : "", // Column F
                block: row.c[6] ? row.c[6].v : "", // Column G
                district: row.c[7] ? row.c[7].v : "", // Column H
                srMonth: row.c[8] ? row.c[8].v : "", // Column I
                projectName: row.c[9] ? row.c[9].v : "", // Column J
                product: row.c[10] ? row.c[10].v : "", // Column K
                make: row.c[11] ? row.c[11].v : "", // Column L
                rating: row.c[12] ? row.c[12].v : "", // Column M
                productSlNo: row.c[13] ? row.c[13].v : "", // Column N
                surfaceSubmersible: row.c[14] ? row.c[14].v : "", // Column O
                observation: row.c[15] ? row.c[15].v : "", // Column P
                actionTaken: row.c[16] ? row.c[16].v : "", // Column Q
                techName: row.c[17] ? row.c[17].v : "", // Column R
                techContactNo: row.c[18] ? row.c[18].v : "", // Column S
                attendDate: row.c[19] ? (row.c[19].f || formatDateString(row.c[19].v) || row.c[19].v) : "", // Column T
                closedDate: row.c[20] ? (row.c[20].f || formatDateString(row.c[20].v) || row.c[20].v) : "", // Column U
                status: row.c[21] ? row.c[21].v : "", // Column V
                remarks: row.c[22] ? row.c[22].v : "", // Column W
                fullRowData: row.c
              }

              reportData.push(report)
            }
          })

          setReports(reportData)
        }
      } catch (err) {
        console.error("Error fetching reports data:", err)
        setError(err.message)
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [])

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

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredReports.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No reports found matching your criteria</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
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