// DraftLetter.jsx
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Calendar, Upload, MapPin, Loader, Edit, Check, X, FileText, Mail, Trash2, Plus, Paperclip } from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DashboardLayout from "../components/DashboardLayout"
import supabase from "../utils/supabase"
import SearchableSelect from "../components/SearchableSelect"

function DraftLetter() {
    const navigate = useNavigate()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState("pending")
    const [pendingTasks, setPendingTasks] = useState([])
    const [historyTasks, setHistoryTasks] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [selectedTaskData, setSelectedTaskData] = useState(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [email, setEmail] = useState("")
    const [selectedCompany, setSelectedCompany] = useState("")
    const [companyOptions, setCompanyOptions] = useState([])
    const [filterDistrict, setFilterDistrict] = useState("")
    const [filterBlock, setFilterBlock] = useState("")
    const [filterTechnician, setFilterTechnician] = useState("")
    const [selectedHistoryIds, setSelectedHistoryIds] = useState(new Set())
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [emailModalOpen, setEmailModalOpen] = useState(false)
    const [emailModalRow, setEmailModalRow] = useState(null)
    const [emailRecipients, setEmailRecipients] = useState([])
    const [emailSubject, setEmailSubject] = useState("")
    const [emailBody, setEmailBody] = useState("")
    const [emailAttachments, setEmailAttachments] = useState([])


    // Helper to ensure Google Drive links open in viewer instead of downloading
    const getViewerUrl = (url) => {
        if (!url) return "";
        // Convert export=download or uc?id= style links to /file/d/.../view
        if (url.includes("drive.google.com/uc?") || url.includes("drive.google.com/open?")) {
            const match = url.match(/[?&]id=([^&]+)/);
            if (match && match[1]) {
                return `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`;
            }
        }
        return url;
    };

    useEffect(() => {
        // Handle initial tab from state (e.g. when coming from AdminLetter)
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            // Clear state from history so refresh defaults to pending
            window.history.replaceState(null, '');
        }

        

        const fetchTasks = async () => {
    setIsLoading(true)
    setError(null)

    try {
        console.log("[DEBUG] Fetching FMS from Supabase...")

        const { data, error } = await supabase
            .from("FMS")
            .select("*")
            .eq("assign_to_vendor", "false")

        if (error) throw error

        const pendingData = []
        const historyData = []

        data.forEach((row, index) => {

            let statusValue = row.status ? String(row.status).trim() : ""

            if (statusValue === "Completed") {
                statusValue = "APPROVED-CLOSE"
            }

            if (statusValue !== "APPROVED-CLOSE") return

            const planned1 = row.planned1
            const actual1 = row.actual1

            const task = {
                id: row.complaint_id || `FMS-${index}`,
                serialNo: row.id || "",
                complaintId: row.complaint_id,
                idNumber: row.id_number || "-",
                technicianName: row.technician_name || "",
                technicianContact: row.technician_contact || "",
                beneficiaryName: row.beneficiary_name || "",
                contactNumber: row.contact_number || "",
                village: row.village || "",
                block: row.block || "",
                district: row.district || "",
                product: row.product || "",
                make: row.make || "",
                natureOfComplaint: row.nature_of_complaint || "",
                complaintDate: row.complaint_date || "",
                status: statusValue,
                trackerStatus: statusValue,
                columnV: planned1,
                actualDate: actual1,
                companyName: row.company || "",
                email: row.email || "",
                pdfUrl: row.pdf || "",
                columnAN: false,
                checked: statusValue,
                remark: "",
                rowIndex: index + 1,
            }

            const hasPlanned1 = planned1 !== null && planned1 !== ""
            const hasActual1 = actual1 !== null && actual1 !== ""

            if (hasPlanned1 && !hasActual1) {
                pendingData.push(task)
            }
            else if (hasPlanned1 && hasActual1) {
                historyData.push(task)
            }
            else if (statusValue === "APPROVED-CLOSE") {
                pendingData.push(task)
            }
        })

        const uniquePending = pendingData.filter((task, index, self) =>
            index === self.findIndex(t => t.complaintId === task.complaintId)
        )

        const uniqueHistory = historyData.filter((task, index, self) =>
            index === self.findIndex(t => t.complaintId === task.complaintId)
        )

        setPendingTasks(uniquePending)
        setHistoryTasks(uniqueHistory)

    } catch (err) {
        console.error("Failed fetching tasks:", err)
        setError(err.message)
        setPendingTasks([])
        setHistoryTasks([])
    } finally {
        setIsLoading(false)
    }
}



        fetchTasks()
        fetchCompanyOptions()
    }, [])



    const fetchCompanyOptions = async () => {
    try {
        console.log("[DEBUG] Fetching Master from Supabase...")

        const { data, error } = await supabase
            .from("Master")
            .select("*")

        if (error) throw error

        const options = data.map(row => ({
            name: row.company_name1 || "",
            address: row.address || "",
            email: row.email_id || "",
            phone: row.phone_no || ""
        }))

        console.log("[DEBUG] Company options:", options)

        setCompanyOptions(options)

    } catch (err) {
        console.error("Failed fetching Master:", err)
    }
}




    const handleUpdateTask = async () => {
        if (!selectedCompany) {
            alert("Please select a company.")
            return
        }

        setIsSubmitting(true)

        try {
            const currentTasks = [...pendingTasks]
            const taskIndex = currentTasks.findIndex(t => t.id === selectedTask)
            if (taskIndex === -1 && activeTab === 'pending') throw new Error("Task not found")
            const task = activeTab === 'pending' ? { ...currentTasks[taskIndex] } : selectedTaskData

            const companyDetails = companyOptions.find(c => c.name === selectedCompany) || {}

            // Update Supabase FMS table with selected company
            const { error: updateError } = await supabase
                .from("FMS")
                .update({ company: selectedCompany, email: companyDetails.email || "" })
                .eq("complaint_id", task.complaintId)

            if (updateError) {
                console.warn("FMS update failed (non-critical):", updateError.message)
            }

            setIsDialogOpen(false)
            resetDialogState()

            // Navigate to AdminLetter page for letter generation
            navigate(`/dashboard/admin-letter/${task.complaintId}`, {
                state: {
                    tasks: [task],
                    itemType: "Battery",
                    autoSelectCompany: selectedCompany
                }
            })

        } catch (err) {
            console.error("DraftLetter: Error updating task:", err)
            alert("Failed to process: " + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetDialogState = () => {
        setSelectedTask(null)
        setSelectedTaskData(null)
        setEmail("")
        setSelectedCompany("")
    }

    // --- History tab checkbox & send-email helpers ---
    const toggleHistorySelection = (complaintId) => {
        setSelectedHistoryIds(prev => {
            const next = new Set(prev)
            if (next.has(complaintId)) {
                next.delete(complaintId)
            } else {
                next.add(complaintId)
            }
            return next
        })
    }

    // --- Email Modal helpers ---
    const extractFileId = (url) => {
        if (!url) return null
        const match = url.match(/[?&]id=([^&]+)/)
        if (match && match[1]) return match[1]
        const match2 = url.match(/\/d\/([^/]+)/)
        if (match2 && match2[1]) return match2[1]
        return null
    }

    const openEmailModal = (taskData) => {
        const isBulk = Array.isArray(taskData)
        const tasks = isBulk ? taskData : [taskData]

        setEmailModalRow(tasks[0]) // Use first task for context

        const allRecipients = []
        const allAttachments = []

        tasks.forEach(task => {
            const name = task.companyName || task.beneficiaryName || ""
            const taskEmail = task.email || ""
            const fileId = extractFileId(task.pdfUrl)
            // Only auto-add recipients for bulk selection, not single row
            if (isBulk && taskEmail && !allRecipients.some(r => r.email === taskEmail)) {
                allRecipients.push({ name, email: taskEmail, fileId: fileId || "" })
            }

            if (fileId && !allAttachments.some(a => a.fileId === fileId)) {
                allAttachments.push({ fileId, name: `${task.complaintId} - Letter PDF`, url: task.pdfUrl })
            }
        })

        setEmailRecipients(allRecipients)
        setEmailAttachments(allAttachments)
        setEmailSubject("Document Notification")

        if (isBulk && tasks.length > 1) {
            setEmailBody(`Dear {name},\n\nPlease find the following documents ready for your review.\n\nTotal Documents: ${tasks.length}\n\nRegards,\nTeam`)
        } else {
            const first = tasks[0]
            const name = first.companyName || first.beneficiaryName || ""
            setEmailBody(`Dear ${name},\n\nYour document is ready. Please find the details below:\n\nComplaint ID: ${first.complaintId}\nBeneficiary: ${first.beneficiaryName}\nVillage: ${first.village}\nBlock: ${first.block}\nDistrict: ${first.district}\nProduct: ${first.product}\nNature of Complaint: ${first.natureOfComplaint}\n\nRegards,\nTeam`)
        }

        setEmailModalOpen(true)
    }

    const removeAttachment = (index) => {
        setEmailAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const addAttachmentFromHistory = (complaintId) => {
        if (!complaintId) return
        const task = historyTasks.find(t => t.complaintId === complaintId)
        if (!task || !task.pdfUrl) return
        const fileId = extractFileId(task.pdfUrl)
        if (!fileId) return
        if (emailAttachments.some(a => a.fileId === fileId)) return // already added
        setEmailAttachments(prev => [...prev, { fileId, name: `${task.complaintId} - Letter PDF`, url: task.pdfUrl }])
    }

    const addRecipient = (emailValue) => {
        if (!emailValue || !emailValue.trim()) return
        if (emailRecipients.some(r => r.email === emailValue.trim())) return
        setEmailRecipients(prev => [...prev, { name: "", email: emailValue.trim() }])
    }

    const removeRecipient = (index) => {
        setEmailRecipients(prev => prev.filter((_, i) => i !== index))
    }

    const handleSendEmailModal = async () => {
        if (emailRecipients.length === 0) {
            alert("Please select at least one recipient")
            return
        }
        const invalidEmails = emailRecipients.filter(r => !r.email || !r.email.includes("@"))
        if (invalidEmails.length > 0) {
            alert("Some recipients have invalid email addresses. Please fix them.")
            return
        }

        // Email sending requires a backend email service.
        // PDF links are already saved to Supabase. You can share the PDF links directly.
        const recipientList = emailRecipients.map(r => r.email).join(", ")
        alert(`Email service not configured.\n\nRecipients: ${recipientList}\n\nPlease share the PDF links from the History tab directly.`)
        setEmailModalOpen(false)
    }

    const toggleSelectAllHistory = (checked) => {
        if (checked) {
            const allIds = filteredTasks.map(t => t.complaintId)
            setSelectedHistoryIds(new Set(allIds))
        } else {
            setSelectedHistoryIds(new Set())
        }
    }

    const handleSendEmailForSelected = async () => {
        if (selectedHistoryIds.size === 0) {
            alert("Please select at least one recipient")
            return
        }
        // Email sending requires a backend email service.
        // PDF links are already saved to Supabase. You can share the PDF links directly.
        const selectedTasks = historyTasks.filter(t => selectedHistoryIds.has(t.complaintId))
        const summary = selectedTasks.map(t => `${t.complaintId}: ${t.pdfUrl || 'No PDF'}`).join("\n")
        alert(`Email service not configured.\n\nSelected ${selectedTasks.length} record(s):\n${summary}\n\nPlease share the PDF links directly.`)
        setSelectedHistoryIds(new Set())
    }

    const getCurrentTasks = () => {
        return activeTab === "pending" ? pendingTasks : historyTasks
    }

    const filteredTasks = getCurrentTasks().filter((task) => {
        // Dropdown Filters
        if (filterDistrict && task.district !== filterDistrict) return false
        if (filterBlock && task.block !== filterBlock) return false
        if (filterTechnician && task.technicianName !== filterTechnician) return false

        // Search Filter
        if (!searchTerm || searchTerm.trim() === "") return true

        const searchFields = [
            task.complaintId,
            task.idNumber,
            task.technicianName,
            task.technicianContact,
            task.beneficiaryName,
            task.contactNumber,
            task.village,
            task.block,
            task.district,
            task.product,
            task.make,
            task.natureOfComplaint,
            task.trackerStatus,
            task.checked,
            task.remark
        ]

        const normalizeText = (text) => {
            if (!text) return ""
            return text.toString().toLowerCase().trim()
        }

        const normalizedSearchTerm = normalizeText(searchTerm)
        const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0)

        return searchWords.every(word =>
            searchFields.some(field =>
                normalizeText(field).includes(word)
            )
        )
    })

    // Export to Excel
    const handleExportExcel = () => {
        if (!filteredTasks || filteredTasks.length === 0) {
            alert("No records to export.")
            return
        }

        const exportData = filteredTasks.map((task, index) => {
            const baseData = {
                "S.No": index + 1,
                "Complaint ID": task.complaintId || "-",
                "ID Number": task.idNumber || "-",
                "Technician Name": task.technicianName || "-",
                "Technician Contact": task.technicianContact || "-",
                "Beneficiary Name": task.beneficiaryName || "-",
                "Contact Number": task.contactNumber || "-",
                "Village": task.village || "-",
                "Block": task.block || "-",
                "District": task.district || "-",
                "Product": task.product || "-",
                "Make": task.make || "-",
                "Nature of Complaint": task.natureOfComplaint || "-",
                "Status": task.trackerStatus || task.status || "-",
            }

            if (activeTab === "history") {
                return {
                    ...baseData,
                    "Actual Date": task.actualDate || "-",
                    "Checked": task.checked || "-",
                    "Remark": task.remark || "-",
                    "Company": task.companyName || "-",
                    "Email": task.email || "-",
                    "PDF URL": task.pdfUrl || "-",
                }
            }

            return baseData
        })

        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        const tabTitle = activeTab === "pending" ? "Pending_Draft_Letters" : "History_Draft_Letters"
        XLSX.utils.book_append_sheet(workbook, worksheet, tabTitle)
        const dateStr = new Date().toISOString().split("T")[0]
        XLSX.writeFile(workbook, `${tabTitle}_${dateStr}.xlsx`)
    }

    // Export to PDF
    const handleExportPDF = () => {
        if (!filteredTasks || filteredTasks.length === 0) {
            alert("No records to export.")
            return
        }

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
        })

        const dateStr = new Date().toLocaleDateString("en-GB")
        const tabName = activeTab === "pending" ? "Pending Draft Letters" : "History Draft Letters"

        doc.setFontSize(16)
        doc.setTextColor(31, 41, 55)
        doc.text(tabName, 40, 36)

        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text(`Generated on: ${dateStr} | Total Records: ${filteredTasks.length}`, 40, 52)

        let tableColumns = []
        let tableRows = []

        if (activeTab === "pending") {
            tableColumns = [
                "#",
                "Complaint ID",
                "ID Number",
                "Beneficiary",
                "Contact",
                "District",
                "Block",
                "Product",
                "Technician",
                "Nature of Complaint",
                "Status",
            ]

            tableRows = filteredTasks.map((task, index) => [
                index + 1,
                task.complaintId || "-",
                task.idNumber || "-",
                task.beneficiaryName || "-",
                task.contactNumber || "-",
                task.district || "-",
                task.block || "-",
                task.product || "-",
                task.technicianName || "-",
                (task.natureOfComplaint || "-").length > 40
                    ? (task.natureOfComplaint || "-").substring(0, 40) + "..."
                    : (task.natureOfComplaint || "-"),
                task.trackerStatus || task.status || "APPROVED-CLOSE",
            ])
        } else {
            tableColumns = [
                "#",
                "Complaint ID",
                "ID Number",
                "Beneficiary",
                "Contact",
                "District",
                "Block",
                "Product",
                "Technician",
                "Company",
                "Actual Date",
                "Status",
            ]

            tableRows = filteredTasks.map((task, index) => [
                index + 1,
                task.complaintId || "-",
                task.idNumber || "-",
                task.beneficiaryName || "-",
                task.contactNumber || "-",
                task.district || "-",
                task.block || "-",
                task.product || "-",
                task.technicianName || "-",
                task.companyName || "-",
                task.actualDate || "-",
                task.checked || task.trackerStatus || "-",
            ])
        }

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 64,
            theme: "grid",
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontSize: 8,
                fontStyle: "bold",
                halign: "center",
            },
            bodyStyles: {
                fontSize: 7.5,
                textColor: 50,
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            margin: { left: 30, right: 30 },
            styles: {
                overflow: "linebreak",
                cellPadding: 3,
            },
        })

        const fileDate = new Date().toISOString().split("T")[0]
        doc.save(`${activeTab === "pending" ? "Pending" : "History"}_Draft_Letters_${fileDate}.pdf`)
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-gray-500">Loading draft letter data...</div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-red-500">Error loading data: {error}</div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6">
                {/* Header with Title and Top Right Export Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Draft Letter</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage pending and historical draft letter complaints</p>
                    </div>

                    {/* Top Right: Export to Excel & PDF */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
                            title="Export to Excel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export Excel</span>
                        </button>

                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
                            title="Export to PDF"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => {
                                setActiveTab("pending")
                                setFilterDistrict("")
                                setFilterBlock("")
                                setFilterTechnician("")
                                setSearchTerm("")
                            }}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "pending"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Pending ({pendingTasks.length})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("history")
                                setFilterDistrict("")
                                setFilterBlock("")
                                setFilterTechnician("")
                                setSearchTerm("")
                            }}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "history"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            History ({historyTasks.length})
                        </button>
                    </nav>
                </div>

                {/* Filters with SearchableSelect Dropdowns & Global Search */}
                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Filters</span>
                            {(filterDistrict || filterBlock || filterTechnician || searchTerm) && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                            )}
                        </div>
                        {(filterDistrict || filterBlock || filterTechnician || searchTerm) && (
                            <button
                                onClick={() => {
                                    setFilterDistrict("")
                                    setFilterBlock("")
                                    setFilterTechnician("")
                                    setSearchTerm("")
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1 cursor-pointer"
                            >
                                <X size={12} />
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search Input */}
                        <div className="relative flex items-center">
                            <input
                                type="search"
                                placeholder="Search across all fields..."
                                className="pl-8 pr-7 w-full py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* District Searchable Dropdown */}
                        <SearchableSelect
                            placeholder="All Districts"
                            allOptionLabel="All Districts"
                            options={[...new Set(getCurrentTasks().map(t => t.district))].filter(Boolean).sort()}
                            value={filterDistrict}
                            onChange={(val) => {
                                setFilterDistrict(val)
                                setFilterBlock("")
                            }}
                        />

                        {/* Block Searchable Dropdown */}
                        <SearchableSelect
                            placeholder="All Blocks"
                            allOptionLabel="All Blocks"
                            options={[...new Set(getCurrentTasks().filter(t => !filterDistrict || t.district === filterDistrict).map(t => t.block))].filter(Boolean).sort()}
                            value={filterBlock}
                            onChange={(val) => setFilterBlock(val)}
                        />

                        {/* Technician Searchable Dropdown */}
                        <SearchableSelect
                            placeholder="All Technicians"
                            allOptionLabel="All Technicians"
                            options={[...new Set(getCurrentTasks().map(t => t.technicianName))].filter(Boolean).sort()}
                            value={filterTechnician}
                            onChange={(val) => setFilterTechnician(val)}
                        />
                    </div>
                </div>

                {/* Send Email button for History tab */}
                {activeTab === "history" && (
                    <div className="mb-4 flex items-center gap-3">
                        <button
                            onClick={() => {
                                const selected = historyTasks.filter(t => selectedHistoryIds.has(t.complaintId))
                                openEmailModal(selected)
                            }}
                            disabled={selectedHistoryIds.size === 0 || isSendingEmail}
                            className={`flex items-center gap-2 py-2 px-4 rounded-md text-white font-medium transition-all duration-200 ${selectedHistoryIds.size === 0
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm hover:shadow-md"
                                }`}
                        >
                            {isSendingEmail ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail size={16} />
                                    Send Email {selectedHistoryIds.size > 0 && `(${selectedHistoryIds.size})`}
                                </>
                            )}
                        </button>
                        {selectedHistoryIds.size > 0 && (
                            <span className="text-sm text-gray-500">
                                {selectedHistoryIds.size} row{selectedHistoryIds.size > 1 ? "s" : ""} selected
                            </span>
                        )}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        {/* Desktop Table View - Fixed Header & 400px Scrollable Body */}
                        <div className="hidden md:block overflow-x-auto h-[400px] max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg shadow-xs">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100 sticky top-0 z-20 shadow-xs border-b border-gray-200">
                                        <tr>
                                            {activeTab === "history" && (
                                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        checked={filteredTasks.length > 0 && selectedHistoryIds.size === filteredTasks.length}
                                                        onChange={(e) => toggleSelectAllHistory(e.target.checked)}
                                                        title="Select All"
                                                    />
                                                </th>
                                            )}
                                            {activeTab === "pending" && (
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                    Actions
                                                </th>
                                            )}
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                Complaint Id
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                ID Number
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[130px]">
                                                Technician Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                Technician Contact
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[140px]">
                                                Beneficiary Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                Contact Number
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[110px]">
                                                Village
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[110px]">
                                                Block
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[110px]">
                                                District
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[120px]">
                                                Product
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[100px]">
                                                Make
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[200px]">
                                                Nature Of Complaint
                                            </th>

                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                Status
                                            </th>
                                            {activeTab === "history" && (
                                                <>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                        Actual Date
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                        Checked
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[150px]">
                                                        Remark
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                        Letter PDF
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[130px]">
                                                        Company
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 min-w-[140px]">
                                                        Email
                                                    </th>
                                                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                                                        Actions
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={activeTab === "pending" ? 14 : 21} className="px-3 py-10 text-center text-gray-500 italic font-medium">
                                                    {activeTab === "pending"
                                                        ? "No pending draft letter complaints found"
                                                        : "No draft letter complaint history found"
                                                    }
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((task, index) => (
                                                <tr key={task.complaintId || index} className={`hover:bg-blue-50/40 transition-colors ${activeTab === "history" && selectedHistoryIds.has(task.complaintId) ? "bg-blue-50" : ""}`}>
                                                    {activeTab === "history" && (
                                                        <td className="px-3 py-3 whitespace-nowrap text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                                checked={selectedHistoryIds.has(task.complaintId)}
                                                                onChange={() => toggleHistorySelection(task.complaintId)}
                                                            />
                                                        </td>
                                                    )}
                                                    {activeTab === "pending" && (
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            <button
                                                                className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 border-0 py-1 px-3 rounded-md text-xs font-medium cursor-pointer shadow-xs transition-all"
                                                                onClick={() => {
                                                                    setSelectedTask(task.id)
                                                                    setSelectedTaskData(task)
                                                                    setIsDialogOpen(true)
                                                                    setEmail("")
                                                                    setSelectedCompany("")
                                                                }}
                                                            >
                                                                Review
                                                            </button>
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-3 text-xs font-mono font-semibold text-gray-900 whitespace-nowrap">{task.complaintId}</td>
                                                    <td className="px-3 py-3 text-xs font-medium text-blue-600 whitespace-nowrap">{task.idNumber}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-800 whitespace-normal break-words min-w-[130px]">{task.technicianName || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap font-mono">{task.technicianContact || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-900 font-medium whitespace-normal break-words min-w-[140px]">{task.beneficiaryName || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap font-mono">{task.contactNumber || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-normal break-words min-w-[110px]">{task.village || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-normal break-words min-w-[110px]">{task.block || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-normal break-words min-w-[110px]">{task.district || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-800 whitespace-normal break-words min-w-[120px]">{task.product || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-normal break-words min-w-[100px]">{task.make || "-"}</td>
                                                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-normal break-words min-w-[200px] max-w-xs" title={task.natureOfComplaint}>
                                                        {task.natureOfComplaint || "-"}
                                                    </td>

                                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                            {task.trackerStatus || task.status}
                                                        </span>
                                                    </td>
                                                    {activeTab === "history" && (
                                                        <>
                                                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600">{task.actualDate || "-"}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-xs">
                                                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                                                    {task.checked || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-xs whitespace-normal break-words min-w-[150px] max-w-xs text-gray-700" title={task.remark}>
                                                                {task.remark || "-"}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-xs">
                                                                {task.pdfUrl ? (
                                                                    <a
                                                                        href={getViewerUrl(task.pdfUrl)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                                                    >
                                                                        <FileText size={14} />
                                                                        View PDF
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400 italic text-xs">No PDF</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-3 text-xs text-gray-900 whitespace-normal break-words min-w-[130px]">{task.companyName || "-"}</td>
                                                            <td className="px-3 py-3 text-xs text-gray-600 whitespace-normal break-words min-w-[140px]">{task.email || "-"}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                                                <button
                                                                    onClick={() => openEmailModal(task)}
                                                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                                                                >
                                                                    <Mail size={12} />
                                                                    Email
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-3">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center p-10 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-500 italic">
                                        {activeTab === "pending"
                                            ? "No pending draft letter complaints found"
                                            : "No draft letter complaint history found"
                                        }
                                    </p>
                                </div>
                            ) : (
                                filteredTasks.map((task, index) => (
                                    <div key={task.complaintId || index} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{task.complaintId}</span>
                                            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">{task.trackerStatus}</span>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">ID Number</span>
                                                <span className="text-gray-900 font-medium">{task.idNumber}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Beneficiary</span>
                                                <span className="text-gray-900">{task.beneficiaryName}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Village</span>
                                                <span className="text-gray-900">{task.village}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Product</span>
                                                <span className="text-gray-900">{task.product}</span>
                                            </div>

                                            {/* Technician Info */}
                                            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs">
                                                <span className="text-gray-500">Technician</span>
                                                <span className="text-gray-900">{task.technicianName}</span>
                                            </div>

                                            {/* History specific fields */}
                                            {activeTab === "history" && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    {/* Checkbox for mobile card */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                            checked={selectedHistoryIds.has(task.complaintId)}
                                                            onChange={() => toggleHistorySelection(task.complaintId)}
                                                        />
                                                        <span className="text-xs text-gray-600 font-medium">Select for Email</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs items-center">
                                                        <span className="text-gray-500">Actual Date</span>
                                                        <span className="text-gray-900">{task.actualDate}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs items-center mt-1">
                                                        <span className="text-gray-500">Status</span>
                                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            {task.checked}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs items-center mt-2 pt-2 border-t border-gray-100">
                                                        <span className="text-gray-500 font-medium">Letter PDF</span>
                                                        {task.pdfUrl ? (
                                                            <a
                                                                href={getViewerUrl(task.pdfUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-blue-600 font-bold"
                                                            >
                                                                <FileText size={12} />
                                                                View PDF
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Not Generated</span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between text-xs mt-1">
                                                        <span className="text-gray-500">Company</span>
                                                        <span className="text-gray-900 font-medium">{task.companyName}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs mt-1">
                                                        <span className="text-gray-500">Email</span>
                                                        <span className="text-gray-900">{task.email}</span>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <button
                                                            onClick={() => openEmailModal(task)}
                                                            className="w-full inline-flex items-center justify-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-1.5 rounded-md text-xs font-medium"
                                                        >
                                                            <Mail size={12} />
                                                            Send Email
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action button for pending */}
                                            {activeTab === "pending" && (
                                                <div className="mt-2">
                                                    <button
                                                        className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-1.5 rounded-md text-xs font-medium"
                                                        onClick={() => {
                                                            setSelectedTask(task.id)
                                                            setSelectedTaskData(task)
                                                            setIsDialogOpen(true)
                                                            setEmail("")
                                                            setSelectedCompany("")
                                                        }}
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Review Dialog */}
                {isDialogOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsDialogOpen(false)}></div>
                            </div>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                Review Complaint: {selectedTaskData?.complaintId}
                                            </h3>
                                            <div className="mt-4 max-h-[60vh] overflow-auto">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {/* Pre-filled fields - read only */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Complaint Id
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.complaintId || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            ID Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.idNumber || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Technician Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.technicianName || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Technician Contact
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.technicianContact || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Beneficiary Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.beneficiaryName || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Contact Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.contactNumber || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Village
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.village || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Block
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.block || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            District
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.district || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Product
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.product || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Make
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.make || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Nature of Complaint
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.natureOfComplaint || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Status
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={selectedTaskData?.trackerStatus || ""}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                                                            Select Company <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            id="company"
                                                            value={selectedCompany}
                                                            onChange={(e) => {
                                                                const companyName = e.target.value;
                                                                setSelectedCompany(companyName);
                                                                const companyDetails = companyOptions.find(c => c.name === companyName);
                                                                if (companyDetails) {
                                                                    setEmail(companyDetails.email || "");
                                                                } else {
                                                                    setEmail("");
                                                                }
                                                            }}
                                                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="">Select a company</option>
                                                            {companyOptions.filter(opt => opt.name && opt.name.trim() !== "").map((opt, index) => (
                                                                <option key={index} value={opt.name}>
                                                                    {opt.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/dashboard/admin-letter/${selectedTaskData?.complaintId}`, { state: { task: selectedTaskData } })}
                                                    className="py-2 px-4 border border-blue-300 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center"
                                                    disabled={isSubmitting}
                                                >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Generate Letter
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDialogOpen(false)}
                                                    className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                                                    disabled={isSubmitting}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateTask}
                                                    className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white py-2 px-4 rounded-md flex items-center"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        "Submit"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Email Modal */}
                {emailModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setEmailModalOpen(false)}></div>
                            </div>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                                            <Mail size={16} className="text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Send Email — {emailModalRow?.complaintId}
                                        </h3>
                                    </div>

                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                        {/* Recipients */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                                            <div className="space-y-2">
                                                {emailRecipients.map((r, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium text-gray-900 truncate block">{r.name || 'No name'}</span>
                                                            <span className="text-xs text-gray-500 truncate block">{r.email}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeRecipient(idx)}
                                                            className="text-red-400 hover:text-red-600 flex-shrink-0"
                                                            title="Remove"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="email"
                                                    placeholder="Add email address and press Enter"
                                                    className="flex-1 border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addRecipient(e.target.value)
                                                            e.target.value = ''
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        const input = e.currentTarget.previousElementSibling
                                                        addRecipient(input.value)
                                                        input.value = ''
                                                    }}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                                                    title="Add recipient"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* PDF Attachments */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">PDF Attachments</label>
                                            {emailAttachments.length > 0 && (
                                                <div className="space-y-2 mb-2">
                                                    {emailAttachments.map((att, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                                                            <Paperclip size={14} className="text-blue-500 flex-shrink-0" />
                                                            <span className="text-sm text-blue-800 flex-1 truncate">{att.name}</span>
                                                            <button
                                                                onClick={() => removeAttachment(idx)}
                                                                className="text-red-400 hover:text-red-600 flex-shrink-0"
                                                                title="Remove"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <select
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value=""
                                                onChange={(e) => {
                                                    addAttachmentFromHistory(e.target.value)
                                                    e.target.value = ''
                                                }}
                                            >
                                                <option value="">Select PDF to attach...</option>
                                                {historyTasks
                                                    .filter(t => t.pdfUrl && extractFileId(t.pdfUrl))
                                                    .filter(t => !emailAttachments.some(a => a.fileId === extractFileId(t.pdfUrl)))
                                                    .map(t => (
                                                        <option key={t.complaintId} value={t.complaintId}>
                                                            {t.complaintId} - {t.beneficiaryName || t.companyName || 'PDF'}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            {emailAttachments.length === 0 && (
                                                <p className="text-xs text-gray-400 mt-1 italic">No PDF attached. Select from dropdown above.</p>
                                            )}
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                            <input
                                                type="text"
                                                value={emailSubject}
                                                onChange={(e) => setEmailSubject(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Body */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                                            <textarea
                                                value={emailBody}
                                                onChange={(e) => setEmailBody(e.target.value)}
                                                rows={8}
                                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setEmailModalOpen(false)}
                                            className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm"
                                            disabled={isSendingEmail}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSendEmailModal}
                                            disabled={isSendingEmail || emailRecipients.length === 0}
                                            className={`py-2 px-4 rounded-md text-white text-sm font-medium flex items-center gap-2 ${emailRecipients.length === 0
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                                                }`}
                                        >
                                            {isSendingEmail ? (
                                                <>
                                                    <Loader size={14} className="animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail size={14} />
                                                    Send Email ({emailRecipients.length})
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}

export default DraftLetter
