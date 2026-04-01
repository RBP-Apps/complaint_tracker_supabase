"use client"

import { useState, useEffect } from "react"

function VerifiedDocumentsTable() {
  const [verifiedDocuments, setVerifiedDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")


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
    // Handle Google Sheets Date constructor format like "Date(2025,4,21)"
    else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      // Extract the date parts from "Date(2025,4,21)" format
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]); // Month is 0-indexed in this format
        const day = parseInt(match[3]);
        date = new Date(year, month, day);
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

  // Function to fetch data from Google Sheets
  useEffect(() => {
    const fetchVerifiedDocuments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the entire sheet using Google Sheets API directly
        const sheetUrl =
          "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS"
        const response = await fetch(sheetUrl)
        const text = await response.text()

        // Extract the JSON part from the response
        const jsonStart = text.indexOf("{")
        const jsonEnd = text.lastIndexOf("}") + 1
        const jsonData = text.substring(jsonStart, jsonEnd)

        const data = JSON.parse(jsonData)

        // Process the verified documents data
        if (data && data.table && data.table.rows) {
          const documentsData = []

          // Skip the header row and process the data rows
          data.table.rows.slice(3).forEach((row, index) => {
            if (row.c) {
              // Check if BOTH document verification columns have data (AT and AU, indices 45 and 46)
              const hasDocument1 = row.c[49] && row.c[49].v !== null && row.c[49].v !== ""
              const hasDocument2 = row.c[50] && row.c[50].v !== null && row.c[50].v !== ""

              // Only include rows where BOTH document fields are not null
              if (hasDocument1 && hasDocument2) {
                const document = {
                  rowIndex: index + 6, // Actual row index in the sheet (1-indexed, +5 for header rows, +1 for 1-indexing)
                  id: row.c[1] ? row.c[1].v : `COMP-${index + 1}`, // Column B - Complaint No.
                  date: row.c[2] ? row.c[2].v : "", // Column C - Date
                  name: row.c[3] ? row.c[3].v : "", // Column D - Name
                  phone: row.c[4] ? row.c[4].v : "", // Column E - Phone
                  email: row.c[5] ? row.c[5].v : "", // Column F - Email
                  address: row.c[6] ? row.c[6].v : "", // Column G - Address
                  document1: row.c[52] ? row.c[52].v : "", // Document 1
                  document2: row.c[53] ? row.c[53].v : "", // Document 2
                  additionalDocuments: row.c[54] ? row.c[54].v : "", // Additional Documents
                  // verificationDate: row.c[43] ? row.c[43].v : "", // Document Verification Date
                  verificationDate: row.c[43] ? formatDateString(row.c[43].v) : "",
                }

                documentsData.push(document)
              }
            }
          })

          setVerifiedDocuments(documentsData)
        }
      } catch (err) {
        console.error("Error fetching verified documents data:", err)
        setError(err.message)
        // On error, set to empty array
        setVerifiedDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchVerifiedDocuments()
  }, [])

  // Filter documents based on search term
  const filteredDocuments = verifiedDocuments.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading verified documents...</div>
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
        <h1 className="text-xl font-bold">Verified Documents</h1>

        <div className="relative">
          <input
            type="search"
            placeholder="Search documents..."
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredDocuments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No verified documents found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Complaint ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Head
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Document 1
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Document 2
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Additional Documents
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Verification Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{doc.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">{doc.document1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.document2}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.additionalDocuments}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.document1 ? (
                        <a
                          href={doc.document1}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Document 1
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.document2 ? (
                        <a
                          href={doc.document2}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Document 2
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.additionalDocuments ? (
                        <a
                          href={doc.additionalDocuments}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Additional Docs
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.verificationDate}</td>
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

export default VerifiedDocumentsTable