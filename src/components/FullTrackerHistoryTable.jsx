"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Calendar, X } from "react-feather";
import supabase from "../utils/supabase";
import SearchableSelect from "./SearchableSelect";

function FullTrackerHistoryTable() {
    const [complaints, setComplaints] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [userRole, setUserRole] = useState(null)

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

    // Data fetching
    useEffect(() => {
        // const fetchComplaints = async () => {
        //     setIsLoading(true)
        //     setError(null)

        //     try {
        //         const trackerUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=Tracker"
        //         const fmsUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS"

        //         const [trackerRes, fmsRes] = await Promise.all([
        //             fetch(trackerUrl),
        //             fetch(fmsUrl)
        //         ])

        //         const trackerText = await trackerRes.text()
        //         const fmsText = await fmsRes.text()

        //         const extractJson = (text) => {
        //             const jsonStart = text.indexOf('{')
        //             const jsonEnd = text.lastIndexOf('}') + 1
        //             return JSON.parse(text.substring(jsonStart, jsonEnd))
        //         }

        //         const trackerData = extractJson(trackerText)
        //         const fmsData = extractJson(fmsText)

        //         // Map FMS data for ID Number lookup (Complaint ID -> ID Number)
        //         const fmsIdMap = {}
        //         if (fmsData && fmsData.table && fmsData.table.rows) {
        //             fmsData.table.rows.forEach(row => {
        //                 // In FMS: Column B (1) is Complaint ID, Column E (4) is ID Number
        //                 if (row.c && row.c[1]?.v && row.c[4]?.v) {
        //                     fmsIdMap[row.c[1].v] = row.c[4].v
        //                 }
        //             })
        //         }

        //         if (trackerData && trackerData.table && trackerData.table.rows) {
        //             const complaintData = []

        //             trackerData.table.rows.forEach((row, index) => {
        //                 if (row.c && row.c[2]?.v) {
        //                     // Skip header row if it contains "Complaint ID" or "Timestamp"
        //                     const firstCell = row.c[0]?.v || "";
        //                     const thirdCell = row.c[2]?.v || "";
        //                     if (firstCell === "Timestamp" || thirdCell === "Complaint ID" || thirdCell === "Task ID") {
        //                         return;
        //                     }

        //                     // Skip the first data row (usually a default/sample row)
        //                     if (index === 1) return;

        //                     const complaintId = row.c[2]?.v || ""

        //                     const complaint = {
        //                         serialNo: row.c[1]?.v || "", // Column B (1) - Serial No
        //                         complaintId: complaintId, // Column C (2) - Complaint ID
        //                         idNumber: fmsIdMap[complaintId] || "-", // Joined from FMS
        //                         technicianName: row.c[3]?.v || "", // Column D (3) - Technician Name
        //                         technicianNumber: row.c[4]?.v || "", // Column E (4) - Technician Number
        //                         beneficiaryName: row.c[5]?.v || "", // Column F (5) - Beneficiary Name
        //                         contactNumber: row.c[6]?.v || "", // Column G (6) - Contact Number
        //                         village: row.c[7]?.v || "", // Column H (7) - Village
        //                         block: row.c[8]?.v || "", // Column I (8) - Block
        //                         district: row.c[9]?.v || "", // Column J (9) - District
        //                         product: row.c[10]?.v || "", // Column K (10) - Product
        //                         make: row.c[11]?.v || "", // Column L (11) - Make
        //                         natureOfComplaint: row.c[13]?.v || "", // Column N (13) - Nature of Complaint
        //                         actionTracker: row.c[16]?.v || "", // Column Q (16) - Action Tracker (Remarks)
        //                         status: row.c[17]?.v || "Open", // Column R (17) - Tracker Status
        //                         // Required for existing logic
        //                         timestamp: row.c[0]?.v || "",
        //                         complaintDate: row.c[0] ? (row.c[0].f || formatDateString(row.c[0].v) || row.c[0].v) : "",
        //                         complaintNumber: complaintId
        //                     };

        //                     if (complaint.complaintId) {
        //                         complaintData.push(complaint)
        //                     }
        //                 }
        //             })
        //             setComplaints(complaintData)
        //         }
        //     } catch (err) {
        //         console.error("Error fetching history data:", err)
        //         setError(err.message)
        //         setComplaints([])
        //     } finally {
        //         setIsLoading(false)
        //     }
        // }

        const fetchComplaints = async () => {
    setIsLoading(true)
    setError(null)

    try {
        console.log("[DEBUG] Fetching Tracker + FMS from Supabase...")

        // 🔥 1. Fetch both tables from Supabase
        const [trackerRes, fmsRes] = await Promise.all([
            supabase.from("Tracker").select("*"),
            supabase.from("FMS").select("complaint_id, id_number")
        ])

        if (trackerRes.error) throw trackerRes.error
        if (fmsRes.error) throw fmsRes.error

        const trackerData = trackerRes.data
        const fmsData = fmsRes.data

        // 🔥 2. Create FMS Map (same logic as before)
        const fmsIdMap = {}
        fmsData.forEach(row => {
            if (row.complaint_id && row.id_number) {
                fmsIdMap[row.complaint_id] = row.id_number
            }
        })

        // 🔥 3. Process Tracker data (NO LOGIC CHANGE)
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

        const matchesStatus = statusFilter === "All" || complaint.status === statusFilter;
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


    if (isLoading) {
        return (
            <div className="p-8 flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <div className="text-gray-500 font-medium">Loading history data...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 flex justify-center items-center h-64">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    Error loading data: {error}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Tracker History</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Viewing all {filteredComplaints.length} complaint records (Historical Data)
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative group flex-1 sm:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="search"
                                    placeholder="Global search..."
                                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                        </div>
                    </div>
                </div>

                {/* Advanced Filters Section */}
                <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-700 font-semibold">
                            <Filter className="h-4 w-4 text-blue-500" />
                            <h3>Advanced Filters</h3>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-medium hover:underline"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear All Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Complaint Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={filterInputs.complaintDate}
                                    onChange={(e) => setFilterInputs({ ...filterInputs, complaintDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">District</label>
                            <SearchableSelect
                                placeholder="All Districts"
                                allOptionLabel="All Districts"
                                options={uniqueValues.districts}
                                value={filterInputs.district}
                                onChange={(val) => setFilterInputs({ ...filterInputs, district: val })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Block</label>
                            <SearchableSelect
                                placeholder="All Blocks"
                                allOptionLabel="All Blocks"
                                options={uniqueValues.blocks}
                                value={filterInputs.block}
                                onChange={(val) => setFilterInputs({ ...filterInputs, block: val, village: "" })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Village</label>
                            <SearchableSelect
                                placeholder="Search Village..."
                                allOptionLabel="All Villages"
                                options={availableVillages}
                                value={filterInputs.village}
                                onChange={(val) => setFilterInputs({ ...filterInputs, village: val })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID Number</label>
                            <SearchableSelect
                                placeholder="Search ID..."
                                allOptionLabel="All ID Numbers"
                                options={uniqueValues.idNumbers}
                                value={filterInputs.idNumber}
                                onChange={(val) => setFilterInputs({ ...filterInputs, idNumber: val })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Beneficiary</label>
                            <SearchableSelect
                                placeholder="Search Name..."
                                allOptionLabel="All Beneficiaries"
                                options={uniqueValues.beneficiaries}
                                value={filterInputs.beneficiaryName}
                                onChange={(val) => setFilterInputs({ ...filterInputs, beneficiaryName: val })}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {filteredComplaints.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50/30">
                            <div className="bg-white inline-block p-4 rounded-full shadow-sm mb-4">
                                <Search className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No historical records found matching your criteria</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block max-h-[700px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Serial No</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Complaint ID</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">ID Number</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Technician Name</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Technician Number</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Beneficiary Name</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Contact Number</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Village</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Block</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">District</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Product</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">Make</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest min-w-[200px]">Nature of Complaint</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest min-w-[250px]">Action Tracker</th>
                                            <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap text-center">Tracker Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredComplaints.map((complaint, index) => (
                                            <tr key={`history-${complaint.complaintId}-${index}`} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.serialNo}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">#{complaint.complaintId}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{complaint.idNumber}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{complaint.technicianName || "-"}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{complaint.technicianNumber || "-"}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{complaint.beneficiaryName}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{complaint.contactNumber}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.village}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.block}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.district}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.product}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.make}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600 min-w-[200px]">{complaint.natureOfComplaint}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600 min-w-[250px]">{complaint.actionTracker || "-"}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${complaint.status === "close_task"
                                                        ? "bg-green-100 text-green-700 border-green-200 shadow-sm"
                                                        : "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                                                        }`}>
                                                        {complaint.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>


                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {filteredComplaints.map((complaint, index) => (
                                    <div key={`m-history-${complaint.complaintId}-${index}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm active:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Complaint ID</div>
                                                <div className="text-sm font-black text-blue-600 tracking-tight">#{complaint.complaintId}</div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${complaint.status === "APPROVED-CLOSE"
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : "bg-blue-100 text-blue-700 border-blue-200"
                                                }`}>
                                                {complaint.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Serial No.</div>
                                                <div className="text-xs font-semibold text-gray-800">{complaint.serialNo}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Date</div>
                                                <div className="text-xs font-semibold text-gray-800">{complaint.complaintDate}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">ID Number</div>
                                                <div className="text-xs font-semibold text-gray-800">{complaint.idNumber}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Beneficiary</div>
                                                <div className="text-sm font-black text-gray-900 leading-tight">{complaint.beneficiaryName}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Location</div>
                                                <div className="text-xs font-semibold text-gray-800">{complaint.village}, {complaint.block}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Technician</div>
                                                <div className="text-xs font-semibold text-gray-800">{complaint.technicianName || "-"}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="text-center py-4">
                <p className="text-xs text-gray-400 font-medium">
                    © {new Date().getFullYear()} RBP Complaints Tracker • Full Historical Record Access
                </p>
            </div>
        </div>
    )
}

export default FullTrackerHistoryTable
