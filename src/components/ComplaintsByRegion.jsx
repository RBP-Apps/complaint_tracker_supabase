"use client"

import { useState, useEffect, useMemo } from "react"
import { MapPin, BarChart3, CheckCircle2, AlertCircle, Search, X, ChevronRight, Phone, MessageSquare, ExternalLink } from "lucide-react"
import supabase from "../utils/supabase";

function ComplaintsByRegion() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // District detail modal state
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [modalSearch, setModalSearch] = useState("")
  const [modalStatusFilter, setModalStatusFilter] = useState("all") // 'all' | 'pending' | 'resolved'

  useEffect(() => {
    const loggedInUser = localStorage.getItem("username")
    const loggedInRole = localStorage.getItem("userRole")
    if (loggedInUser) setUser(loggedInUser)
    if (loggedInRole) setUserRole(loggedInRole)
  }, [])

  // Handle ESC key to close modal & prevent background body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedDistrict(null)
      }
    }
    if (selectedDistrict) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [selectedDistrict])

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

  const districtSummary = useMemo(() => {
    const map = new Map()

    filteredComplaints.forEach((c) => {
      const rawDistrict = (c.district || "").trim()
      const key = rawDistrict ? rawDistrict.toLowerCase() : "unknown"

      if (!map.has(key)) {
        const formatted = rawDistrict
          ? rawDistrict
              .split(/\s+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ")
          : "Not Specified"

        map.set(key, {
          district: formatted,
          districtKey: key,
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

  // Selected district statistics
  const selectedDistrictStats = useMemo(() => {
    if (!selectedDistrict) return null
    return (
      districtSummary.find(
        (d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()
      ) || null
    )
  }, [districtSummary, selectedDistrict])

  // Complaints belonging to selected district
  const districtComplaints = useMemo(() => {
    if (!selectedDistrict) return []
    const target = selectedDistrict.trim().toLowerCase()
    return filteredComplaints.filter((c) => {
      const raw = (c.district || "").trim().toLowerCase()
      const formatted = raw
        ? raw
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ")
        : "not specified"

      return (
        raw === target ||
        formatted.toLowerCase() === target ||
        (target === "not specified" && !raw) ||
        (target === "unknown" && !raw)
      )
    })
  }, [filteredComplaints, selectedDistrict])

  // Filtered complaints within modal (by status & search)
  const filteredDistrictComplaints = useMemo(() => {
    return districtComplaints.filter((c) => {
      const isResolved =
        String(c.status || "").toUpperCase().includes("APPROVED-CLOSE") ||
        String(c.status || "").toUpperCase().includes("COMPLETED")

      if (modalStatusFilter === "resolved" && !isResolved) return false
      if (modalStatusFilter === "pending" && isResolved) return false

      if (!modalSearch.trim()) return true
      const q = modalSearch.toLowerCase().trim()
      return (
        String(c.complaintId || "").toLowerCase().includes(q) ||
        String(c.beneficiaryName || "").toLowerCase().includes(q) ||
        String(c.village || "").toLowerCase().includes(q) ||
        String(c.block || "").toLowerCase().includes(q) ||
        String(c.product || "").toLowerCase().includes(q) ||
        String(c.make || "").toLowerCase().includes(q) ||
        String(c.rating || "").toLowerCase().includes(q) ||
        String(c.natureOfComplaint || "").toLowerCase().includes(q) ||
        String(c.technicianName || "").toLowerCase().includes(q) ||
        String(c.contactNumber || "").includes(q)
      )
    })
  }, [districtComplaints, modalStatusFilter, modalSearch])

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
              <th className="px-4 py-3 whitespace-nowrap text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-xs sm:text-sm">
            {districtSummary.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No district records found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              districtSummary.map((d) => {
                const resolutionRate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
                return (
                  <tr
                    key={d.district}
                    onClick={() => {
                      setSelectedDistrict(d.district)
                      setModalSearch("")
                      setModalStatusFilter("all")
                    }}
                    className="hover:bg-blue-50/70 transition-all cursor-pointer group active:scale-[0.998]"
                    title={`Click to view all complaints in ${d.district}`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                        <span className="group-hover:text-blue-600 transition-colors font-medium">{d.district}</span>
                      </div>
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
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDistrict(d.district)
                          setModalSearch("")
                          setModalStatusFilter("all")
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all cursor-pointer shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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

      {/* DISTRICT COMPLAINTS DETAILS MODAL */}
      {selectedDistrict && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDistrict(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {selectedDistrict} District
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                      {districtComplaints.length} Total Complaints
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete complaints directory, current status, and resolution details for {selectedDistrict}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedDistrict(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0 flex items-center gap-1 text-xs"
                title="Close modal (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick KPI stats in modal */}
            {selectedDistrictStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50/70 border-b border-slate-200 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[11px] font-medium block">Total Complaints</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">{selectedDistrictStats.total}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[11px] font-medium block">Resolved</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">{selectedDistrictStats.resolved}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[11px] font-medium block">Pending</span>
                  <span className="text-lg font-bold text-amber-600 font-mono">{selectedDistrictStats.pending}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[11px] font-medium block">Resolution Rate</span>
                  <span className="text-lg font-bold text-blue-600 font-mono">
                    {selectedDistrictStats.total > 0
                      ? Math.round((selectedDistrictStats.resolved / selectedDistrictStats.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            )}

            {/* Filter and Search Bar inside modal */}
            <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by beneficiary, village, block, phone, product, technician..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                {modalSearch && (
                  <button
                    type="button"
                    onClick={() => setModalSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalStatusFilter("all")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    modalStatusFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({districtComplaints.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalStatusFilter("pending")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    modalStatusFilter === "pending"
                      ? "bg-amber-600 text-white shadow-xs font-semibold"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  Pending ({selectedDistrictStats?.pending || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setModalStatusFilter("resolved")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    modalStatusFilter === "resolved"
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  Resolved ({selectedDistrictStats?.resolved || 0})
                </button>
              </div>
            </div>

            {/* Complaints Table inside Modal */}
            <div className="overflow-y-auto flex-1 max-h-[50vh]">
              {filteredDistrictComplaints.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No matching complaints found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {modalSearch ? `No complaints match "${modalSearch}" in this filter` : "No complaints recorded under this status"}
                  </p>
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch("")}
                      className="mt-3 px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 z-10 font-semibold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Complaint ID</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Beneficiary & Location</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Product Details</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Nature of Complaint</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Technician</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap">Date</th>
                      <th className="px-3.5 py-2.5 whitespace-nowrap text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDistrictComplaints.map((c, i) => {
                      const isResolved =
                        String(c.status || "").toUpperCase().includes("APPROVED-CLOSE") ||
                        String(c.status || "").toUpperCase().includes("COMPLETED");

                      return (
                        <tr key={c.complaintId || i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-2.5 font-bold font-mono text-blue-600 whitespace-nowrap">
                            {c.complaintId}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-semibold text-slate-900">{c.beneficiaryName || "—"}</div>
                            <div className="text-[11px] text-slate-500">
                              {[c.village, c.block].filter(Boolean).join(", ") || "—"}
                            </div>
                            {c.contactNumber && (
                              <a
                                href={`tel:${c.contactNumber}`}
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-mono mt-0.5"
                                title="Call beneficiary"
                              >
                                <Phone className="w-3 h-3" />
                                {c.contactNumber}
                              </a>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-slate-800">{c.product || "—"}</div>
                            <div className="text-[11px] text-slate-500">
                              {[c.make, c.rating, c.qty ? `Qty: ${c.qty}` : ""].filter(Boolean).join(" • ") || "—"}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 max-w-[220px]">
                            <p className="line-clamp-2 text-slate-700 text-[11px]" title={c.natureOfComplaint}>
                              {c.natureOfComplaint || "—"}
                            </p>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{c.technicianName || "Unassigned"}</div>
                            {c.technicianContact && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {c.technicianContact}
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            <div>{c.complaintDate || "—"}</div>
                            {c.closeDate && (
                              <div className="text-[10px] text-emerald-600">Closed: {c.closeDate}</div>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                                isResolved
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {c.status || "Open"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-700">{filteredDistrictComplaints.length}</strong> of{" "}
                <strong className="text-slate-700">{districtComplaints.length}</strong> complaints in {selectedDistrict}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDistrict(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium cursor-pointer transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintsByRegion
