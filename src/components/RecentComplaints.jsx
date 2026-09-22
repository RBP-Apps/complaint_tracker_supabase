"use client"

import { useState, useEffect } from "react"
import supabase from "../utils/supabase"

function RecentComplaints() {
  const [recentComplaints, setRecentComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const formatDate = (dateVal) => {
    if (!dateVal) return "Unknown"
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return String(dateVal)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return String(dateVal)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: sbError } = await supabase
          .from("FMS")
          .select("id, complaint_id, beneficiary_name, product, village, complaint_date, timestamp, planned, actual, planned1, actual1, technician_name")
          .order("id", { ascending: false })
          .limit(20)

        if (sbError) throw sbError

        const processed = (data || [])
          .filter((row) => row.complaint_id)
          .map((row) => {
            let status = "New"
            if (row.planned1 && row.actual1) {
              status = "Completed"
            } else if (row.planned1) {
              status = "In Progress"
            } else if (row.technician_name) {
              status = "Assigned"
            }

            return {
              id: row.complaint_id || "COMP-XXXX",
              beneficiaryName: row.beneficiary_name || "Unknown",
              product: row.product || "Unknown",
              village: row.village || "Unknown",
              date: formatDate(row.complaint_date || row.timestamp),
              status,
            }
          })
          .slice(0, 5)

        setRecentComplaints(processed)
      } catch (err) {
        console.error("Error fetching recent complaints from Supabase:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
