"use client"

import { useState, useEffect, useMemo } from "react"
import { MapPin, BarChart3, CheckCircle2, AlertCircle, Search } from "lucide-react"
import supabase from "../utils/supabase";



function ComplaintsByRegion() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const loggedInUser = localStorage.getItem("username")
    const loggedInRole = localStorage.getItem("userRole")
    if (loggedInUser) setUser(loggedInUser)
    if (loggedInRole) setUserRole(loggedInRole)
  }, [])

  const formatDateString = (dateValue) => {
    if (!dateValue) return ""
    let date
    if (typeof dateValue === "number" && dateValue > 40000) {
      const googleEpoch = new Date(1899, 11, 30)
      date = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000)
    } else if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
      const match = dateValue.match(
        /Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/
      )
      if (match) {
        const year = parseInt(match[1])
        const month = parseInt(match[2])
        const day = parseInt(match[3])
        date = new Date(year, month, day)
      } else {
        return dateValue
      }
    } else if (typeof dateValue === "object" && dateValue && dateValue.getDate) {
      date = dateValue
    } else {
      return dateValue
    }
    if (!date || isNaN(date.getTime())) return dateValue
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

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
      setError(err.message || "Error")
      setComplaints([])
    } finally {
      setIsLoading(false)
    }
  }

  fetchComplaints()
}, [])




  const getFilteredComplaintsByRole = () => {
    let roleFilteredComplaints = complaints
    if (!userRole) return roleFilteredComplaints
    const roleLower = userRole.toLowerCase()
    if (roleLower === "admin" || roleLower === "user") return roleFilteredComplaints
    if (roleLower === "tech") {
      if (user) {
        roleFilteredComplaints = complaints.filter(
          (complaint) => complaint.technicianName === user
        )
      } else {
        roleFilteredComplaints = []
      }
    }
    return roleFilteredComplaints
  }

  const filteredComplaints = getFilteredComplaintsByRole().filter(
    (complaint) => {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        String(complaint.beneficiaryName || "")
          .toLowerCase()
          .includes(search) ||
        String(complaint.complaintId || "").toLowerCase().includes(search) ||
        String(complaint.village || "").toLowerCase().includes(search) ||
        String(complaint.district || "").toLowerCase().includes(search) ||
        String(complaint.projectName || "").toLowerCase().includes(search) ||
        String(complaint.natureOfComplaint || "").toLowerCase().includes(
          search
        ) ||
        String(complaint.complaintNumber || "").toLowerCase().includes(
          search
        ) ||
        String(complaint.technicianName || "").toLowerCase().includes(search)

      return matchesSearch
    }
  )

  // const districtSummary = useMemo(() => {
  //   const map = new Map()

  //   filteredComplaints.forEach((c) => {
  //     const key = c.district || "UNKNOWN"
  //     if (!map.has(key)) {
  //       map.set(key, {
  //         district: key,
  //         total: 0,
  //         resolved: 0,
  //         pending: 0,
  //       })
  //     }
  //     const entry = map.get(key)
  //     entry.total += 1

  //     const s = String(c.status || "").toUpperCase()
  //     if (s.includes("APPROVED-CLOSE") || s.includes("COMPLETED")) {
  //       entry.resolved += 1
  //     } else {
  //       entry.pending += 1
  //     }
  //   })

  //   return Array.from(map.values()).sort((a, b) =>
  //     a.district.localeCompare(b.district)
  //   )
  // }, [filteredComplaints])

  const districtSummary = useMemo(() => {
  const map = new Map()

  filteredComplaints.forEach((c) => {
    const rawDistrict = c.district || "UNKNOWN"

    const key = rawDistrict.trim().toLowerCase() // 🔥 FIX

    if (!map.has(key)) {
      map.set(key, {
        district: key.charAt(0).toUpperCase() + key.slice(1),
        total: 0,
        resolved: 0,
        pending: 0,
      })
    }

    const entry = map.get(key)
    entry.total += 1

    const s = String(c.status || "").toUpperCase()
    if (s.includes("APPROVED-CLOSE") || s.includes("COMPLETED")) {
      entry.resolved += 1
    } else {
      entry.pending += 1
    }
  })

  return Array.from(map.values()).sort((a, b) =>
    a.district.localeCompare(b.district)
  )
}, [filteredComplaints])



  const grandTotals = useMemo(() => {
    return districtSummary.reduce(
      (acc, d) => {
        acc.total += d.total
        acc.resolved += d.resolved
        acc.pending += d.pending
        return acc
      },
      { total: 0, resolved: 0, pending: 0 }
    )
  }, [districtSummary])

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
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all">
      {/* HEADER */}
      <div className="mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>District Performance & Regional Breakdown</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {districtSummary.length} Districts
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of total, resolved, and pending complaints across districts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Filter district..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* DISTRICT DASHBOARD - STICKY TABLE */}
      <div className="mb-4 max-h-[340px] overflow-y-auto border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50/90 sticky top-0 z-10 text-xs font-bold text-slate-600 uppercase tracking-wider backdrop-blur-xs border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">District</th>
              <th className="px-4 py-3 whitespace-nowrap text-center">Total Complaints</th>
              <th className="px-4 py-3 whitespace-nowrap text-center">Resolved</th>
              <th className="px-4 py-3 whitespace-nowrap text-center">Pending</th>
              <th className="px-4 py-3 whitespace-nowrap text-center">Resolution Rate</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-xs sm:text-sm">
            {districtSummary.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  No district records found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              districtSummary.map((d) => {
                const resolutionRate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
                return (
                  <tr
                    key={d.district}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{d.district}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] rounded-lg bg-slate-100 text-xs font-bold text-slate-800 px-2.5 py-1 font-mono">
                        {d.total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-200 px-2.5 py-1 font-mono">
                        {d.resolved}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] rounded-lg bg-amber-50 text-xs font-bold text-amber-700 border border-amber-200 px-2.5 py-1 font-mono">
                        {d.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              resolutionRate >= 80
                                ? "bg-emerald-500"
                                : resolutionRate >= 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${resolutionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 font-mono w-8 text-right">
                          {resolutionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EXECUTIVE TOTALS KPI BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Total Registered</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold font-mono">
            {grandTotals.total}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Closed / Resolved</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
            {grandTotals.resolved}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>Pending Resolution</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold font-mono">
            {grandTotals.pending}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ComplaintsByRegion
