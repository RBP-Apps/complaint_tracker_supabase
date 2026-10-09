"use client"

import { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from "react"
import { useNavigate } from "react-router-dom"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import * as XLSX from "xlsx";
import supabase from "../utils/supabase";
import { parseToDate, isValidDate, formatDateDisplay, formatDateTimeDisplay } from "../utils/dateUtils";
import { extractDocumentText } from "../utils/documentOcr";
import { parseComplaintDocument } from "../utils/documentParser";

// ================= REUSABLE SEARCHABLE SELECT COMPONENT =================
function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select...",
  name = "",
  required = false,
  disabled = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt && opt.toString().toLowerCase().includes(q));
  }, [options, searchQuery]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden real input for HTML form validation */}
      <input
        type="text"
        name={name}
        value={value || ""}
        required={required}
        onChange={() => { }}
        className="opacity-0 absolute inset-0 pointer-events-none -z-10 h-full w-full"
        tabIndex={-1}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery("");
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-left text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : "hover:border-gray-400"
          } ${value ? "text-gray-900" : "text-gray-400"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <div className="flex items-center gap-1 ml-1 text-gray-400">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="hover:text-red-500 p-0.5 rounded cursor-pointer"
              title="Clear"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-xl border border-gray-200 py-1 text-sm max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <svg
                className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <button
                  key={`${opt}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between ${value === opt ? "bg-blue-50 font-semibold text-blue-600" : "text-gray-700"
                    }`}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewComplaintForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complaintDate, setComplaintDate] = useState(null)
  const [challanDate, setChallanDate] = useState(null)
  const [closeDate, setCloseDate] = useState(null)
  const [resolvedDate, setResolvedDate] = useState(null)
  const [serialNumber, setSerialNumber] = useState('CT-001')

  // States for inline table editing
  const [showForm, setShowForm] = useState(false)
  const [tableData, setTableData] = useState([])
  const [dataError, setDataError] = useState(null)

  // States for UPDATE MODAL
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [currentUpdateRow, setCurrentUpdateRow] = useState(null)
  const [updateFormData, setUpdateFormData] = useState({})

  // States for dropdown options
  const [companyNameOptions, setCompanyNameOptions] = useState([])
  const [districtOptions, setDistrictOptions] = useState([])
  const [technicianNameOptions, setTechnicianNameOptions] = useState([])
  const [technicianContactOptions, setTechnicianContactOptions] = useState([])
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState([])
  const [modeOfCallOptions, setModeOfCallOptions] = useState([])
  const [modeOfLetterOptions, setModeOfLetterOptions] = useState([])
  const [projectNameOptions, setProjectNameOptions] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [technicianMapping, setTechnicianMapping] = useState([])
  const [filterCompanyName, setFilterCompanyName] = useState("")
  const [filterTechnicianName, setFilterTechnicianName] = useState("")
  const [filterBeneficiaryName, setFilterBeneficiaryName] = useState("")
  const [filterReporterName, setFilterReporterName] = useState("")
  const [filterCreatedDateFrom, setFilterCreatedDateFrom] = useState(null)
  const [filterCreatedDateTo, setFilterCreatedDateTo] = useState(null)
  const [dateFilterPreset, setDateFilterPreset] = useState("all")
  const [globalSearch, setGlobalSearch] = useState("")
  const deferredGlobalSearch = useDeferredValue(globalSearch)
  const [isExporting, setIsExporting] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, isLoading: false })
  const isFetchingRef = useRef(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [jumpPageInput, setJumpPageInput] = useState("")

  const [masterBeneficiaryOptions, setMasterBeneficiaryOptions] = useState([]) // For Create/Update Form (from Master)

  // Quick date preset helper for Created Date
  const applyDatePreset = (preset) => {
    setDateFilterPreset(preset)
    const now = new Date()
    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      setFilterCreatedDateFrom(start)
      setFilterCreatedDateTo(end)
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0)
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
      setFilterCreatedDateFrom(start)
      setFilterCreatedDateTo(end)
    } else if (preset === 'week') {
      const past7 = new Date(now)
      past7.setDate(past7.getDate() - 7)
      const start = new Date(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      setFilterCreatedDateFrom(start)
      setFilterCreatedDateTo(end)
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      setFilterCreatedDateFrom(start)
      setFilterCreatedDateTo(end)
    } else if (preset === 'all') {
      setFilterCreatedDateFrom(null)
      setFilterCreatedDateTo(null)
    }
  }

  // Dynamic filter options derived from tableData
  const filterReporterOptions = useMemo(() => {
    return [...new Set(tableData.map(row => row.reporter_name).filter(Boolean))].sort()
  }, [tableData])

  const filterBeneficiaryOptions = useMemo(() => {
    return [...new Set(tableData.map(row => row.beneficiary_name).filter(Boolean))].sort()
  }, [tableData])

  // Filtered complaints based on Global Search and all dropdown/text/date filters
  const filteredTableData = useMemo(() => {
    return tableData.filter((row) => {
      // 1. Company Name filter
      if (filterCompanyName && !row.company_name?.toLowerCase().includes(filterCompanyName.toLowerCase())) {
        return false
      }
      // 2. Technician Name filter
      if (filterTechnicianName && !row.technician_name?.toLowerCase().includes(filterTechnicianName.toLowerCase())) {
        return false
      }
      // 3. Beneficiary filter
      if (filterBeneficiaryName && row.beneficiary_name !== filterBeneficiaryName) {
        return false
      }
      // 4. Reporter Name filter
      if (filterReporterName && row.reporter_name !== filterReporterName) {
        return false
      }
      // 5. Created Date range filter
      if (filterCreatedDateFrom || filterCreatedDateTo) {
        const rowCreated = parseToDate(row.created_at || row.timestamp)
        if (!rowCreated) return false
        if (filterCreatedDateFrom) {
          const from = new Date(filterCreatedDateFrom)
          from.setHours(0, 0, 0, 0)
          if (rowCreated < from) return false
        }
        if (filterCreatedDateTo) {
          const to = new Date(filterCreatedDateTo)
          to.setHours(23, 59, 59, 999)
          if (rowCreated > to) return false
        }
      }
      // 6. Global Search across all submitted fields
      if (deferredGlobalSearch && deferredGlobalSearch.trim()) {
        const query = deferredGlobalSearch.toLowerCase().trim()
        const searchableValues = [
          row.complaint_id,
          row.id_number,
          row.project_name,
          row.complaint_number,
          row.company_name,
          row.mode_of_call,
          row.mode_of_letter,
          row.letter_reference_number,
          row.beneficiary_name,
          row.contact_number,
          row.reference_name,
          row.village,
          row.block,
          row.district,
          row.product,
          row.make,
          row.rating,
          row.qty,
          row.insurance_type,
          row.nature_of_complaint,
          row.technician_name,
          row.technician_contact,
          row.assignee_whatsapp_number,
          row.reporter_name,
          row.challan_no,
          row.controller_rid_no,
          row.product_sl_no,
          row.status,
          formatDateDisplay(row.complaint_date),
          formatDateDisplay(row.challan_date),
          formatDateDisplay(row.resolved_date),
          formatDateDisplay(row.created_at || row.timestamp),
          formatDateTimeDisplay(row.created_at || row.timestamp),
        ]
        const hasMatch = searchableValues.some(val =>
          val && String(val).toLowerCase().includes(query)
        )
        if (!hasMatch) return false
      }
      return true
    })
  }, [tableData, filterCompanyName, filterTechnicianName, filterBeneficiaryName, filterReporterName, filterCreatedDateFrom, filterCreatedDateTo, deferredGlobalSearch])

  // Pagination states & helpers for smooth rendering of huge datasets
  const totalPages = Math.max(1, Math.ceil(filteredTableData.length / pageSize))

  // Reset page to 1 when filters or pageSize change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    filterCompanyName,
    filterTechnicianName,
    filterBeneficiaryName,
    filterReporterName,
    filterCreatedDateFrom,
    filterCreatedDateTo,
    deferredGlobalSearch,
    pageSize
  ])

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Slice paginated data for display
  const paginatedTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTableData.slice(startIndex, startIndex + pageSize)
  }, [filteredTableData, currentPage, pageSize])

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  // Reusable Pagination Component
  const renderPagination = (position = "bottom") => {
    if (filteredTableData.length === 0) return null

    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${position === "top" ? "mb-3" : "mt-4"
        }`}>
        {/* Record count summary & Page size */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span> to{" "}
            <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, filteredTableData.length).toLocaleString()}</span> of{" "}
            <span className="font-semibold text-gray-900">{filteredTableData.length.toLocaleString()}</span> records
          </div>
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
            <span className="text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs text-gray-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        {/* Page controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* First */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition font-medium cursor-pointer"
            title="First Page"
          >
            « First
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition font-medium cursor-pointer"
            title="Previous Page"
          >
            ‹ Prev
          </button>

          {/* Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${position}-${idx}`} className="px-1.5 text-gray-400">...</span>
              ) : (
                <button
                  key={`page-${position}-${page}`}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[28px] px-2 py-1 rounded text-xs font-semibold transition cursor-pointer ${currentPage === page
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition font-medium cursor-pointer"
            title="Next Page"
          >
            Next ›
          </button>

          {/* Last */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition font-medium cursor-pointer"
            title="Last Page"
          >
            Last »
          </button>

          {/* Jump to Page */}
          {totalPages > 5 && (
            <div className="flex items-center gap-1 ml-1.5 border-l border-gray-200 pl-2">
              <span className="text-gray-500">Go:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = parseInt(jumpPageInput, 10)
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val)
                      setJumpPageInput("")
                    }
                  }
                }}
                placeholder={currentPage}
                className="w-12 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(jumpPageInput, 10)
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val)
                    setJumpPageInput("")
                  }
                }}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium cursor-pointer"
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Document upload states
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [documentUploadStatus, setDocumentUploadStatus] = useState("")
  const [isUploadingUpdateDoc, setIsUploadingUpdateDoc] = useState(false)
  const [updateDocStatus, setUpdateDocStatus] = useState("")

  // Document scanning & auto-fill states
  const [isScanningDocument, setIsScanningDocument] = useState(false)
  const [scanProgressStep, setScanProgressStep] = useState("")
  const [scanProgressPercent, setScanProgressPercent] = useState(0)
  const [scanResult, setScanResult] = useState(null)
  const [detectedRecords, setDetectedRecords] = useState([])
  const [activeRecordIndex, setActiveRecordIndex] = useState(1)
  const [uploadedDocFileName, setUploadedDocFileName] = useState("")

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default

  const [formData, setFormData] = useState({
    companyName: "",
    modeOfCall: "",
    letterReferenceNumber: "",
    modeOfLetter: "",
    idNumber: "",
    projectName: "",
    complaintNumber: "",
    beneficiaryName: "",
    contactNumber: "",
    isReferenceName: false,
    referenceName: "",
    village: "",
    block: "",
    district: "",
    product: "",
    make: "",
    rating: "",
    qty: "",
    controllerRidNo: "",
    productSlNo: "",
    insuranceType: "",
    natureOfComplaint: "",
    technicianName: "",
    technicianContact: "",
    assigneeWhatsapp: "",
    challanNo: "",
    reporterName: localStorage.getItem('username') || localStorage.getItem('currentUser') || "",
    assignToVendor: false,
    documentUrl: "",
  })






  const generateSerialNumber = useCallback(async () => {
    try {
      // Order descending and inspect recent records to reliably get max CT number
      const { data, error } = await supabase
        .from("FMS")
        .select("complaint_id")
        .order("id", { ascending: false })
        .limit(200)

      if (error) throw error

      let maxNumber = 0;

      (data || []).forEach(item => {
        if (item.complaint_id) {
          const match = item.complaint_id.match(/CT-(\d+)/)
          if (match) {
            const num = parseInt(match[1])
            if (!isNaN(num)) {
              maxNumber = Math.max(maxNumber, num)
            }
          }
        }
      })

      const nextIdNumber = maxNumber > 0 ? maxNumber + 1 : 1;
      const newId = `CT-${nextIdNumber.toString().padStart(3, '0')}`;

      console.log('Next ID:', newId)
      setSerialNumber(newId)

    } catch (error) {
      console.error('Error generating serial number:', error)
    }
  }, [])




  const fetchDropdownOptions = async () => {
    try {
      setIsLoading(true)

      // MASTER TABLE
      const { data: masterData, error: masterError } = await supabase
        .from("Master")
        .select("*")

      if (masterError) throw masterError

      const companyNames = masterData.map(i => i.company_name).filter(Boolean)
      const districts = masterData.map(i => i.district).filter(Boolean)
      const insuranceTypes = masterData.map(i => i.insurance_type).filter(Boolean)
      const beneficiaryNames = masterData.map(i => i.company_name1).filter(Boolean)
      const modeOfCalls = masterData.map(i => i.mode_of_call).filter(Boolean)
      const projectNames = masterData.map(i => i.project_name).filter(Boolean)
      const modeOfLetters = masterData.map(i => i.mode_of_letter).filter(Boolean)

      setCompanyNameOptions([...new Set(companyNames)])
      setDistrictOptions([...new Set(districts)])
      setInsuranceTypeOptions([...new Set(insuranceTypes)])
      setMasterBeneficiaryOptions([...new Set(beneficiaryNames)].sort())
      setModeOfCallOptions([...new Set([...modeOfCalls, "Letter", "Phone Call", "WhatsApp", "Email", "Portal", "In-Person"])])
      setProjectNameOptions([...new Set(projectNames)])
      setModeOfLetterOptions([...new Set(modeOfLetters)])

      // LOGIN TABLE
      const { data: loginData, error: loginError } = await supabase
        .from("Login")
        .select("*")

      if (loginError) throw loginError

      const technicianNames = []
      const technicianContacts = []
      const technicianMapping = []

      const currentUser = localStorage.getItem('currentUser')
      const userRole = localStorage.getItem('userRole')
      const loggedInUsername = localStorage.getItem('username') || currentUser || ""

      if (loggedInUsername) {
        setFormData(prev => ({
          ...prev,
          reporterName: prev.reporterName || loggedInUsername
        }))
      }

      loginData.forEach(row => {
        if (row.username && row.contact_no) {
          if (userRole === 'admin' || userRole === 'user') {
            technicianNames.push(row.username)
            technicianContacts.push(row.contact_no)
            technicianMapping.push({
              name: row.username,
              contact: row.contact_no
            })
          } else if (
            userRole === 'tech' &&
            row.username.toLowerCase() === currentUser?.toLowerCase()
          ) {
            technicianNames.push(row.username)
            technicianContacts.push(row.contact_no)
            technicianMapping.push({
              name: row.username,
              contact: row.contact_no
            })

            setFormData(prev => ({
              ...prev,
              technicianName: row.username,
              technicianContact: row.contact_no
            }))
          }
        }
      })

      console.log(loginData)

      setTechnicianNameOptions([...new Set(technicianNames)])
      setTechnicianContactOptions([...new Set(technicianContacts)])
      setTechnicianMapping(technicianMapping)

    } catch (error) {
      console.error('Error fetching dropdown options:', error)
      setDataError('Error loading form options')
    } finally {
      setIsLoading(false)
    }
  }

  // ================= DOCUMENT SCANNING & AUTO-FILL HELPERS =================
  const applyExtractedRecord = (recordData, docUrl = "") => {
    if (!recordData) return;
    setFormData((prev) => ({
      ...prev,
      companyName: recordData.companyName || prev.companyName,
      modeOfCall: recordData.modeOfCall || prev.modeOfCall || "Letter",
      modeOfLetter: recordData.modeOfLetter || prev.modeOfLetter || "Notice",
      letterReferenceNumber: recordData.letterReferenceNumber || prev.letterReferenceNumber,
      idNumber: recordData.idNumber !== undefined && recordData.idNumber !== "" ? recordData.idNumber : prev.idNumber,
      projectName: recordData.projectName || prev.projectName,
      complaintNumber: recordData.complaintNumber || prev.complaintNumber,
      beneficiaryName: recordData.beneficiaryName || prev.beneficiaryName,
      contactNumber: recordData.contactNumber || prev.contactNumber,
      isReferenceName: false,
      village: recordData.village || prev.village,
      block: recordData.block || prev.block,
      district: recordData.district || prev.district,
      product: recordData.product || prev.product,
      make: recordData.make || prev.make,
      rating: recordData.rating || prev.rating,
      qty: recordData.qty || prev.qty,
      controllerRidNo: recordData.controllerRidNo || prev.controllerRidNo,
      productSlNo: recordData.productSlNo || prev.productSlNo,
      insuranceType: recordData.insuranceType || prev.insuranceType,
      natureOfComplaint: recordData.natureOfComplaint || prev.natureOfComplaint,
      documentUrl: docUrl || prev.documentUrl,
    }));

    if (recordData.complaintDate) {
      const cd = parseToDate(recordData.complaintDate);
      if (isValidDate(cd)) setComplaintDate(cd);
    }
    if (recordData.resolvedDate) {
      const rd = parseToDate(recordData.resolvedDate);
      if (isValidDate(rd)) setResolvedDate(rd);
    }
  };

  const handleSelectRecord = (recIndex) => {
    setActiveRecordIndex(recIndex);
    const rec = detectedRecords.find((r) => r.recordIndex === recIndex);
    if (rec) {
      applyExtractedRecord(rec.data, formData.documentUrl);
    }
  };

  const handleDocumentUploadAndScan = async (file) => {
    if (!file) return;
    try {
      setUploadedDocFileName(file.name);
      setIsScanningDocument(true);
      setIsUploadingDocument(true);
      setScanProgressStep("Reading document and extracting complaint details…");
      setScanProgressPercent(10);
      setDocumentUploadStatus("Uploading document...");

      // 1. Concurrently upload to Supabase Storage
      let docPublicUrl = "";
      const fileExt = file.name.split(".").pop();
      const fileName = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      try {
        let uploadRes = await supabase.storage.from("vendor_tracker").upload(fileName, file, { upsert: true });
        if (uploadRes.error) {
          uploadRes = await supabase.storage.from("complaint_documents").upload(fileName, file, { upsert: true });
          if (!uploadRes.error) {
            const { data } = supabase.storage.from("complaint_documents").getPublicUrl(fileName);
            docPublicUrl = data?.publicUrl || "";
          }
        } else {
          const { data } = supabase.storage.from("vendor_tracker").getPublicUrl(fileName);
          docPublicUrl = data?.publicUrl || "";
        }
      } catch (uploadErr) {
        console.warn("Storage upload notice:", uploadErr);
      }

      if (docPublicUrl) {
        setFormData((prev) => ({ ...prev, documentUrl: docPublicUrl }));
      }

      // 2. OCR / Text Extraction
      setScanProgressStep("Reading document and extracting complaint details…");
      setScanProgressPercent(25);

      const extractedText = await extractDocumentText(file, (msg, pct) => {
        setScanProgressStep(msg);
        if (pct) setScanProgressPercent(pct);
      });

      console.log("Document text extracted successfully, running pattern matcher...");

      // 3. Format detection and keyword matching
      setScanProgressStep("Matching keywords and detecting document format…");
      setScanProgressPercent(88);

      const parseResult = parseComplaintDocument(extractedText, {
        companyNameOptions,
        districtOptions,
        projectNameOptions,
        insuranceTypeOptions,
        modeOfLetterOptions,
      });

      if (parseResult.success && parseResult.records?.length > 0) {
        setScanResult(parseResult);
        setDetectedRecords(parseResult.records);
        setActiveRecordIndex(1);

        // Populate Record 1 data:
        applyExtractedRecord(parseResult.records[0].data, docPublicUrl);
        setScanProgressStep(`✓ Auto-filled from: ${parseResult.formatName}`);
        setScanProgressPercent(100);
        setDocumentUploadStatus(`✓ Scanned: ${parseResult.formatName}`);
      } else {
        setDocumentUploadStatus(`✓ Uploaded: ${file.name}`);
      }
    } catch (err) {
      console.error("Document scan error:", err);
      alert("Failed to scan document: " + err.message);
      setDocumentUploadStatus("Upload/Scan failed");
    } finally {
      setIsScanningDocument(false);
      setIsUploadingDocument(false);
    }
  };

  const uploadDocument = async (file) => {
    if (!file) return;
    try {
      setIsUploadingDocument(true);
      setDocumentUploadStatus("Uploading document...");
      const fileExt = file.name.split('.').pop();
      const fileName = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      let uploadRes = await supabase.storage.from("vendor_tracker").upload(fileName, file, { upsert: true });

      if (uploadRes.error) {
        uploadRes = await supabase.storage.from("complaint_documents").upload(fileName, file, { upsert: true });
        if (uploadRes.error) throw uploadRes.error;
        const { data } = supabase.storage.from("complaint_documents").getPublicUrl(fileName);
        setFormData(prev => ({ ...prev, documentUrl: data.publicUrl }));
        setUploadedDocFileName(file.name);
        setDocumentUploadStatus(`✓ Uploaded: ${file.name}`);
        return;
      }

      const { data } = supabase.storage.from("vendor_tracker").getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, documentUrl: data.publicUrl }));
      setUploadedDocFileName(file.name);
      setDocumentUploadStatus(`✓ Uploaded: ${file.name}`);
    } catch (err) {
      console.error("Document upload error:", err);
      alert("Failed to upload document: " + err.message);
      setDocumentUploadStatus("Upload failed");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const uploadUpdateDocument = async (file) => {
    if (!file) return;
    try {
      setIsUploadingUpdateDoc(true);
      setUpdateDocStatus("Uploading document...");
      const fileExt = file.name.split('.').pop();
      const fileName = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      let uploadRes = await supabase.storage.from("vendor_tracker").upload(fileName, file, { upsert: true });

      if (uploadRes.error) {
        uploadRes = await supabase.storage.from("complaint_documents").upload(fileName, file, { upsert: true });
        if (uploadRes.error) throw uploadRes.error;
        const { data } = supabase.storage.from("complaint_documents").getPublicUrl(fileName);
        setUpdateFormData(prev => ({ ...prev, documentUrl: data.publicUrl }));
        setUpdateDocStatus(`✓ Uploaded: ${file.name}`);
        return;
      }

      const { data } = supabase.storage.from("vendor_tracker").getPublicUrl(fileName);
      setUpdateFormData(prev => ({ ...prev, documentUrl: data.publicUrl }));
      setUpdateDocStatus(`✓ Uploaded: ${file.name}`);
    } catch (err) {
      console.error("Document upload error:", err);
      alert("Failed to upload document: " + err.message);
      setUpdateDocStatus("Upload failed");
    } finally {
      setIsUploadingUpdateDoc(false);
    }
  };

  // Batch & Stream all rows from FMS (bypassing Supabase 1,000 row default limit)
  const fetchTableData = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      setDataError(null)

      const currentUser = localStorage.getItem('currentUser')
      const userRole = localStorage.getItem('userRole')
      const isTech = userRole === 'tech' && Boolean(currentUser)

      const CHUNK_SIZE = 1000
      let totalCount = 0

      // Step 1: Get exact total record count from Supabase
      try {
        let countQuery = supabase
          .from("FMS")
          .select("*", { count: "exact", head: true })

        if (isTech) {
          countQuery = countQuery.ilike("technician_name", currentUser)
        }

        const { count, error: countErr } = await countQuery
        if (!countErr && typeof count === 'number' && count > 0) {
          totalCount = count
        }
      } catch (err) {
        console.warn("Could not retrieve exact count from FMS:", err)
      }

      setLoadingProgress({ loaded: 0, total: totalCount, isLoading: true })

      let allRows = []

      // Step 2: Fetch first batch immediately (0 to 999) for instant render
      let firstQuery = supabase
        .from("FMS")
        .select("*")
        .order("id", { ascending: false })
        .range(0, CHUNK_SIZE - 1)

      if (isTech) {
        firstQuery = firstQuery.ilike("technician_name", currentUser)
      }

      const { data: firstData, error: firstErr } = await firstQuery
      if (firstErr) throw firstErr

      allRows = firstData || []
      // Display first 1000 records immediately to user
      setTableData(allRows)
      setLoadingProgress({
        loaded: allRows.length,
        total: totalCount || allRows.length,
        isLoading: totalCount > CHUNK_SIZE || allRows.length === CHUNK_SIZE
      })

      // Step 3: High-speed parallel batch fetch for remaining records up to 1 lakh+
      if (totalCount > CHUNK_SIZE) {
        const totalBatches = Math.ceil(totalCount / CHUNK_SIZE)
        const CONCURRENCY = 6 // 6 parallel requests per round

        for (let i = 1; i < totalBatches; i += CONCURRENCY) {
          const batchPromises = []
          for (let j = i; j < Math.min(i + CONCURRENCY, totalBatches); j++) {
            const from = j * CHUNK_SIZE
            const to = from + CHUNK_SIZE - 1
            let q = supabase
              .from("FMS")
              .select("*")
              .order("id", { ascending: false })
              .range(from, to)

            if (isTech) {
              q = q.ilike("technician_name", currentUser)
            }
            batchPromises.push(q)
          }

          const results = await Promise.all(batchPromises)
          for (const res of results) {
            if (res.error) throw res.error
            if (res.data) allRows.push(...res.data)
          }

          setLoadingProgress({ loaded: allRows.length, total: totalCount, isLoading: true })
          setTableData([...allRows])
        }
      } else if (!totalCount && allRows.length === CHUNK_SIZE) {
        // Fallback: iterative range fetch until all data is retrieved
        let from = CHUNK_SIZE
        while (true) {
          let q = supabase
            .from("FMS")
            .select("*")
            .order("id", { ascending: false })
            .range(from, from + CHUNK_SIZE - 1)

          if (isTech) {
            q = q.ilike("technician_name", currentUser)
          }

          const { data, error } = await q
          if (error) throw error
          if (!data || data.length === 0) break

          allRows.push(...data)
          setLoadingProgress({ loaded: allRows.length, total: null, isLoading: true })
          setTableData([...allRows])

          if (data.length < CHUNK_SIZE) break
          from += CHUNK_SIZE
        }
      }

      setTableData(allRows)
      setLoadingProgress({ loaded: allRows.length, total: totalCount || allRows.length, isLoading: false })

      if (allRows.length === 0) {
        setDataError(
          userRole === 'tech'
            ? 'No complaints assigned to you'
            : 'No complaints found'
        )
      }
    } catch (error) {
      console.error('Error fetching table data:', error)
      setDataError(error.message)
      setLoadingProgress(prev => ({ ...prev, isLoading: false }))
    } finally {
      isFetchingRef.current = false
    }
  }, [])

  // Auto-refresh: lightweight check for newer rows without re-downloading 1 lakh rows
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const interval = setInterval(async () => {
      if (isFetchingRef.current) return

      const currentUser = localStorage.getItem('currentUser')
      const userRole = localStorage.getItem('userRole')
      const isTech = userRole === 'tech' && Boolean(currentUser)

      // If tableData has rows, check for rows with id > maxId
      if (tableData.length > 0) {
        const maxId = tableData.reduce((max, r) => (r.id > max ? r.id : max), 0)
        if (maxId > 0) {
          try {
            let q = supabase
              .from("FMS")
              .select("*")
              .gt("id", maxId)
              .order("id", { ascending: false })

            if (isTech) {
              q = q.ilike("technician_name", currentUser)
            }

            const { data: newRows, error } = await q
            if (!error && newRows && newRows.length > 0) {
              setTableData(prev => [...newRows, ...prev])
            }
          } catch (e) {
            console.warn("Incremental auto-refresh error:", e)
          }
          return
        }
      }

      fetchTableData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, tableData, fetchTableData])


  // Component mount effects
  // Component mount effects
  useEffect(() => {
    const initializeData = async () => {
      // ✅ Parallelize fetches for faster loading
      const dropdownPromise = fetchDropdownOptions()
      const tablePromise = fetchTableData()

      // We still want to generate serial number reliably. 
      // Let's run it in parallel too.
      const serialPromise = generateSerialNumber()

      await Promise.all([dropdownPromise, tablePromise, serialPromise])
    }

    initializeData()
  }, [fetchTableData, generateSerialNumber])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'technicianName' && value) {
      const selectedTechnician = technicianMapping.find(tech => tech.name === value)
      if (selectedTechnician) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          technicianContact: selectedTechnician.contact
        }))
      }
    }
  }

  // ✅ NEW FUNCTION - Open Update Modal with Pre-filled Data
  // ✅ Fixed UPDATE MODAL - Correct field mapping from Supabase columns
  const handleOpenUpdateModal = (rowOrIndex) => {
    const currentRow = typeof rowOrIndex === 'object' && rowOrIndex !== null
      ? rowOrIndex
      : (filteredTableData[rowOrIndex] || tableData[rowOrIndex])

    if (!currentRow) return
    console.log('Opening update modal for row:', currentRow)

    const actualRowIndex = tableData.findIndex(r => r.id === currentRow.id)

    // Pre-fill all form data with correct Supabase column names
    setUpdateFormData({
      rowIndex: actualRowIndex !== -1 ? actualRowIndex : 0,
      actualRowNumber: currentRow.id, // Store the actual row ID for reference
      complaintId: currentRow.complaint_id || "",
      companyName: currentRow.company_name || "",
      modeOfCall: currentRow.mode_of_call || "",
      idNumber: currentRow.id_number || "",
      projectName: currentRow.project_name || "",
      complaintNumber: currentRow.complaint_number || "",
      complaintDate: parseToDate(currentRow.complaint_date),
      beneficiaryName: currentRow.beneficiary_name || "",
      contactNumber: currentRow.contact_number || "",
      village: currentRow.village || "",
      block: currentRow.block || "",
      district: currentRow.district || "",
      product: currentRow.product || "",
      make: currentRow.make || "",
      rating: currentRow.rating || "",
      qty: currentRow.qty || "",
      insuranceType: currentRow.insurance_type || "",
      natureOfComplaint: currentRow.nature_of_complaint || "",
      technicianName: currentRow.technician_name || "",
      technicianContact: currentRow.technician_contact || "",
      assigneeWhatsapp: currentRow.assignee_whatsapp_number || "",
      controllerRidNo: currentRow.controller_rid_no || "",
      productSlNo: currentRow.product_sl_no || "",
      challanDate: parseToDate(currentRow.challan_date),
      closeDate: parseToDate(currentRow.close_date),
      resolvedDate: parseToDate(currentRow.resolved_date),
      reporterName: currentRow.reporter_name || localStorage.getItem('username') || localStorage.getItem('currentUser') || "",
      challanNo: currentRow.challan_no || "",
      letterReferenceNumber: currentRow.letter_reference_number || "",
      modeOfLetter: currentRow.mode_of_letter || "",
      isReferenceName: !currentRow.contact_number && !!currentRow.reference_name,
      referenceName: currentRow.reference_name || "",
      documentUrl: currentRow.document_url || "",
    })

    setCurrentUpdateRow(actualRowIndex !== -1 ? actualRowIndex : 0)
    setShowUpdateModal(true)
  }



  // ✅ Handle Update Form Change
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target
    setUpdateFormData((prev) => ({ ...prev, [name]: value }))
  }

  // ✅ Handle Update Form Select Change
  const handleUpdateSelectChange = (name, value) => {
    setUpdateFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'technicianName' && value) {
      const selectedTechnician = technicianMapping.find(tech => tech.name === value)
      if (selectedTechnician) {
        setUpdateFormData((prev) => ({
          ...prev,
          [name]: value,
          technicianContact: selectedTechnician.contact
        }))
      }
    }
  }




  const handleUpdateSubmit = async (e) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      let updateQuery = supabase
        .from("FMS")
        .update({
          company_name: updateFormData.companyName,
          mode_of_call: updateFormData.modeOfCall,
          id_number: updateFormData.idNumber,
          project_name: updateFormData.projectName,
          complaint_number: updateFormData.complaintNumber,
          complaint_date: updateFormData.complaintDate,
          beneficiary_name: updateFormData.beneficiaryName,
          contact_number: updateFormData.contactNumber,
          village: updateFormData.village,
          block: updateFormData.block,
          district: updateFormData.district,
          product: updateFormData.product,
          make: updateFormData.make,
          rating: updateFormData.rating,
          qty: updateFormData.qty,
          insurance_type: updateFormData.insuranceType,
          nature_of_complaint: updateFormData.natureOfComplaint,
          technician_name: updateFormData.technicianName,
          technician_contact: updateFormData.technicianContact,
          assignee_whatsapp_number: updateFormData.assigneeWhatsapp,
          controller_rid_no: updateFormData.controllerRidNo,
          product_sl_no: updateFormData.productSlNo,
          challan_date: updateFormData.challanDate,
          close_date: updateFormData.closeDate,
          resolved_date: updateFormData.resolvedDate,
          reporter_name: updateFormData.reporterName,
          challan_no: updateFormData.challanNo,
          letter_reference_number: updateFormData.letterReferenceNumber || null,
          mode_of_letter: updateFormData.modeOfLetter || null,
          reference_name: updateFormData.referenceName || null,
          document_url: updateFormData.documentUrl || null,
        })

      if (updateFormData.actualRowNumber) {
        updateQuery = updateQuery.eq("id", updateFormData.actualRowNumber)
      } else {
        updateQuery = updateQuery.eq("complaint_id", updateFormData.complaintId)
      }

      const { error } = await updateQuery

      if (error) throw error

      alert("Updated successfully")
      setShowUpdateModal(false)
      await fetchTableData()

    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }



  // Export to Excel handler
  const handleExportToExcel = () => {
    try {
      setIsExporting(true)
      if (!filteredTableData || filteredTableData.length === 0) {
        alert("No complaints data to export.")
        return
      }

      const exportRows = filteredTableData.map((row) => ({
        "Created Date": formatDateTimeDisplay(row.created_at || row.timestamp),
        "Complaint ID": row.complaint_id || "-",
        "ID Number": row.id_number || "-",
        "Project Name": row.project_name || "-",
        "Complaint Number": row.complaint_number || "-",
        "Complaint Date": formatDateDisplay(row.complaint_date),
        "Company Name": row.company_name || "-",
        "Mode of Call": row.mode_of_call || "-",
        "Mode of Letter": row.mode_of_letter || "-",
        "Letter Ref Number": row.letter_reference_number || "-",
        "Beneficiary Name": row.beneficiary_name || "-",
        "Contact Number": row.contact_number || "-",
        "Reference Name": row.reference_name || "-",
        "Village": row.village || "-",
        "Block": row.block || "-",
        "District": row.district || "-",
        "Product": row.product || "-",
        "Make": row.make || "-",
        "Rating": row.rating || "-",
        "Quantity": row.qty || "-",
        "Insurance Type": row.insurance_type || "-",
        "Nature of Complaint": row.nature_of_complaint || "-",
        "Technician Name": row.technician_name || "-",
        "Technician Contact": row.technician_contact || "-",
        "Assignee WhatsApp": row.assignee_whatsapp_number || "-",
        "Reporter Name": row.reporter_name || "-",
        "Challan No": row.challan_no || "-",
        "Challan Date": formatDateDisplay(row.challan_date),
        "Resolved Date": formatDateDisplay(row.resolved_date),
        "Controller RID No": row.controller_rid_no || "-",
        "Product SL No": row.product_sl_no || "-",
        "Assign to Vendor": row.assign_to_vendor ? "Yes" : "No",
        "Document URL": row.document_url || "-",
        "Status": row.status || "In Progress",
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints")

      const dateStr = new Date().toISOString().split("T")[0]
      XLSX.writeFile(workbook, `Complaints_Data_${dateStr}.xlsx`)
    } catch (err) {
      console.error("Export to Excel error:", err)
      alert("Failed to export Excel: " + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  // Add refresh button handler - full reload
  const handleRefreshData = async () => {
    setIsLoading(true)
    await fetchTableData(true)
    setIsLoading(false)
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!serialNumber) throw new Error("Serial number missing")

      const submissionTimestamp = new Date().toISOString()
      const { error } = await supabase.from("FMS").insert([{
        timestamp: submissionTimestamp,
        created_at: submissionTimestamp,
        complaint_id: serialNumber,
        company_name: formData.companyName,
        mode_of_call: formData.modeOfCall,
        id_number: formData.idNumber,
        project_name: formData.projectName,
        complaint_number: formData.complaintNumber,
        complaint_date: complaintDate,
        beneficiary_name: formData.beneficiaryName,
        contact_number: formData.contactNumber,
        village: formData.village,
        block: formData.block,
        district: formData.district,
        product: formData.product,
        make: formData.make,
        rating: formData.rating,
        qty: formData.qty,
        insurance_type: formData.insuranceType,
        nature_of_complaint: formData.natureOfComplaint,
        technician_name: formData.technicianName,
        technician_contact: formData.technicianContact,
        assignee_whatsapp_number: formData.assigneeWhatsapp,

        // ✅ FIXED
        challan_no: formData.challanNo,
        challan_date: challanDate,
        resolved_date: resolvedDate,
        reporter_name: formData.reporterName,
        controller_rid_no: formData.controllerRidNo,
        product_sl_no: formData.productSlNo || "",
        letter_reference_number: formData.letterReferenceNumber || null,
        mode_of_letter: formData.modeOfLetter || null,
        reference_name: formData.referenceName || null,
        document_url: formData.documentUrl || null,

        assign_to_vendor: formData.assignToVendor,
      }])



      if (error) throw error

      alert("Created ✅")

      // ✅ WHATSAPP INTEGRATION
      try {
        if (formData.technicianContact) {
          const { data: whatsappData, error: whatsappError } = await supabase.functions.invoke('send-whatsapp-complaint', {
            body: {
              technicianContact: formData.technicianContact,
              companyName: formData.companyName,
              beneficiaryName: formData.beneficiaryName,
              contactNumber: formData.contactNumber,
              district: formData.district,
              block: formData.block,
              village: formData.village,
              product: formData.product,
              resolvedDate: resolvedDate ? resolvedDate.toLocaleDateString('en-GB') : "",
              reporterName: formData.reporterName,
              complaintId: serialNumber
            }
          })
          if (whatsappError) console.error('WhatsApp Error:', whatsappError)
          else console.log('WhatsApp Response:', whatsappData)
        }
      } catch (wsErr) {
        console.error('WhatsApp Invoke Error:', wsErr)
      }

      // ✅ FORM RESET
      const loggedInUsernameOnReset = localStorage.getItem('username') || localStorage.getItem('currentUser') || ""
      setFormData({
        companyName: "",
        modeOfCall: "",
        letterReferenceNumber: "",
        modeOfLetter: "",
        idNumber: "",
        projectName: "",
        complaintNumber: "",
        beneficiaryName: "",
        contactNumber: "",
        isReferenceName: false,
        referenceName: "",
        village: "",
        block: "",
        district: "",
        product: "",
        make: "",
        rating: "",
        qty: "",
        controllerRidNo: "",
        productSlNo: "",
        insuranceType: "",
        natureOfComplaint: "",
        technicianName: "",
        technicianContact: "",
        assigneeWhatsapp: "",
        challanNo: "",
        reporterName: loggedInUsernameOnReset,
        assignToVendor: false,
        documentUrl: "",
      })
      setDocumentUploadStatus("")
      setScanResult(null)
      setDetectedRecords([])
      setActiveRecordIndex(1)
      setUploadedDocFileName("")
      setScanProgressStep("")
      setScanProgressPercent(0)

      setComplaintDate(null)
      setChallanDate(null)
      setCloseDate(null)
      setResolvedDate(null)

      // ✅ TABLE REFRESH
      await fetchTableData()

      // ✅ NEW SERIAL
      await generateSerialNumber()

      // Close modal
      setShowForm(false)

    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleDelete = async (rowId) => {
    if (!window.confirm("Are you sure?")) return

    try {
      const { error } = await supabase
        .from("FMS")
        .delete()
        .eq("id", rowId)

      if (error) throw error

      alert("Deleted successfully")
      await fetchTableData()

    } catch (error) {
      console.error(error)
      alert(error.message)
    }
  }



  return (
    <div className="rounded-lg border-0 shadow-md bg-white">
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Header with buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const loggedInUser = localStorage.getItem('username') || localStorage.getItem('currentUser') || ""
                    if (loggedInUser && !formData.reporterName) {
                      setFormData(prev => ({ ...prev, reporterName: loggedInUser }))
                    }
                    setScanResult(null)
                    setDetectedRecords([])
                    setActiveRecordIndex(1)
                    setUploadedDocFileName("")
                    setScanProgressStep("")
                    setScanProgressPercent(0)
                    setShowForm(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center shadow-sm hover:shadow cursor-pointer transition-all"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Complaint
                </button>
              </div>
            </div>



            {/* ✅ ADD COMPLAINT MODAL - POPUP FORM */}
            {
              showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">New Complaint Form</h2>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                      {/* Grid Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* ✅ 1. FIRST FIELD: DOCUMENT UPLOAD & AUTO-FILL */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                          <div className="border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-xl p-4 sm:p-5 shadow-xs transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    Document Upload (Auto-Fill Form)
                                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                                      Field #1
                                    </span>
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    Upload government complaint document (PDF, JPG, PNG, Word) to automatically scan, detect format, and fill form fields.
                                  </p>
                                </div>
                              </div>

                              {formData.documentUrl && (
                                <a
                                  href={formData.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 transition shadow-xs"
                                >
                                  <span>View Document</span>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>

                            {/* File Input & Upload Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <label className="flex-1 cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  disabled={isScanningDocument}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleDocumentUploadAndScan(file);
                                  }}
                                  className="hidden"
                                  id="government-document-upload-field"
                                />
                                <div className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-dashed rounded-lg transition-all ${isScanningDocument
                                    ? "border-blue-400 bg-blue-50/50 cursor-wait"
                                    : scanResult
                                      ? "border-emerald-300 hover:border-emerald-400"
                                      : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/30"
                                  }`}>
                                  <div className="flex items-center gap-2.5 truncate">
                                    <svg className={`w-5 h-5 flex-shrink-0 ${scanResult ? "text-emerald-600" : "text-blue-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                      {uploadedDocFileName || "Choose document to scan (PDF, JPG, PNG, Word)..."}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md shadow-xs flex-shrink-0 ml-2">
                                    Browse
                                  </span>
                                </div>
                              </label>

                              {uploadedDocFileName && !isScanningDocument && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedDocFileName("");
                                    setScanResult(null);
                                    setDetectedRecords([]);
                                    setScanProgressStep("");
                                    setDocumentUploadStatus("");
                                    const input = document.getElementById("government-document-upload-field");
                                    if (input) input.value = "";
                                  }}
                                  className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition border border-gray-200 self-center"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            {/* Scanning State */}
                            {isScanningDocument && (
                              <div className="mt-3 p-3 bg-blue-100/70 border border-blue-300 rounded-lg">
                                <div className="flex items-center justify-between text-xs text-blue-900 font-medium mb-1.5">
                                  <span className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                    Reading document and extracting complaint details…
                                  </span>
                                  <span className="font-bold">{scanProgressPercent}%</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${scanProgressPercent}%` }}
                                  ></div>
                                </div>
                                <p className="text-[11px] text-blue-700 mt-1 italic">
                                  {scanProgressStep}
                                </p>
                              </div>
                            )}

                            {/* Auto-Fill Results & Record Switcher */}
                            {scanResult && !isScanningDocument && (
                              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                      ✓
                                    </span>
                                    <div>
                                      <span className="text-xs font-bold text-emerald-900">
                                        Auto-Fill Active: {scanResult.formatName}
                                      </span>
                                      <p className="text-[11px] text-emerald-700">
                                        Information successfully mapped to form fields. You can manually edit any field below.
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 self-start sm:self-auto">
                                    {detectedRecords.length} {detectedRecords.length === 1 ? "Record" : "Records"} Detected
                                  </span>
                                </div>

                                {/* Multi-Record Switcher (For documents with multiple rows like Format 1) */}
                                {detectedRecords.length > 1 && (
                                  <div className="mt-3 pt-2.5 border-t border-emerald-200">
                                    <p className="text-xs font-semibold text-gray-800 mb-1.5">
                                      Select Record to Populate into Form:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {detectedRecords.map((rec) => (
                                        <button
                                          key={rec.recordIndex}
                                          type="button"
                                          onClick={() => handleSelectRecord(rec.recordIndex)}
                                          className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition cursor-pointer ${activeRecordIndex === rec.recordIndex
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                          {rec.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Supported Formats Info */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                              <span className="font-semibold text-gray-600">Supported Formats:</span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Format 1: CREDA Multi-Notice</span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Format 2: Gariyaband Camp</span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Format 3: RBP Rectification</span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Format 4: SPVPP Power Plant</span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Format 5: Premier Energies</span>
                            </div>
                          </div>
                        </div>

                        {/* Company Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name *
                          </label>
                          <SearchableSelect
                            name="companyName"
                            options={companyNameOptions}
                            value={formData.companyName}
                            onChange={(val) => setFormData(prev => ({ ...prev, companyName: val }))}
                            placeholder="Select Company"
                            required
                          />
                        </div>

                        {/* Mode of Call */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mode of Call *
                          </label>
                          <SearchableSelect
                            name="modeOfCall"
                            options={modeOfCallOptions}
                            value={formData.modeOfCall}
                            onChange={(val) => setFormData(prev => ({ ...prev, modeOfCall: val }))}
                            placeholder="Select Mode of Call"
                            required
                          />
                        </div>

                        {/* Conditional Letter Fields - Shown when Mode of Call is "Letter" */}
                        {formData.modeOfCall?.toLowerCase() === "letter" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                Letter Reference Number *
                              </label>
                              <input
                                type="text"
                                name="letterReferenceNumber"
                                value={formData.letterReferenceNumber || ""}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-purple-300 bg-purple-50/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter Letter Ref Number"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                Mode of Letter *
                              </label>
                              <SearchableSelect
                                name="modeOfLetter"
                                options={modeOfLetterOptions}
                                value={formData.modeOfLetter || ""}
                                onChange={(val) => setFormData(prev => ({ ...prev, modeOfLetter: val }))}
                                placeholder="Select Mode of Letter"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* ID Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ID Number
                          </label>
                          <input
                            type="text"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter ID Number"
                          />
                        </div>

                        {/* Project Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name *
                          </label>
                          <SearchableSelect
                            name="projectName"
                            required
                            options={projectNameOptions}
                            value={formData.projectName}
                            onChange={(val) => setFormData(prev => ({ ...prev, projectName: val }))}
                            placeholder="Select Project Name"
                          />
                        </div>

                        {/* Complaint Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Complaint Number
                          </label>
                          <input
                            type="text"
                            name="complaintNumber"
                            value={formData.complaintNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Complaint Number"
                          />
                        </div>

                        {/* Complaint Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Complaint Date *
                          </label>
                          <DatePicker
                            selected={isValidDate(complaintDate) ? complaintDate : null}
                            onChange={(date) => setComplaintDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select complaint date"
                            required
                          />
                        </div>

                        {/* Beneficiary Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Beneficiary Name *
                          </label>
                          <input
                            type="text"
                            name="beneficiaryName"
                            value={formData.beneficiaryName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Beneficiary Name"
                          />

                        </div >

                        {/* Contact Number */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Contact Number {!formData.isReferenceName && <span className="text-red-500">*</span>}
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition">
                              <input
                                type="checkbox"
                                name="isReferenceName"
                                checked={formData.isReferenceName || false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFormData(prev => ({
                                    ...prev,
                                    isReferenceName: checked,
                                    contactNumber: checked ? "" : prev.contactNumber,
                                  }));
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <span className="font-semibold">Reference name</span>
                            </label>
                          </div>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber || ""}
                            maxLength={10}
                            disabled={formData.isReferenceName}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setFormData(prev => ({ ...prev, contactNumber: digits }));
                            }}
                            required={!formData.isReferenceName}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formData.isReferenceName ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
                              }`}
                            placeholder={formData.isReferenceName ? "Disabled (Reference Selected)" : "Enter 10-digit Contact Number"}
                          />

                          {formData.isReferenceName && (
                            <div className="mt-2">
                              <input
                                type="text"
                                name="referenceName"
                                value={formData.referenceName || ""}
                                onChange={handleChange}
                                required={formData.isReferenceName}
                                className="w-full px-3 py-1.5 text-xs border border-blue-300 bg-blue-50/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Reference Person's Name *"
                              />
                            </div>
                          )}
                        </div>

                        {/* Village */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Village
                          </label>
                          <input
                            type="text"
                            name="village"
                            value={formData.village}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Village"
                          />
                        </div >

                        {/* Block */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Block
                          </label>
                          <input
                            type="text"
                            name="block"
                            value={formData.block}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Block"
                          />
                        </div >

                        {/* District */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            District *
                          </label>
                          <SearchableSelect
                            name="district"
                            options={districtOptions}
                            value={formData.district}
                            onChange={(val) => setFormData(prev => ({ ...prev, district: val }))}
                            placeholder="Select District"
                            required
                          />
                        </div>

                        {/* Product */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product
                          </label>
                          <input
                            type="text"
                            name="product"
                            value={formData.product}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Product"
                          />
                        </div >

                        {/* Make */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Make
                          </label>
                          <input
                            type="text"
                            name="make"
                            value={formData.make}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Make"
                          />
                        </div >

                        {/* Rating */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                          </label>
                          <input
                            type="text"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Rating"
                          />
                        </div >

                        {/* Quantity */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="text"
                            name="qty"
                            value={formData.qty}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Quantity"
                          />
                        </div >

                        {/* Controller RID No */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Controller RID No
                          </label>
                          <input
                            type="text"
                            name="controllerRidNo"
                            value={formData.controllerRidNo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Controller RID No"
                          />
                        </div >

                        {/* Product SL No */}
                        < div >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product SL No
                          </label>
                          <input
                            type="text"
                            name="productSlNo"
                            value={formData.productSlNo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Product SL No"
                          />
                        </div >

                        {/* Insurance Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Insurance Type
                          </label>
                          <SearchableSelect
                            name="insuranceType"
                            options={insuranceTypeOptions}
                            value={formData.insuranceType}
                            onChange={(val) => setFormData(prev => ({ ...prev, insuranceType: val }))}
                            placeholder="Select Insurance Type"
                          />
                        </div>

                        {/* Resolved Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolved Date
                          </label>
                          <DatePicker
                            selected={isValidDate(resolvedDate) ? resolvedDate : null}
                            onChange={(date) => setResolvedDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select resolved date"
                          />
                        </div>

                        {/* Reporter Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reporter Name
                          </label>
                          <input
                            type="text"
                            disabled
                            name="reporterName"
                            value={formData.reporterName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Reporter Name"
                          />
                        </div>



                        {/* Assign to Vendor Checkbox */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <input
                              type="checkbox"
                              id="assignToVendor"
                              name="assignToVendor"
                              checked={formData.assignToVendor}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  assignToVendor: isChecked,
                                  // Clear technician fields when checked
                                  technicianName: isChecked ? "" : prev.technicianName,
                                  technicianContact: isChecked ? "" : prev.technicianContact,
                                  assigneeWhatsapp: isChecked ? "" : prev.assigneeWhatsapp,
                                  challanNo: isChecked ? "" : prev.challanNo,
                                  challanDate: isChecked ? null : prev.challanDate
                                }));
                                if (isChecked) {
                                  setChallanDate(null);
                                }
                              }}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="assignToVendor" className="text-sm font-medium text-red-700">
                              {/* Assign to Vendor  (Disable technician fields) */}
                              Assign To: 👤 Technician by default — ☑️ Check the box to assign to Vendor.
                            </label>
                          </div>
                        </div>


                        {/* Technician Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technician Name
                          </label>
                          <SearchableSelect
                            name="technicianName"
                            options={technicianNameOptions}
                            value={formData.technicianName}
                            onChange={(val) => handleSelectChange('technicianName', val)}
                            disabled={formData.assignToVendor}
                            placeholder="Select Technician"
                          />
                        </div>

                        {/* Technician Contact */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technician Contact
                          </label>
                          <input
                            type="text"
                            name="technicianContact"
                            value={formData.technicianContact}
                            onChange={handleChange}
                            disabled={formData.assignToVendor}  // Add this line
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${formData.assignToVendor ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-100'} text-gray-700`}
                            placeholder="Auto-filled from technician selection"
                            readOnly
                          />
                        </div>

                        {/* Assignee WhatsApp */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assignee WhatsApp
                          </label>
                          <input
                            type="text"
                            name="assigneeWhatsapp"
                            value={formData.assigneeWhatsapp}
                            onChange={handleChange}
                            disabled={formData.assignToVendor}  // Add this line
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.assignToVendor ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Enter WhatsApp Number"
                          />
                        </div>

                        {/* Challan No */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Challan No
                          </label>
                          <input
                            type="text"
                            name="challanNo"
                            value={formData.challanNo}
                            onChange={handleChange}
                            disabled={formData.assignToVendor}  // Add this line
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.assignToVendor ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Enter Challan Number"
                          />
                        </div>

                        {/* Challan Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Challan Date
                          </label>
                          <DatePicker
                            selected={formData.assignToVendor ? null : (isValidDate(challanDate) ? challanDate : null)}
                            onChange={(date) => !formData.assignToVendor && setChallanDate(date)}
                            dateFormat="dd/MM/yyyy"
                            disabled={formData.assignToVendor}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.assignToVendor ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholderText="Select challan date"
                          />
                        </div>

                        {/* Document Upload */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Upload (PDF, Images, Word Docs)
                          </label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadDocument(file);
                              }}
                              disabled={isUploadingDocument}
                              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            {isUploadingDocument && (
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1.5 animate-pulse">
                                <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                Uploading document...
                              </span>
                            )}
                            {documentUploadStatus && !isUploadingDocument && (
                              <span className={`text-xs font-medium ${formData.documentUrl ? "text-emerald-600" : "text-gray-500"}`}>
                                {documentUploadStatus}
                              </span>
                            )}
                            {formData.documentUrl && (
                              <div className="flex items-center gap-2 sm:ml-auto">
                                <a
                                  href={formData.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 underline font-semibold hover:text-blue-800"
                                >
                                  View Current Document ↗
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, documentUrl: "" }));
                                    setDocumentUploadStatus("");
                                    setUploadedDocFileName("");
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 cursor-pointer font-medium"
                                  title="Remove document"
                                >
                                  ✕ Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nature of Complaint - Full Width */}
                      < div >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nature of Complaint *
                        </label>
                        <textarea
                          name="natureOfComplaint"
                          value={formData.natureOfComplaint}
                          onChange={handleChange}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe the nature of complaint..."
                        />
                      </div >

                      {/* Form Buttons */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                        >
                          {isSubmitting ? 'Creating...' : 'Create Complaint'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            {/* ✅ UPDATE MODAL - POPUP FORM WITH PRE-FILLED DATA */}
            {
              showUpdateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Update Complaint - {updateFormData.complaintId}
                      </h2>
                      <button
                        onClick={() => setShowUpdateModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
                      {/* Grid Layout - Same as Create Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* Company Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name *
                          </label>
                          <SearchableSelect
                            name="companyName"
                            options={companyNameOptions}
                            value={updateFormData.companyName}
                            onChange={(val) => handleUpdateSelectChange('companyName', val)}
                            placeholder="Select Company"
                            required
                          />
                        </div>

                        {/* Mode of Call */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mode of Call *
                          </label>
                          <SearchableSelect
                            name="modeOfCall"
                            options={modeOfCallOptions}
                            value={updateFormData.modeOfCall}
                            onChange={(val) => handleUpdateSelectChange('modeOfCall', val)}
                            placeholder="Select Mode of Call"
                            required
                          />
                        </div>

                        {/* Conditional Letter Fields - Shown when Mode of Call is "Letter" */}
                        {updateFormData.modeOfCall?.toLowerCase() === "letter" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                Letter Reference Number *
                              </label>
                              <input
                                type="text"
                                name="letterReferenceNumber"
                                value={updateFormData.letterReferenceNumber || ""}
                                onChange={handleUpdateFormChange}
                                required
                                className="w-full px-3 py-2 border border-purple-300 bg-purple-50/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter Letter Ref Number"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                Mode of Letter *
                              </label>
                              <SearchableSelect
                                name="modeOfLetter"
                                options={modeOfLetterOptions}
                                value={updateFormData.modeOfLetter || ""}
                                onChange={(val) => handleUpdateSelectChange('modeOfLetter', val)}
                                placeholder="Select Mode of Letter"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* ID Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ID Number
                          </label>
                          <input
                            type="text"
                            name="idNumber"
                            value={updateFormData.idNumber}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter ID Number"
                          />
                        </div>

                        {/* Project Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name
                          </label>
                          <SearchableSelect
                            name="projectName"
                            options={projectNameOptions}
                            value={updateFormData.projectName}
                            onChange={(val) => handleUpdateSelectChange('projectName', val)}
                            placeholder="Select Project Name"
                          />
                        </div>

                        {/* Complaint Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Complaint Number
                          </label>
                          <input
                            type="text"
                            name="complaintNumber"
                            value={updateFormData.complaintNumber}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Complaint Number"
                          />
                        </div>

                        {/* Complaint Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Complaint Date *
                          </label>
                          <DatePicker
                            selected={isValidDate(updateFormData.complaintDate) ? updateFormData.complaintDate : null}
                            onChange={(date) => setUpdateFormData(prev => ({ ...prev, complaintDate: date }))}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select complaint date"
                            required
                          />
                        </div>

                        {/* Beneficiary Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Beneficiary Name *
                          </label>
                          <input
                            type="text"
                            name="beneficiaryName"
                            value={updateFormData.beneficiaryName}
                            onChange={handleUpdateFormChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Beneficiary Name"
                          />
                        </div>

                        {/* Contact Number */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Contact Number {!updateFormData.isReferenceName && <span className="text-red-500">*</span>}
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition">
                              <input
                                type="checkbox"
                                name="isReferenceName"
                                checked={updateFormData.isReferenceName || false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setUpdateFormData(prev => ({
                                    ...prev,
                                    isReferenceName: checked,
                                    contactNumber: checked ? "" : prev.contactNumber,
                                  }));
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <span className="font-semibold">Reference name</span>
                            </label>
                          </div>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={updateFormData.contactNumber || ""}
                            maxLength={10}
                            disabled={updateFormData.isReferenceName}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setUpdateFormData(prev => ({ ...prev, contactNumber: digits }));
                            }}
                            required={!updateFormData.isReferenceName}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${updateFormData.isReferenceName ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
                              }`}
                            placeholder={updateFormData.isReferenceName ? "Disabled (Reference Selected)" : "Enter 10-digit Contact Number"}
                          />

                          {updateFormData.isReferenceName && (
                            <div className="mt-2">
                              <input
                                type="text"
                                name="referenceName"
                                value={updateFormData.referenceName || ""}
                                onChange={handleUpdateFormChange}
                                required={updateFormData.isReferenceName}
                                className="w-full px-3 py-1.5 text-xs border border-blue-300 bg-blue-50/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Reference Person's Name *"
                              />
                            </div>
                          )}
                        </div>

                        {/* Village */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Village
                          </label>
                          <input
                            type="text"
                            name="village"
                            value={updateFormData.village}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Village"
                          />
                        </div>

                        {/* Block */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Block
                          </label>
                          <input
                            type="text"
                            name="block"
                            value={updateFormData.block}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Block"
                          />
                        </div>

                        {/* District */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            District *
                          </label>
                          <SearchableSelect
                            name="district"
                            options={districtOptions}
                            value={updateFormData.district}
                            onChange={(val) => handleUpdateSelectChange('district', val)}
                            placeholder="Select District"
                            required
                          />
                        </div>

                        {/* Product */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product
                          </label>
                          <input
                            type="text"
                            name="product"
                            value={updateFormData.product}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Product"
                          />
                        </div>

                        {/* Make */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Make
                          </label>
                          <input
                            type="text"
                            name="make"
                            value={updateFormData.make}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Make"
                          />
                        </div>

                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                          </label>
                          <input
                            type="text"
                            name="rating"
                            value={updateFormData.rating}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Rating"
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="text"
                            name="qty"
                            value={updateFormData.qty}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Quantity"
                          />
                        </div>

                        {/* Controller RID No */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Controller RID No
                          </label>
                          <input
                            type="text"
                            name="controllerRidNo"
                            value={updateFormData.controllerRidNo}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Controller RID No"
                          />
                        </div>

                        {/* Product SL No */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product SL No
                          </label>
                          <input
                            type="text"
                            name="productSlNo"
                            value={updateFormData.productSlNo}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Product SL No"
                          />
                        </div>

                        {/* Insurance Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Insurance Type
                          </label>
                          <SearchableSelect
                            name="insuranceType"
                            options={insuranceTypeOptions}
                            value={updateFormData.insuranceType}
                            onChange={(val) => handleUpdateSelectChange('insuranceType', val)}
                            placeholder="Select Insurance Type"
                          />
                        </div>

                        {/* Resolved Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolved Date
                          </label>
                          <DatePicker
                            selected={isValidDate(updateFormData.resolvedDate) ? updateFormData.resolvedDate : null}
                            onChange={(date) => setUpdateFormData(prev => ({ ...prev, resolvedDate: date }))}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select resolved date"
                          />
                        </div>

                        {/* Reporter Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reporter Name
                          </label>
                          <input
                            type="text"
                            name="reporterName"
                            value={updateFormData.reporterName}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Reporter Name"
                          />
                        </div>

                        {/* Technician Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technician Name
                          </label>
                          <SearchableSelect
                            name="technicianName"
                            options={technicianNameOptions}
                            value={updateFormData.technicianName}
                            onChange={(val) => handleUpdateSelectChange('technicianName', val)}
                            placeholder="Select Technician"
                          />
                        </div>

                        {/* Technician Contact */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technician Contact
                          </label>
                          <input
                            type="text"
                            name="technicianContact"
                            value={updateFormData.technicianContact}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                            placeholder="Auto-filled from technician selection"
                            readOnly
                          />
                        </div>

                        {/* Assignee WhatsApp */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assignee WhatsApp
                          </label>
                          <input
                            type="text"
                            name="assigneeWhatsapp"
                            value={updateFormData.assigneeWhatsapp}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter WhatsApp Number"
                          />
                        </div>

                        {/* Challan No */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Challan No
                          </label>
                          <input
                            type="text"
                            name="challanNo"
                            value={updateFormData.challanNo}
                            onChange={handleUpdateFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Challan Number"
                          />
                        </div>

                        {/* Challan Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Challan Date
                          </label>
                          <DatePicker
                            selected={isValidDate(updateFormData.challanDate) ? updateFormData.challanDate : null}
                            onChange={(date) => setUpdateFormData(prev => ({ ...prev, challanDate: date }))}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select challan date"
                          />
                        </div>

                        {/* Document Upload */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document Upload (PDF, Images, Word Docs)
                          </label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadUpdateDocument(file);
                              }}
                              disabled={isUploadingUpdateDoc}
                              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            {isUploadingUpdateDoc && (
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1.5 animate-pulse">
                                <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                Uploading document...
                              </span>
                            )}
                            {updateDocStatus && !isUploadingUpdateDoc && (
                              <span className={`text-xs font-medium ${updateFormData.documentUrl ? "text-emerald-600" : "text-gray-500"}`}>
                                {updateDocStatus}
                              </span>
                            )}
                            {updateFormData.documentUrl && (
                              <div className="flex items-center gap-2 sm:ml-auto">
                                <a
                                  href={updateFormData.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 underline font-semibold hover:text-blue-800"
                                >
                                  View Current Document ↗
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUpdateFormData(prev => ({ ...prev, documentUrl: "" }));
                                    setUpdateDocStatus("");
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 cursor-pointer font-medium"
                                  title="Remove document"
                                >
                                  ✕ Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Nature of Complaint - Full Width */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nature of Complaint *
                        </label>
                        <textarea
                          name="natureOfComplaint"
                          value={updateFormData.natureOfComplaint}
                          onChange={handleUpdateFormChange}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe the nature of complaint..."
                        />
                      </div>

                      {/* Modal Form Buttons */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowUpdateModal(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Updating...' : 'Update Complaint'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )
            }

            {/* Table with improved UI & Full Submitted Fields */}
            <div className="space-y-4">
              {/* Header and Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    Complaints Data
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {filteredTableData.length.toLocaleString()} {filteredTableData.length === 1 ? 'record' : 'records'}
                      {filteredTableData.length !== tableData.length && ` (of ${tableData.length.toLocaleString()})`}
                    </span>
                    {loadingProgress.isLoading && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        Loading DB: {loadingProgress.loaded.toLocaleString()} / {loadingProgress.total ? loadingProgress.total.toLocaleString() : "..."} ({loadingProgress.total ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100) : 0}%)
                      </span>
                    )}
                    {!loadingProgress.isLoading && tableData.length > 1000 && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        ✓ Full DB ({tableData.length.toLocaleString()} rows)
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {localStorage.getItem('userRole') === 'tech' ? 'Showing complaints assigned to you' : 'Showing all submitted complaints with complete details'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Export to Excel Button */}
                  <button
                    onClick={handleExportToExcel}
                    disabled={isExporting || filteredTableData.length === 0}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs sm:text-sm font-medium rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
                    title="Export filtered complaints to Excel file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {isExporting ? "Exporting..." : "Export Excel"}
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={handleRefreshData}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg border border-gray-200 transition-all cursor-pointer"
                    title="Refresh Complaints Data"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Global Search and Dropdown Filter Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                {/* Global Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search anything (Complaint ID, ID No, Beneficiary, Product, Village, Mobile, Tech, Reporter, etc.)..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                  />
                  {globalSearch && (
                    <button
                      onClick={() => setGlobalSearch("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Reporter Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Filter by Reporter
                    </label>
                    <select
                      value={filterReporterName}
                      onChange={(e) => setFilterReporterName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Reporters</option>
                      {filterReporterOptions.map((reporter) => (
                        <option key={reporter} value={reporter}>
                          {reporter}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Filter by Company
                    </label>
                    <input
                      type="text"
                      value={filterCompanyName}
                      onChange={(e) => setFilterCompanyName(e.target.value)}
                      placeholder="Search company..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Technician Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Filter by Technician
                    </label>
                    <input
                      type="text"
                      value={filterTechnicianName}
                      onChange={(e) => setFilterTechnicianName(e.target.value)}
                      placeholder="Search technician..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Beneficiary Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Filter by Beneficiary
                    </label>
                    <SearchableSelect
                      options={filterBeneficiaryOptions}
                      value={filterBeneficiaryName}
                      onChange={(val) => setFilterBeneficiaryName(val)}
                      placeholder="All Beneficiaries"
                    />
                  </div>
                </div>

                {/* Created Date Filter Row */}
                <div className="pt-2.5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mr-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created Date:</span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                      {[
                        { id: "all", label: "All" },
                        { id: "today", label: "Today" },
                        { id: "yesterday", label: "Yesterday" },
                        { id: "week", label: "Last 7 Days" },
                        { id: "month", label: "This Month" },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyDatePreset(preset.id)}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${dateFilterPreset === preset.id
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Pickers for Custom Range */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">From:</span>
                      <DatePicker
                        selected={isValidDate(filterCreatedDateFrom) ? filterCreatedDateFrom : null}
                        onChange={(date) => {
                          setFilterCreatedDateFrom(date)
                          setDateFilterPreset("custom")
                        }}
                        dateFormat="dd/MM/yyyy"
                        className="w-28 px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholderText="DD/MM/YYYY"
                        isClearable
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">To:</span>
                      <DatePicker
                        selected={isValidDate(filterCreatedDateTo) ? filterCreatedDateTo : null}
                        onChange={(date) => {
                          setFilterCreatedDateTo(date)
                          setDateFilterPreset("custom")
                        }}
                        dateFormat="dd/MM/yyyy"
                        className="w-28 px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholderText="DD/MM/YYYY"
                        isClearable
                      />
                    </div>

                    {(filterCreatedDateFrom || filterCreatedDateTo) && (
                      <button
                        type="button"
                        onClick={() => applyDatePreset("all")}
                        className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                        title="Clear Date Filter"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Clear All Filters */}
                {(globalSearch || filterReporterName || filterCompanyName || filterTechnicianName || filterBeneficiaryName || filterCreatedDateFrom || filterCreatedDateTo) && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setGlobalSearch("")
                        setFilterReporterName("")
                        setFilterCompanyName("")
                        setFilterTechnicianName("")
                        setFilterBeneficiaryName("")
                        applyDatePreset("all")
                      }}
                      className="inline-flex items-center gap-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {dataError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">Error: {dataError}</p>
                  </div>
                  <button
                    onClick={handleRefreshData}
                    className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredTableData.length > 0 ? (
                <>
                  {/* Top Pagination Bar */}
                  {renderPagination("top")}

                  {/* Desktop Table View - All Submitted Form Values */}
                  <div className="hidden lg:block border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-center">
                        <thead className="bg-gray-100 sticky top-0 z-20 text-center whitespace-nowrap">
                          <tr>
                            <th scope="col" className="sticky left-0 top-0 z-30 px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] border-r border-gray-200">
                              Action
                            </th>
                            <th scope="col" className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Created Date
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Complaint ID
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Complaint Date
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              ID Number
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Project Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Complaint Number
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Company Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Mode Of Call
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Mode Of Letter
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Letter Ref No
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Beneficiary Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Contact Number
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Reference Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Village
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Block
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              District
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Product
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Make
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Rating
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Quantity
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Insurance Type
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Nature Of Complaint
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Technician Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Technician Contact
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Assignee WhatsApp
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Reporter Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Challan No
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Challan Date
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Resolved Date
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Controller RID
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Product SL No
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Assign to Vendor
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Document
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-center whitespace-normal">
                          {paginatedTableData.map((row, rowIndex) => (
                            <tr key={`complaint-${row.id}-${rowIndex}`} className="hover:bg-blue-50/40 group transition-colors">
                              {/* Action Buttons */}
                              <td className="sticky left-0 z-10 px-3 py-3.5 whitespace-nowrap bg-white group-hover:bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] border-r border-gray-200">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    onClick={() => handleOpenUpdateModal(row)}
                                    className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium cursor-pointer transition shadow-2xs"
                                  >
                                    Update
                                  </button>
                                  <button
                                    onClick={() => handleDelete(row.id)}
                                    className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium cursor-pointer transition shadow-2xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>

                              {/* Created Date */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap font-medium text-left">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-mono text-[11px]">
                                  <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDateTimeDisplay(row.created_at || row.timestamp)}
                                </span>
                              </td>

                              {/* Complaint ID */}
                              <td className="px-3 py-3.5 text-xs text-blue-600 font-semibold whitespace-nowrap">
                                {row.complaint_id || "-"}
                              </td>

                              {/* Complaint Date */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {formatDateDisplay(row.complaint_date)}
                              </td>

                              {/* ID Number */}
                              <td className="px-3 py-3.5 text-xs text-purple-600 font-medium whitespace-nowrap">
                                {row.id_number || "-"}
                              </td>

                              {/* Project Name */}
                              <td className="px-3 py-3.5 text-xs text-gray-800 whitespace-nowrap">
                                {row.project_name || "-"}
                              </td>

                              {/* Complaint Number */}
                              <td className="px-3 py-3.5 text-xs text-gray-800 whitespace-nowrap">
                                {row.complaint_number || "-"}
                              </td>

                              {/* Company Name */}
                              <td className="px-3 py-3.5 text-xs font-medium text-gray-800 whitespace-nowrap">
                                {row.company_name || "-"}
                              </td>

                              {/* Mode Of Call */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.mode_of_call || "-"}
                              </td>

                              {/* Mode Of Letter */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.mode_of_letter || "-"}
                              </td>

                              {/* Letter Ref No */}
                              <td className="px-3 py-3.5 text-xs text-purple-600 font-medium whitespace-nowrap">
                                {row.letter_reference_number || "-"}
                              </td>

                              {/* Beneficiary Name */}
                              <td className="px-3 py-3.5 text-xs text-gray-800 font-medium min-w-[130px] break-words text-left">
                                {row.beneficiary_name || "-"}
                              </td>

                              {/* Contact Number */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.contact_number || "-"}
                              </td>

                              {/* Reference Name */}
                              <td className="px-3 py-3.5 text-xs text-amber-800 font-medium whitespace-nowrap">
                                {row.reference_name || "-"}
                              </td>

                              {/* Village */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.village || "-"}
                              </td>

                              {/* Block */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.block || "-"}
                              </td>

                              {/* District */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.district || "-"}
                              </td>

                              {/* Product */}
                              <td className="px-3 py-3.5 text-xs text-gray-800 font-medium whitespace-nowrap">
                                {row.product || "-"}
                              </td>

                              {/* Make */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.make || "-"}
                              </td>

                              {/* Rating */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.rating || "-"}
                              </td>

                              {/* Quantity */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.qty || "-"}
                              </td>

                              {/* Insurance Type */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.insurance_type || "-"}
                              </td>

                              {/* Nature Of Complaint */}
                              <td className="px-3 py-3.5 text-xs text-gray-800 min-w-[200px] max-w-[300px] break-words text-left">
                                {row.nature_of_complaint || "-"}
                              </td>

                              {/* Technician Name */}
                              <td className="px-3 py-3.5 text-xs text-gray-800 font-medium whitespace-nowrap">
                                {row.technician_name || "-"}
                              </td>

                              {/* Technician Contact */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.technician_contact || "-"}
                              </td>

                              {/* Assignee WhatsApp */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.assignee_whatsapp_number || "-"}
                              </td>

                              {/* Reporter Name */}
                              <td className="px-3 py-3.5 text-xs whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  {row.reporter_name || "-"}
                                </span>
                              </td>

                              {/* Challan No */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.challan_no || "-"}
                              </td>

                              {/* Challan Date */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {formatDateDisplay(row.challan_date)}
                              </td>

                              {/* Resolved Date */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {formatDateDisplay(row.resolved_date)}
                              </td>

                              {/* Controller RID */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.controller_rid_no || "-"}
                              </td>

                              {/* Product SL No */}
                              <td className="px-3 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                                {row.product_sl_no || "-"}
                              </td>

                              {/* Assign to Vendor */}
                              <td className="px-3 py-3.5 text-xs whitespace-nowrap">
                                {row.assign_to_vendor ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>

                              {/* Document */}
                              <td className="px-3 py-3.5 text-xs whitespace-nowrap">
                                {row.document_url ? (
                                  <a
                                    href={row.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                                  >
                                    📄 View
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-3 py-3.5 text-xs whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${String(row.status || '').toUpperCase() === 'APPROVED-CLOSE'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                  {row.status || "In Progress"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View - All Submitted Form Values */}
                  <div className="lg:hidden space-y-4">
                    {paginatedTableData.map((row, rowIndex) => (
                      <div
                        key={`mobile-${row.id}-${rowIndex}`}
                        className="border rounded-xl p-4 bg-white border-gray-200 shadow-xs space-y-3"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Complaint ID</div>
                            <div className="font-bold text-blue-600 text-base">
                              {row.complaint_id || "-"}
                            </div>
                            {/* Created Date & Time */}
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <span>📅 Created:</span>
                              <span className="font-medium text-gray-700">{formatDateTimeDisplay(row.created_at || row.timestamp)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenUpdateModal(row)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium cursor-pointer shadow-2xs"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${String(row.status || '').toUpperCase() === 'APPROVED-CLOSE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                            {row.status || "In Progress"}
                          </span>
                          {row.company_name && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full font-medium">
                              {row.company_name}
                            </span>
                          )}
                          {row.project_name && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-200">
                              {row.project_name}
                            </span>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 pt-1">
                          <div><b>ID Number:</b> {row.id_number || "-"}</div>
                          <div><b>Complaint No:</b> {row.complaint_number || "-"}</div>
                          <div><b>Complaint Date:</b> {formatDateDisplay(row.complaint_date)}</div>
                          <div><b>Mode of Call:</b> {row.mode_of_call || "-"}</div>
                          {row.mode_of_letter && <div><b>Letter Mode:</b> {row.mode_of_letter}</div>}
                          {row.letter_reference_number && <div><b>Letter Ref:</b> {row.letter_reference_number}</div>}
                          <div><b>Beneficiary:</b> {row.beneficiary_name || "-"}</div>
                          <div><b>Contact:</b> {row.contact_number || "-"}</div>
                          {row.reference_name && <div className="col-span-2 text-amber-800"><b>Reference Name:</b> {row.reference_name}</div>}
                          <div><b>Village:</b> {row.village || "-"}</div>
                          <div><b>Block:</b> {row.block || "-"}</div>
                          <div><b>District:</b> {row.district || "-"}</div>
                          <div><b>Product:</b> {row.product || "-"}</div>
                          <div><b>Make:</b> {row.make || "-"}</div>
                          <div><b>Rating:</b> {row.rating || "-"}</div>
                          <div><b>Quantity:</b> {row.qty || "-"}</div>
                          <div><b>Insurance:</b> {row.insurance_type || "-"}</div>
                          <div><b>Technician:</b> {row.technician_name || "-"}</div>
                          <div><b>Tech Contact:</b> {row.technician_contact || "-"}</div>
                          <div><b>WhatsApp:</b> {row.assignee_whatsapp_number || "-"}</div>
                          <div><b>Reporter:</b> {row.reporter_name || "-"}</div>
                          <div><b>Challan No:</b> {row.challan_no || "-"}</div>
                          <div><b>Challan Date:</b> {formatDateDisplay(row.challan_date)}</div>
                          <div><b>Resolved Date:</b> {formatDateDisplay(row.resolved_date)}</div>
                          <div><b>Controller RID:</b> {row.controller_rid_no || "-"}</div>
                          <div><b>Product SL:</b> {row.product_sl_no || "-"}</div>
                          <div><b>Assign to Vendor:</b> {row.assign_to_vendor ? "Yes" : "No"}</div>
                        </div>

                        <div className="text-xs text-gray-800 pt-1 border-t border-gray-100">
                          <b>Complaint:</b> {row.nature_of_complaint || "-"}
                        </div>

                        {row.document_url && (
                          <div className="pt-1">
                            <a
                              href={row.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                            >
                              📄 View Uploaded Document ↗
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Pagination Bar */}
                  {renderPagination("bottom")}
                </>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-500 text-sm">No complaints match your filters or search criteria.</p>
                  {(globalSearch || filterReporterName || filterCompanyName || filterTechnicianName || filterBeneficiaryName) && (
                    <button
                      onClick={() => {
                        setGlobalSearch("")
                        setFilterReporterName("")
                        setFilterCompanyName("")
                        setFilterTechnicianName("")
                        setFilterBeneficiaryName("")
                      }}
                      className="mt-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3.5 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div >
    </div >
  )
}

export default NewComplaintForm
