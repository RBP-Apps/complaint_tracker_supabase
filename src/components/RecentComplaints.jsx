"use client"

import { useState, useEffect } from "react"

function RecentComplaints() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch the entire sheet using Google Sheets API directly
        const sheetUrl =
          "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS"
        const response = await fetch(sheetUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`)
        }

        const text = await response.text()

        // Extract the JSON part from the response
        const jsonStart = text.indexOf("{")
        const jsonEnd = text.lastIndexOf("}") + 1

        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error("Invalid response format from Google Sheets")
        }

        const jsonData = text.substring(jsonStart, jsonEnd)
        const parsedData = JSON.parse(jsonData)

        // Process the data
        if (parsedData && parsedData.table && parsedData.table.rows) {
          // Skip the header rows (first 5 rows)
          setData(parsedData.table.rows.slice(6))
        } else {
          throw new Error("No data found in the sheet")
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Process recent complaints from sheet data
  // Recent complaints: column Y is not null and column Z is null
  // Process recent complaints from sheet data
  const processRecentComplaints = () => {
    if (!data) return []

    return data
      .filter(
        (row) =>
          row.c[24] &&
          row.c[24].v !== null &&
          row.c[24].v !== "" && // Column Y has data
          (!row.c[25] || row.c[25].v === null || row.c[25].v === ""), // Column Z is null/empty
      )
      .map((row) => {
        // Extract relevant data from row
        const id = row.c[1] ? row.c[1].v : "COMP-XXXX"
        const beneficiaryName = row.c[7] ? row.c[7].v : "Unknown"
        const product = row.c[15] ? row.c[15].v : "Unknown"
        const village = row.c[12] ? row.c[12].v : "Unknown"

        // Simple date display in dd/mm/yyyy format
        let date = "Unknown"
        if (row.c[24] && row.c[24].v) {
          try {
            // If it's already a string in the correct format
            if (typeof row.c[24].v === 'string') {
              date = row.c[24].v
            }
            // If it's a date object or serial number
            else {
              const dateValue = new Date(row.c[24].v)
              if (!isNaN(dateValue.getTime())) {
                const day = String(dateValue.getDate()).padStart(2, '0')
                const month = String(dateValue.getMonth() + 1).padStart(2, '0')
                const year = dateValue.getFullYear()
                date = `${day}/${month}/${year}`
              }
            }
          } catch (e) {
            console.error("Error formatting date:", e)
          }
        }

        // Status logic remains the same
        let status = "New"
        if (row.c[35] && row.c[35].v) {
          if (row.c[36] && row.c[36].v) {
            status = "Completed"
          } else {
            status = "In Progress"
          }
        } else if (row.c[27] && row.c[27].v) {
          status = "Assigned"
        }

        return {
          id,
          beneficiaryName,
          product,
          village,
          date,
          status,
        }
      })
      .slice(0, 5) // Show only 5 most recent
  }

  const recentComplaints = processRecentComplaints()

  if (isLoading) {
    return (
      <div className="rounded-lg border-0 shadow-lg bg-white">
        <div className="pb-2 p-6">
          <h3 className="text-lg font-medium">Recent Complaints</h3>
        </div>
        <div className="pt-0 px-6 pb-6">
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-gray-400">Loading recent complaints...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border-0 shadow-lg bg-white">
        <div className="pb-2 p-6">
          <h3 className="text-lg font-medium">Recent Complaints</h3>
        </div>
        <div className="pt-0 px-6 pb-6">
          <div className="text-red-500">Error loading complaints: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-0 shadow-lg bg-white">
      <div className="pb-2 p-6">
        <h3 className="text-lg font-medium">Recent Complaints</h3>
      </div>
      <div className="pt-0 px-6 pb-6">
        <div className="h-[300px] pr-4 overflow-auto">
          {recentComplaints.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">No recent complaints found</div>
          ) : (
            <div className="space-y-5">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-medium">{complaint.beneficiaryName}</p>
                      <span className="text-xs text-gray-500">{complaint.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{complaint.product}</span> - {complaint.village}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{complaint.id}</span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full text-white
                        ${complaint.status === "New"
                            ? "bg-blue-500"
                            : complaint.status === "Assigned"
                              ? "bg-purple-500"
                              : complaint.status === "In Progress"
                                ? "bg-orange-500"
                                : complaint.status === "Completed"
                                  ? "bg-green-500"
                                  : "bg-teal-500"
                          }
                      `}
                      >
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecentComplaints
