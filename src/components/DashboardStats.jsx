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
  ChevronLeft,
  ChevronRight,
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
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [modalSearchTerm, modalDistrictFilter, modalStatusFilter, modalTechFilter])

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
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      data: totalComplaintsList,
      description: "Click to view all registered complaints",
    },
    {
      id: "pending",
      title: "Pending Complaints",
      value: isLoading ? "-" : pendingComplaintsList.length,
      change: "-5%",
      trend: "down",
      icon: AlertTriangle,
      color: "bg-amber-600",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      data: pendingComplaintsList,
      description: "Click to view pending & reject complaints",
    },
    {
      id: "completed",
      title: "Completed Complaints",
      value: isLoading ? "-" : completedComplaintsList.length,
      change: "+18%",
      trend: "up",
      icon: CheckCircle,
      color: "bg-emerald-600",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      data: completedComplaintsList,
      description: "Click to view approved & closed complaints",
    },
    {
      id: "insurance",
      title: "Insurance",
      value: isLoading ? "-" : insuranceComplaintsList.length,
      change: "+8%",
      trend: "up",
      icon: Shield,
      color: "bg-indigo-600",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      data: insuranceComplaintsList,
      description: "Click to view complaints with insurance",
    },
  ]

  // Open modal handler
  const handleCardClick = (stat) => {
    setActiveModal(stat)
    setModalSearchTerm("")
    setModalDistrictFilter("")
    setModalStatusFilter("")
    setModalTechFilter("")
    setCurrentPage(1)
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

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredModalRows.length / rowsPerPage))
  const paginatedModalRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredModalRows.slice(start, start + rowsPerPage)
  }, [filteredModalRows, currentPage, rowsPerPage])

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
      {/* Stats Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(stat)}
            className="group cursor-pointer rounded-xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden bg-white relative flex flex-col justify-between"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleCardClick(stat)
              }
            }}
            title="Click to view details in modal"
          >
            <div>
              <div className={`${stat.color} p-4 text-white transition-colors`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">{stat.title}</h3>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-xs group-hover:scale-110 transition-transform">
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <div className={`p-5 ${stat.lightColor}`}>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-extrabold text-gray-900">
                    {isLoading ? <span className="animate-pulse text-gray-400">...</span> : stat.value}
                  </p>
                  <div className={`flex items-center text-xs font-semibold ${stat.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                    {stat.trend === "up" ? <ArrowUp className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDown className="h-3.5 w-3.5 mr-0.5" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Compared to last month</p>
              </div>
            </div>

            {/* Click to view footer banner */}
            <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                View records
              </span>
              <span className="text-gray-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all">
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
            <div className={`${activeModal.color} text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-xs">
                  <activeModal.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight">{activeModal.title}</h2>
                    <span className="bg-white/25 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full border border-white/30">
                      {activeModal.data.length} Total Records
                    </span>
                    {userRole && (
                      <span className="bg-black/20 text-white/90 text-xs px-2 py-0.5 rounded-md">
                        Role: {userRole}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/85 mt-0.5">
                    {activeModal.description}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="bg-white/15 hover:bg-white/30 text-white p-2 rounded-xl transition-all hover:rotate-90 duration-200 cursor-pointer"
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

                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2.5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  title="Rows per page"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                  title="Download records in Excel format"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Excel</span>
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
                    {paginatedModalRows.map((row, idx) => {
                      const serialNum = (currentPage - 1) * rowsPerPage + idx + 1
                      return (
                        <tr key={row.complaint_id ? `${row.complaint_id}-${idx}` : idx} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 py-3 text-gray-400 font-mono">{serialNum}</td>
                          <td className="px-3 py-3 font-semibold text-blue-600 whitespace-nowrap">
                            {row.complaint_id || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                            {formatDate(row.complaint_date)}
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {row.beneficiary_name || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-mono text-gray-600">
                            {row.contact_number || "-"}
                          </td>
                          <td className="px-3 py-3 max-w-[200px] truncate" title={`${row.village || ""}, ${row.block || ""}, ${row.district || ""}`}>
                            {[row.village, row.block, row.district].filter(Boolean).join(", ") || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-800">
                            {row.product || "-"} {row.make ? `(${row.make})` : ""}
                          </td>
                          <td className="px-3 py-3 max-w-[220px] truncate" title={row.nature_of_complaint}>
                            {row.nature_of_complaint || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-800">
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

            {/* Modal Footer / Pagination */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredModalRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * rowsPerPage, filteredModalRows.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">{filteredModalRows.length}</span> results
                {modalSearchTerm && (
                  <span className="ml-1 text-gray-500">
                    (filtered from {activeModal.data.length} total)
                  </span>
                )}
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1 font-semibold text-gray-700">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
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

