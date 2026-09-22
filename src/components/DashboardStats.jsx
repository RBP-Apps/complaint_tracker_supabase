"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Shield,
  X,
  Search,
  Download,
  Eye,
  FileSpreadsheet
} from 'lucide-react'
import * as XLSX from 'xlsx'
import supabase from "../utils/supabase"
import SearchableSelect from "./SearchableSelect"

function DashboardStats() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // Modal State
  const [activeModal, setActiveModal] = useState(null)
  const [modalSearchTerm, setModalSearchTerm] = useState("")
  const [modalDistrictFilter, setModalDistrictFilter] = useState("")
  const [modalStatusFilter, setModalStatusFilter] = useState("")
  const [modalTechFilter, setModalTechFilter] = useState("")

  useEffect(() => {
    const loggedInUser = localStorage.getItem('username')
    const loggedInRole = localStorage.getItem('userRole')

    console.log('DashboardStats - Retrieved from localStorage:', { loggedInUser, loggedInRole })

    if (loggedInUser) {
      setUser(loggedInUser)
    }

    if (loggedInRole) {
      setUserRole(loggedInRole)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const { data: rows, error } = await supabase
          .from("FMS")
          .select("*")

        if (error) throw error

        console.log("Supabase Data:", rows)
        setData(rows)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Lock body scroll and handle ESC key when modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden"
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setActiveModal(null)
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => {
        document.body.style.overflow = "unset"
        window.removeEventListener("keydown", handleKeyDown)
      }
    } else {
      document.body.style.overflow = "unset"
    }
  }, [activeModal])

  // Format date helper
  const formatDate = (dateValue) => {
    if (!dateValue) return "-"

    if (typeof dateValue === 'number' && dateValue > 40000) {
      const googleEpoch = new Date(1899, 11, 30)
      const d = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000)
      return isNaN(d.getTime())
        ? String(dateValue)
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/)
      if (match) {
        const year = parseInt(match[1])
        const month = parseInt(match[2])
        const day = parseInt(match[3])
        const d = new Date(year, month, day)
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      }
    }

    const d = new Date(dateValue)
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    return String(dateValue)
  }

  // Role-based filtering function
  const getFilteredDataByRole = () => {
    if (!data) return []

    // Admin/User → all data
    if (userRole && (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'user')) {
      return data
    }

    // Tech → filter by technician_name
    if (userRole && userRole.toLowerCase() === 'tech' && user) {
      const filtered = data.filter((row) => {
        const technicianName = row.technician_name || ""
        return technicianName === user
      })
      return filtered
    }

    if (userRole && userRole.toLowerCase() === 'tech' && !user) {
      return []
    }

    return data
  }

  // Get filtered data based on role
  const filteredData = getFilteredDataByRole()

  // 1. Total complaints list
  const totalComplaintsList = useMemo(() => {
    return filteredData ? filteredData.filter((row) => row.complaint_id) : []
  }, [filteredData])

  // 2. Pending complaints list
  const pendingComplaintsList = useMemo(() => {
    return filteredData
      ? filteredData.filter((row) => {
          const status = row.status
          const hasData = row.complaint_id
          const isPending = hasData && (!status || status === "" || status === "Reject")
          return isPending
        })
      : []
  }, [filteredData])

  // 3. Completed complaints list
  const completedComplaintsList = useMemo(() => {
    return filteredData
      ? filteredData.filter((row) => {
          const status = row.status
          const hasData = row.complaint_id
          const isCompleted = hasData && status === "APPROVED-CLOSE"
          return isCompleted
        })
      : []
  }, [filteredData])

  // 4. Insurance complaints list
  const insuranceComplaintsList = useMemo(() => {
    return filteredData
      ? filteredData.filter((row) => {
          const insurance = row.insurance_type
          const hasInsurance =
            insurance !== null &&
            insurance !== undefined &&
            insurance !== ""
          return hasInsurance
        })
      : []
  }, [filteredData])

  const stats = [
    {
      id: "total",
      title: "Total Complaints",
      value: isLoading ? "-" : totalComplaintsList.length,
      change: "+12%",
      trend: "up",
      icon: Clock,
      topBorder: "border-t-blue-600",
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
      hoverBorder: "hover:border-blue-300",
      accentColor: "text-blue-600",
      data: totalComplaintsList,
      description: "All registered complaints in system",
    },
    {
      id: "pending",
      title: "Pending Complaints",
      value: isLoading ? "-" : pendingComplaintsList.length,
      change: "-5%",
      trend: "down",
      icon: AlertTriangle,
      topBorder: "border-t-amber-500",
      iconBg: "bg-amber-50 text-amber-600 border-amber-200",
      hoverBorder: "hover:border-amber-300",
      accentColor: "text-amber-600",
      data: pendingComplaintsList,
      description: "Complaints awaiting resolution or action",
    },
    {
      id: "completed",
      title: "Completed Complaints",
      value: isLoading ? "-" : completedComplaintsList.length,
      change: "+18%",
      trend: "up",
      icon: CheckCircle,
      topBorder: "border-t-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
      hoverBorder: "hover:border-emerald-300",
      accentColor: "text-emerald-600",
      data: completedComplaintsList,
      description: "Approved and closed complaints",
    },
    {
      id: "insurance",
      title: "Insurance",
      value: isLoading ? "-" : insuranceComplaintsList.length,
      change: "+8%",
      trend: "up",
      icon: Shield,
      topBorder: "border-t-purple-600",
      iconBg: "bg-purple-50 text-purple-600 border-purple-200",
      hoverBorder: "hover:border-purple-300",
      accentColor: "text-purple-600",
      data: insuranceComplaintsList,
      description: "Complaints filed under insurance policy",
    },
  ]

  // Open modal handler
  const handleCardClick = (stat) => {
    setActiveModal(stat)
    setModalSearchTerm("")
    setModalDistrictFilter("")
    setModalStatusFilter("")
    setModalTechFilter("")
  }

  // Unique options for modal dropdowns
  const modalUniqueDistricts = useMemo(() => {
    if (!activeModal?.data) return []
    return [...new Set(activeModal.data.map((r) => r.district).filter(Boolean))].sort()
  }, [activeModal])

  const modalUniqueStatuses = useMemo(() => {
    if (!activeModal?.data) return []
    return [...new Set(activeModal.data.map((r) => r.status).filter(Boolean))].sort()
  }, [activeModal])

  const modalUniqueTechs = useMemo(() => {
    if (!activeModal?.data) return []
    return [...new Set(activeModal.data.map((r) => r.technician_name).filter(Boolean))].sort()
  }, [activeModal])

  // Filtered rows for modal search and dropdown filters
  const filteredModalRows = useMemo(() => {
    if (!activeModal || !activeModal.data) return []

    return activeModal.data.filter((item) => {
      // 1. Text Search match
      if (modalSearchTerm.trim()) {
        const term = modalSearchTerm.toLowerCase().trim()
        const matchesText = (
          String(item.complaint_id || "").toLowerCase().includes(term) ||
          String(item.beneficiary_name || "").toLowerCase().includes(term) ||
          String(item.contact_number || "").toLowerCase().includes(term) ||
          String(item.id_number || "").toLowerCase().includes(term) ||
          String(item.village || "").toLowerCase().includes(term) ||
          String(item.block || "").toLowerCase().includes(term) ||
          String(item.district || "").toLowerCase().includes(term) ||
          String(item.technician_name || "").toLowerCase().includes(term) ||
          String(item.nature_of_complaint || "").toLowerCase().includes(term) ||
          String(item.product || "").toLowerCase().includes(term) ||
          String(item.status || "").toLowerCase().includes(term) ||
          String(item.insurance_type || "").toLowerCase().includes(term) ||
          String(item.project_name || "").toLowerCase().includes(term)
        )
        if (!matchesText) return false
      }

      // 2. District filter
      if (modalDistrictFilter && item.district !== modalDistrictFilter) {
        return false
      }

      // 3. Status filter
      if (modalStatusFilter && item.status !== modalStatusFilter) {
        return false
      }

      // 4. Technician filter
      if (modalTechFilter && item.technician_name !== modalTechFilter) {
        return false
      }

      return true
    })
  }, [activeModal, modalSearchTerm, modalDistrictFilter, modalStatusFilter, modalTechFilter])

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredModalRows || filteredModalRows.length === 0) {
      alert("No data available to export.")
      return
    }

    const exportRows = filteredModalRows.map((row, index) => ({
      "S.No": index + 1,
      "Complaint ID": row.complaint_id || "-",
      "Complaint Date": formatDate(row.complaint_date),
      "ID Number": row.id_number || "-",
      "Beneficiary Name": row.beneficiary_name || "-",
      "Contact Number": row.contact_number || "-",
      "Village": row.village || "-",
      "Block": row.block || "-",
      "District": row.district || "-",
      "Project Name": row.project_name || "-",
      "Product": row.product || "-",
      "Make": row.make || "-",
      "Nature of Complaint": row.nature_of_complaint || "-",
      "Technician Name": row.technician_name || "-",
      "Insurance Type": row.insurance_type || "-",
      "Status": row.status || "Open",
      "Close Date": formatDate(row.close_date),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, activeModal?.title || "Complaints")
    const dateStr = new Date().toISOString().split("T")[0]
    const fileName = `${(activeModal?.title || "Complaints").replace(/\s+/g, "_")}_${dateStr}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = String(status || "").toUpperCase()
    if (s === "APPROVED-CLOSE") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
          APPROVED-CLOSE
        </span>
      )
    }
    if (s === "OK-OPEN") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          OK-OPEN
        </span>
      )
    }
    if (s === "REJECT") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          REJECT
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        {status || "OPEN"}
      </span>
    )
  }

  return (
    <>
      {/* Modern Stats Cards Grid - High Contrast, Dark Text, No White-on-White */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(stat)}
            className={`group cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between border-t-4 ${stat.topBorder} ${stat.hoverBorder}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleCardClick(stat)
              }
            }}
            title={`Click to view all ${stat.title}`}
          >
            {/* Card Content */}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Metric
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mt-0.5">
                    {stat.title}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${stat.iconBg} shadow-2xs group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>

              {/* Number and Trend */}
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {isLoading ? (
                    <span className="inline-block animate-pulse text-slate-300">---</span>
                  ) : (
                    stat.value
                  )}
                </p>
                <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${
                  stat.trend === "up" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {stat.trend === "up" ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                  <span>{stat.change}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>vs. previous period</span>
                <span className="font-semibold text-slate-600">Live Data</span>
              </div>
            </div>

            {/* Bottom Interactive Bar */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50/40 transition-all">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>View all records</span>
              </span>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 font-bold transition-transform">
                →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null)
            }
          }}
        >
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                  <activeModal.icon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white tracking-tight">{activeModal.title}</h2>
                    <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      {activeModal.data.length} Total Records
                    </span>
                    {userRole && (
                      <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-md border border-slate-700">
                        Role: {userRole}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeModal.description}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-xl transition-all hover:rotate-90 duration-200 cursor-pointer border border-slate-700"
                title="Close modal (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Controls Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, Beneficiary, Phone, Village, District..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {modalSearchTerm && (
                  <button
                    onClick={() => setModalSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Actions & Searchable Dropdown Filters */}
              <div className="flex items-center gap-2 justify-end flex-wrap">
                {/* District Searchable Dropdown */}
                {modalUniqueDistricts.length > 0 && (
                  <div className="w-[140px]">
                    <SearchableSelect
                      placeholder="All Districts"
                      allOptionLabel="All Districts"
                      options={modalUniqueDistricts}
                      value={modalDistrictFilter}
                      onChange={(val) => setModalDistrictFilter(val)}
                    />
                  </div>
                )}

                {/* Status Searchable Dropdown (shown when multiple statuses exist) */}
                {modalUniqueStatuses.length > 1 && (
                  <div className="w-[140px]">
                    <SearchableSelect
                      placeholder="All Statuses"
                      allOptionLabel="All Statuses"
                      options={modalUniqueStatuses}
                      value={modalStatusFilter}
                      onChange={(val) => setModalStatusFilter(val)}
                    />
                  </div>
                )}

                {/* Technician Searchable Dropdown */}
                {modalUniqueTechs.length > 0 && (
                  <div className="w-[150px]">
                    <SearchableSelect
                      placeholder="All Technicians"
                      allOptionLabel="All Technicians"
                      options={modalUniqueTechs}
                      value={modalTechFilter}
                      onChange={(val) => setModalTechFilter(val)}
                    />
                  </div>
                )}

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                  title="Download all records in Excel format"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export All to Excel</span>
                </button>
              </div>
            </div>

            {/* Modal Table Container */}
            <div className="flex-1 overflow-auto max-h-[60vh]">
              {filteredModalRows.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="inline-flex p-3 rounded-full bg-gray-100 text-gray-400 mb-3">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold text-gray-700">No records found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {modalSearchTerm ? "Try adjusting your search criteria" : "There are currently no complaints in this category"}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-100 sticky top-0 z-10 text-xs font-bold text-gray-600 uppercase tracking-wider shadow-xs">
                    <tr>
                      <th className="px-3 py-3 whitespace-nowrap">#</th>
                      <th className="px-3 py-3 whitespace-nowrap">Complaint ID</th>
                      <th className="px-3 py-3 whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 whitespace-nowrap">Beneficiary</th>
                      <th className="px-3 py-3 whitespace-nowrap">Contact</th>
                      <th className="px-3 py-3 whitespace-nowrap">Location</th>
                      <th className="px-3 py-3 whitespace-nowrap">Product</th>
                      <th className="px-3 py-3 whitespace-nowrap">Nature of Complaint</th>
                      <th className="px-3 py-3 whitespace-nowrap">Technician</th>
                      <th className="px-3 py-3 whitespace-nowrap">Insurance</th>
                      <th className="px-3 py-3 whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 whitespace-nowrap">Close Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 text-xs text-gray-700">
                    {filteredModalRows.map((row, idx) => {
                      const serialNum = idx + 1
                      return (
                        <tr key={row.complaint_id ? `${row.complaint_id}-${idx}` : idx} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 py-3 text-gray-400 font-mono">{serialNum}</td>
                          <td className="px-3 py-3 font-semibold text-blue-600 whitespace-nowrap">
                            {row.complaint_id || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                            {formatDate(row.complaint_date)}
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900 min-w-[130px] max-w-[180px] whitespace-normal break-words">
                            {row.beneficiary_name || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-mono text-gray-600">
                            {row.contact_number || "-"}
                          </td>
                          <td className="px-3 py-3 min-w-[150px] max-w-[220px] whitespace-normal break-words" title={`${row.village || ""}, ${row.block || ""}, ${row.district || ""}`}>
                            {[row.village, row.block, row.district].filter(Boolean).join(", ") || "-"}
                          </td>
                          <td className="px-3 py-3 min-w-[140px] max-w-[200px] whitespace-normal break-words text-gray-800">
                            {row.product || "-"} {row.make ? `(${row.make})` : ""}
                          </td>
                          <td className="px-3 py-3 min-w-[200px] max-w-[320px] whitespace-normal break-words text-gray-800" title={row.nature_of_complaint}>
                            {row.nature_of_complaint || "-"}
                          </td>
                          <td className="px-3 py-3 min-w-[120px] max-w-[160px] whitespace-normal break-words text-gray-800">
                            {row.technician_name || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {row.insurance_type ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {row.insurance_type}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {renderStatusBadge(row.status)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                            {formatDate(row.close_date)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer (All Records Displayed - No Pagination) */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Showing All {filteredModalRows.length} Complaints
                </span>
                {modalSearchTerm && (
                  <span className="text-slate-500 font-medium">
                    (Filtered from {activeModal.data.length} total)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs hidden sm:inline">
                  ↕ Scroll table to view all records
                </span>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardStats

