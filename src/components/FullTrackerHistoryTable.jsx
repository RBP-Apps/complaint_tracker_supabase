"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  SlidersHorizontal,
  Calendar,
  X,
  RotateCcw,
  History,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Filter
} from "lucide-react"
import * as XLSX from "xlsx"
import supabase from "../utils/supabase";
import SearchableSelect from "./SearchableSelect";

function FullTrackerHistoryTable() {
    const [complaints, setComplaints] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [userRole, setUserRole] = useState(null)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: null, phase: "" })
    const [displayLimit, setDisplayLimit] = useState(200)

    // Advanced Filter States
    const [filterInputs, setFilterInputs] = useState({
        complaintDate: "",
        idNumber: "",
        beneficiaryName: "",
        village: "",
        block: "",
        district: ""
    })

    // localStorage useEffect
    useEffect(() => {
        const loggedInRole = localStorage.getItem('userRole')
        if (loggedInRole) {
            setUserRole(loggedInRole)
        }
    }, [])

    /**
     * Helper to fetch all rows from Supabase bypassing PostgREST 1000 row limit
     */
    const fetchAllSupabaseRows = async (tableName, selectCols = "*", onProgress = null) => {
        const CHUNK_SIZE = 1000
        let allRows = []

        // Step 1: Attempt to get exact count for high-speed parallel batches
        let totalCount = null
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select(selectCols, { count: "exact", head: true })

            if (!error && typeof count === "number" && count > 0) {
                totalCount = count
            }
        } catch (countErr) {
            console.warn(`[WARN] Failed to get exact count for ${tableName}:`, countErr)
        }

        // Step 2: High-speed parallel chunk fetching if totalCount is available
        if (totalCount && totalCount > 0) {
            const totalBatches = Math.ceil(totalCount / CHUNK_SIZE)
            const CONCURRENCY = 6 // 6 parallel requests (6,000 rows per round)

            for (let i = 0; i < totalBatches; i += CONCURRENCY) {
                const batchPromises = []
                for (let j = i; j < Math.min(i + CONCURRENCY, totalBatches); j++) {
                    const from = j * CHUNK_SIZE
                    const to = from + CHUNK_SIZE - 1
                    batchPromises.push(
                        supabase.from(tableName).select(selectCols).range(from, to)
                    )
                }

                const results = await Promise.all(batchPromises)
                for (const res of results) {
                    if (res.error) throw res.error
                    if (res.data) allRows.push(...res.data)
                }

                if (onProgress) {
                    onProgress(allRows.length, totalCount)
                }
            }
            return allRows
        }

        // Step 3: Iterative range fallback if exact count is not supported
        let from = 0
        while (true) {
            const { data, error } = await supabase
                .from(tableName)
                .select(selectCols)
                .range(from, from + CHUNK_SIZE - 1)

            if (error) throw error
            if (!data || data.length === 0) break

            allRows.push(...data)
            if (onProgress) {
                onProgress(allRows.length, null)
            }

            if (data.length < CHUNK_SIZE) break
            from += CHUNK_SIZE
        }

        return allRows
    }

    // Data fetching
    useEffect(() => {
        const fetchComplaints = async () => {
            setIsLoading(true)
            setError(null)
            setLoadingProgress({ loaded: 0, total: null, phase: "Connecting..." })

            try {
                console.log("[DEBUG] Fetching ALL Tracker + FMS rows from Supabase...")

                // 🔥 1. Fetch all rows from both tables in parallel (bypassing 1000 limit)
                const [trackerData, fmsData] = await Promise.all([
                    fetchAllSupabaseRows("Tracker", "*", (loaded, total) => {
                        setLoadingProgress({ loaded, total, phase: "Loading Tracker..." })
                    }),
                    fetchAllSupabaseRows("FMS", "complaint_id, id_number")
                ])

                console.log(`[DEBUG] Fetched ${trackerData.length} Tracker records & ${fmsData.length} FMS records.`)

                // 🔥 2. Create FMS Map
                const fmsIdMap = {}
                fmsData.forEach(row => {
                    if (row.complaint_id && row.id_number) {
                        fmsIdMap[row.complaint_id] = row.id_number
                    }
                })

                // 🔥 3. Process Tracker data
                const complaintData = []

                trackerData.forEach((row, index) => {
                    if (!row.complaint_id) return

                    const complaintId = row.complaint_id

                    const complaint = {
                        serialNo: row.serial_no || "",
                        complaintId: complaintId,
                        idNumber: fmsIdMap[complaintId] || "-",
                        technicianName: row.technician_name || "",
                        technicianNumber: row.technician_number || "",
                        beneficiaryName: row.beneficiary_name || "",
                        contactNumber: row.contact_number || "",
                        village: row.village || "",
                        block: row.block || "",
                        district: row.district || "",
                        product: row.product || "",
                        make: row.make || "",
                        natureOfComplaint: row.nature_of_complaint || "",
                        actionTracker: row.action_taken || "",
                        status: row.tracker_status || "Open",

                        // SAME fields
                        timestamp: row.timestamp || "",
                        complaintDate: row.timestamp
                            ? new Date(row.timestamp).toLocaleDateString("en-GB")
                            : "",
                        complaintNumber: complaintId
                    }

                    complaintData.push(complaint)
                })

                setComplaints(complaintData)

            } catch (err) {
                console.error("Error fetching history data:", err)
                setError(err.message)
                setComplaints([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchComplaints()
    }, [])

    const formatDateString = (dateValue) => {
        if (!dateValue) return "";
        let date;
        if (typeof dateValue === 'number' && dateValue > 40000) {
            const googleEpoch = new Date(1899, 11, 30);
            date = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
        }
        else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
            const match = dateValue.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
            if (match) {
                const year = parseInt(match[1]);
                const month = parseInt(match[2]);
                const day = parseInt(match[3]);
                date = new Date(year, month, day);
            } else { return dateValue; }
        }
        else if (typeof dateValue === 'object' && dateValue.getDate) { date = dateValue; }
        else { return dateValue; }

        if (isNaN(date.getTime())) return dateValue;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDateFromDDMMYYYY = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    };

    const clearFilters = () => {
        setFilterInputs({
            complaintDate: "",
            idNumber: "",
            beneficiaryName: "",
            village: "",
            block: "",
            district: ""
        })
        setSearchTerm("")
        setStatusFilter("All")
    }

    // Active filters counter
    const activeFiltersCount = useMemo(() => {
        let count = 0
        if (filterInputs.complaintDate) count++
        if (filterInputs.district) count++
        if (filterInputs.block) count++
        if (filterInputs.village) count++
        if (filterInputs.idNumber) count++
        if (filterInputs.beneficiaryName) count++
        return count
    }, [filterInputs])

    // Status options for dropdown
    const statusOptions = useMemo(() => {
        const uniqueStatuses = [...new Set(complaints.map(c => c.status).filter(Boolean))].sort()
        return uniqueStatuses.map(s => ({ label: s, value: s }))
    }, [complaints])

    // Status badge helper
    const renderTrackerStatusBadge = (status) => {
        const s = String(status || "").toUpperCase()
        if (s === "CLOSE_TASK" || s === "APPROVED-CLOSE" || s === "COMPLETED") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
                    {status}
                </span>
            )
        }
        if (s === "OPEN" || s === "OK-OPEN") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
                    {status}
                </span>
            )
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap">
                {status || "Open"}
            </span>
        )
    }

    // Export to Excel function
    const handleExportToExcel = () => {
        if (!filteredComplaints || filteredComplaints.length === 0) {
            alert("No data available to export.")
            return
        }

        try {
            setIsExporting(true)
            const exportData = filteredComplaints.map((c, index) => ({
                "S.No": index + 1,
                "Serial No": c.serialNo || "-",
                "Complaint ID": c.complaintId || "-",
                "ID Number": c.idNumber || "-",
                "Date": c.complaintDate || "-",
                "Technician Name": c.technicianName || "-",
                "Technician Contact": c.technicianNumber || "-",
                "Beneficiary Name": c.beneficiaryName || "-",
                "Contact Number": c.contactNumber || "-",
                "Village": c.village || "-",
                "Block": c.block || "-",
                "District": c.district || "-",
                "Product": c.product || "-",
                "Make": c.make || "-",
                "Nature of Complaint": c.natureOfComplaint || "-",
                "Action Tracker": c.actionTracker || "-",
                "Tracker Status": c.status || "-"
            }))

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker_History")
            const dateStr = new Date().toISOString().split("T")[0]
            XLSX.writeFile(workbook, `Tracker_History_${dateStr}.xlsx`)
        } catch (err) {
            console.error("Export error:", err)
            alert("Failed to export Excel file.")
        } finally {
            setIsExporting(false)
        }
    }

    // Memoized unique values for dropdowns
    const uniqueValues = useMemo(() => {
        const getUnique = (key) => [...new Set(complaints.map(c => c[key]).filter(Boolean))].sort();
        return {
            idNumbers: getUnique('idNumber'),
            beneficiaries: getUnique('beneficiaryName'),
            districts: getUnique('district'),
            blocks: getUnique('block'),
            allVillages: getUnique('village')
        };
    }, [complaints]);

    const availableVillages = useMemo(() => {
        if (!filterInputs.block) return uniqueValues.allVillages;
        return [...new Set(complaints
            .filter(c => c.block === filterInputs.block)
            .map(c => c.village)
            .filter(Boolean)
        )].sort();
    }, [complaints, filterInputs.block, uniqueValues.allVillages]);

    const filteredComplaints = complaints.filter((complaint) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            String(complaint.beneficiaryName || "").toLowerCase().includes(search) ||
            String(complaint.complaintId || "").toLowerCase().includes(search) ||
            String(complaint.village || "").toLowerCase().includes(search) ||
            String(complaint.district || "").toLowerCase().includes(search) ||
            String(complaint.projectName || "").toLowerCase().includes(search) ||
            String(complaint.natureOfComplaint || "").toLowerCase().includes(search) ||
            String(complaint.technicianName || "").toLowerCase().includes(search) ||
            String(complaint.serialNo || "").toLowerCase().includes(search);

        const matchesStatus = !statusFilter || statusFilter === "All" || complaint.status === statusFilter;
        const matchesId = !filterInputs.idNumber || String(complaint.idNumber).toLowerCase().includes(filterInputs.idNumber.toLowerCase());
        const matchesBeneficiary = !filterInputs.beneficiaryName || String(complaint.beneficiaryName).toLowerCase().includes(filterInputs.beneficiaryName.toLowerCase());
        const matchesBlock = !filterInputs.block || complaint.block === filterInputs.block;
        const matchesDistrict = !filterInputs.district || complaint.district === filterInputs.district;
        const matchesVillage = !filterInputs.village || String(complaint.village).toLowerCase().includes(filterInputs.village.toLowerCase());

        let matchesDate = true;
        if (filterInputs.complaintDate) {
            const complaintDateObj = parseDateFromDDMMYYYY(complaint.complaintDate);
            if (complaintDateObj) {
                complaintDateObj.setHours(0, 0, 0, 0);
                const filterDateObj = new Date(filterInputs.complaintDate);
                filterDateObj.setHours(0, 0, 0, 0);
                if (complaintDateObj.getTime() !== filterDateObj.getTime()) matchesDate = false;
            } else { matchesDate = false; }
        }

        return matchesSearch && matchesStatus && matchesId && matchesBeneficiary && matchesBlock && matchesDistrict && matchesVillage && matchesDate;
    });

    // Reset display limit when filter or search changes
    useEffect(() => {
        setDisplayLimit(200);
    }, [searchTerm, filterInputs, statusFilter]);

    // Progressive rendering slice to keep UI smooth with huge datasets (e.g. 1 lakh rows)
    const displayedComplaints = useMemo(() => {
        return filteredComplaints.slice(0, displayLimit);
    }, [filteredComplaints, displayLimit]);

    // Infinite scroll handler for table
    const handleTableScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 250) {
            if (displayLimit < filteredComplaints.length) {
                setDisplayLimit((prev) => Math.min(prev + 200, filteredComplaints.length));
            }
        }
    };

    if (isLoading) {
        return (
            <div className="p-12 flex justify-center items-center min-h-[350px] bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-sm font-semibold text-slate-700">Loading Tracker History...</div>
                    <div className="text-xs text-slate-500 font-medium">
                        {loadingProgress.total
                            ? `Fetched ${loadingProgress.loaded.toLocaleString()} of ${loadingProgress.total.toLocaleString()} records from Supabase...`
                            : loadingProgress.loaded > 0
                                ? `Fetched ${loadingProgress.loaded.toLocaleString()} records from Supabase...`
                                : "Connecting to Supabase and fetching all records..."}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 flex justify-center items-center min-h-[300px] bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="bg-rose-50 text-rose-700 p-5 rounded-xl border border-rose-200 text-center max-w-md">
                    <p className="font-bold text-sm">Failed to Load Tracker History</p>
                    <p className="text-xs mt-1 text-rose-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Main Card Container */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                
                {/* Top Banner / Controls */}
                <div className="p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/50">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Title & Stats */}
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Tracker History</h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        {filteredComplaints.length.toLocaleString()} {filteredComplaints.length === 1 ? "Record" : "Records"}
                                    </span>
                                    {userRole && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                                            {userRole}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                    Historical logs and resolved complaint action tracking ({complaints.length.toLocaleString()} total in database)
                                </p>
                            </div>
                        </div>

                        {/* Actions & Filters */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                            {/* Global Search */}
                            <div className="relative group flex-1 sm:w-60 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                <input
                                    type="search"
                                    placeholder="Global search..."
                                    className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                        title="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Dropdown */}
                            <div className="w-40 sm:w-44">
                                <SearchableSelect
                                    placeholder="All Status"
                                    allOptionLabel="All Status"
                                    options={statusOptions}
                                    value={statusFilter === "All" ? "" : statusFilter}
                                    onChange={(val) => setStatusFilter(val || "All")}
                                />
                            </div>

                            {/* Advanced Filters Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    showAdvancedFilters || activeFiltersCount > 0
                                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                                {showAdvancedFilters ? (
                                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                            </button>

                            {/* Export Excel Button */}
                            <button
                                type="button"
                                onClick={handleExportToExcel}
                                disabled={isExporting || filteredComplaints.length === 0}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Export records to Excel"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>{isExporting ? "Exporting..." : "Export"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="p-5 md:p-6 bg-slate-50/70 border-b border-slate-200/80 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                <Filter className="h-4 w-4 text-blue-600" />
                                <span>Advanced Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="text-xs font-normal text-slate-500">
                                        ({activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} applied)
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-semibold hover:underline cursor-pointer"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                            {/* Complaint Date */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Complaint Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                        value={filterInputs.complaintDate}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, complaintDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* District */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">District</label>
                                <SearchableSelect
                                    placeholder="All Districts"
                                    allOptionLabel="All Districts"
                                    options={uniqueValues.districts}
                                    value={filterInputs.district}
                                    onChange={(val) => setFilterInputs({ ...filterInputs, district: val })}
                                />
                            </div>

                            {/* Block */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Block</label>
                                <SearchableSelect
                                    placeholder="All Blocks"
                                    allOptionLabel="All Blocks"
                                    options={uniqueValues.blocks}
                                    value={filterInputs.block}
                                    onChange={(val) => setFilterInputs({ ...filterInputs, block: val, village: "" })}
                                />
                            </div>

                            {/* Village */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Village</label>
                                <SearchableSelect
                                    placeholder="All Villages"
                                    allOptionLabel="All Villages"
                                    options={availableVillages}
                                    value={filterInputs.village}
                                    onChange={(val) => setFilterInputs({ ...filterInputs, village: val })}
                                />
                            </div>

                            {/* ID Number */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID Number</label>
                                <SearchableSelect
                                    placeholder="All IDs"
                                    allOptionLabel="All ID Numbers"
                                    options={uniqueValues.idNumbers}
                                    value={filterInputs.idNumber}
                                    onChange={(val) => setFilterInputs({ ...filterInputs, idNumber: val })}
                                />
                            </div>

                            {/* Beneficiary Name */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Beneficiary</label>
                                <SearchableSelect
                                    placeholder="All Beneficiaries"
                                    allOptionLabel="All Beneficiaries"
                                    options={uniqueValues.beneficiaries}
                                    value={filterInputs.beneficiaryName}
                                    onChange={(val) => setFilterInputs({ ...filterInputs, beneficiaryName: val })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Table / Cards Area */}
                <div className="w-full">
                    {filteredComplaints.length === 0 ? (
                        <div className="text-center py-20 px-4 bg-slate-50/40">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-slate-400">
                                <Search className="h-7 w-7" />
                            </div>
                            <h4 className="text-base font-bold text-slate-800">No historical records found</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                We couldn't find any complaints matching your active search terms or filter criteria.
                            </p>
                            {(searchTerm || activeFiltersCount > 0 || (statusFilter && statusFilter !== "All")) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Reset All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div
                                onScroll={handleTableScroll}
                                className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-200"
                            >
                                <table className="min-w-full divide-y divide-slate-200 text-left">
                                    <thead className="bg-slate-50/95 backdrop-blur-xs sticky top-0 z-10 shadow-2xs border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap text-center">S.No</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Complaint ID</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Date</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">ID Number</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Contact Number</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Village</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Block</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">District</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Product</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Make</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Nature of Complaint</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Action Tracker</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Technician Name</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Technician Number</th>
                                            <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap text-center">Tracker Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {displayedComplaints.map((complaint, index) => (
                                            <tr
                                                key={`history-${complaint.complaintId}-${index}`}
                                                className="hover:bg-blue-50/40 transition-colors group"
                                            >
                                                <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-medium text-center">
                                                    {complaint.serialNo || index + 1}
                                                </td>
                                                <td className="px-4 py-3.5 text-sm font-bold text-blue-600 whitespace-nowrap">
                                                    #{complaint.complaintId}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap font-medium">
                                                    {complaint.complaintDate || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-nowrap font-semibold">
                                                    {complaint.idNumber || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-slate-900 font-bold whitespace-normal break-words min-w-[160px] max-w-[220px]">
                                                    {complaint.beneficiaryName || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap font-medium">
                                                    {complaint.contactNumber || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[110px] max-w-[150px]">
                                                    {complaint.village || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[100px] max-w-[140px]">
                                                    {complaint.block || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[100px] max-w-[140px]">
                                                    {complaint.district || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[110px] max-w-[150px]">
                                                    {complaint.product || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[100px] max-w-[140px]">
                                                    {complaint.make || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[220px] max-w-[320px] leading-relaxed">
                                                    {complaint.natureOfComplaint || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[240px] max-w-[360px] leading-relaxed">
                                                    {complaint.actionTracker || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-normal break-words min-w-[130px] max-w-[180px] font-medium">
                                                    {complaint.technicianName || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap font-medium">
                                                    {complaint.technicianNumber || "-"}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                                    {renderTrackerStatusBadge(complaint.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Progressive Loading Control Bar */}
                            {displayLimit < filteredComplaints.length && (
                                <div className="hidden md:flex p-3 bg-slate-50/90 border-t border-slate-200 flex-wrap items-center justify-between gap-2 px-4">
                                    <div className="text-xs text-slate-600 font-medium">
                                        Showing <span className="font-bold text-slate-900">{displayedComplaints.length.toLocaleString()}</span> of{" "}
                                        <span className="font-bold text-slate-900">{filteredComplaints.length.toLocaleString()}</span> records
                                        <span className="text-slate-400 ml-1.5">(Scroll down table to auto-load more)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDisplayLimit((prev) => Math.min(prev + 500, filteredComplaints.length))}
                                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                                        >
                                            +500 More
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDisplayLimit(filteredComplaints.length)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                                        >
                                            Show All ({filteredComplaints.length.toLocaleString()})
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                                {displayedComplaints.map((complaint, index) => (
                                    <div
                                        key={`m-history-${complaint.complaintId}-${index}`}
                                        className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                    Complaint ID
                                                </span>
                                                <span className="text-sm font-bold text-blue-600">
                                                    #{complaint.complaintId}
                                                </span>
                                            </div>
                                            <div>{renderTrackerStatusBadge(complaint.status)}</div>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Beneficiary Name
                                            </span>
                                            <p className="text-sm font-bold text-slate-900 whitespace-normal break-words">
                                                {complaint.beneficiaryName || "-"}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
                                                <span className="font-semibold text-slate-700">{complaint.complaintDate || "-"}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID Number</span>
                                                <span className="font-semibold text-slate-700">{complaint.idNumber || "-"}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
                                                <span className="font-semibold text-slate-700 whitespace-normal break-words">
                                                    {[complaint.village, complaint.block, complaint.district].filter(Boolean).join(", ") || "-"}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technician</span>
                                                <span className="font-semibold text-slate-700 whitespace-normal break-words">
                                                    {complaint.technicianName || "-"}
                                                </span>
                                            </div>
                                        </div>

                                        {complaint.natureOfComplaint && (
                                            <div className="text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                                    Nature of Complaint
                                                </span>
                                                <p className="text-slate-700 whitespace-normal break-words leading-relaxed">
                                                    {complaint.natureOfComplaint}
                                                </p>
                                            </div>
                                        )}

                                        {complaint.actionTracker && (
                                            <div className="text-xs bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/60">
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-0.5">
                                                    Action Tracker
                                                </span>
                                                <p className="text-slate-700 whitespace-normal break-words leading-relaxed">
                                                    {complaint.actionTracker}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {displayLimit < filteredComplaints.length && (
                                    <div className="pt-3 flex flex-col gap-2 text-center">
                                        <span className="text-xs text-slate-500">
                                            Showing {displayedComplaints.length.toLocaleString()} of {filteredComplaints.length.toLocaleString()} records
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setDisplayLimit((prev) => Math.min(prev + 200, filteredComplaints.length))}
                                            className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs cursor-pointer"
                                        >
                                            Load More (+200)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDisplayLimit(filteredComplaints.length)}
                                            className="w-full py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-2xs cursor-pointer"
                                        >
                                            Show All ({filteredComplaints.length.toLocaleString()})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                    <div>
                        Showing <span className="font-semibold text-slate-700">{displayedComplaints.length.toLocaleString()}</span> of{" "}
                        <span className="font-semibold text-slate-700">{filteredComplaints.length.toLocaleString()}</span> historical records
                        {complaints.length !== filteredComplaints.length && (
                            <span className="text-slate-400 ml-1">
                                (filtered from {complaints.length.toLocaleString()} total)
                            </span>
                        )}
                    </div>
                    <div className="text-slate-400">
                        © {new Date().getFullYear()} RBP Complaints Tracker
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FullTrackerHistoryTable
