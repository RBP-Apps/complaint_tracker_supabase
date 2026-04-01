// DraftLetter.jsx
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Calendar, Upload, MapPin, Loader, Edit, Check, X, FileText, Mail, Trash2, Plus, Paperclip } from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import DashboardLayout from "../components/DashboardLayout"
import supabase from "../utils/supabase"

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

    const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [selectedLetterType, setSelectedLetterType] = useState("Draft Letter");

    const togglePendingSelection = (complaintId) => {
  const newSet = new Set(selectedPendingIds);
  if (newSet.has(complaintId)) {
    newSet.delete(complaintId);
  } else {
    newSet.add(complaintId);
  }
  setSelectedPendingIds(newSet);
};

const toggleSelectAllPending = (checked) => {
  if (checked) {
    const allIds = pendingTasks.map(t => t.complaintId);
    setSelectedPendingIds(new Set(allIds));
  } else {
    setSelectedPendingIds(new Set());
  }
};


    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec"

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
                    .eq("assign_to_vendor", "true")

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
        if (!email) {
            alert("Selected company has no email address. Please check Master sheet.")
            return
        }

        setIsSubmitting(true)

        try {
            const currentTasks = [...pendingTasks]
            const taskIndex = currentTasks.findIndex(t => t.id === selectedTask)
            if (taskIndex === -1 && activeTab === 'pending') throw new Error("Task not found")
            const task = activeTab === 'pending' ? { ...currentTasks[taskIndex] } : selectedTaskData

            const companyDetails = companyOptions.find(c => c.name === selectedCompany) || {}

            // Save selection to localStorage for AdminLetter.jsx to pick up
            const savedData = localStorage.getItem(`admin_letter_${task.complaintId}`);
            let letterInfoToUse = {};
            if (savedData) {
                const parsed = JSON.parse(savedData);
                letterInfoToUse = parsed.letterInfo;
                // Update header info in local storage too
                parsed.headerInfo = {
                    companyName: companyDetails.name,
                    address: companyDetails.address,
                    location: "", // Not available in master?
                    contact: `Phone No. ${companyDetails.phone} Email : ${companyDetails.email}`
                };
                localStorage.setItem(`admin_letter_${task.complaintId}`, JSON.stringify(parsed));
            } else {
                letterInfoToUse = {
                    letterNo: `SSY/2025/${Math.floor(Math.random() * 900) + 100}`,
                    date: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
                    subject: "जिला कोण्डागांव में सौर सुजला योजनांतर्गत स्थापित सिंचाई सोलर पंप के संबंध में ।",
                    reference: [
                        "पत्र क्र. 2386/क्रेडा/जि.का./SSY/O&M/F-04/2024-25 कोण्डागांव, दिनांक 06.11.2025,",
                        "जिला कार्यालय कोण्डागांव का पत्र क्रमांक / दिनांक 2067 / 26.09.2025, 2282 / 29.10.2025, 2112 / 29.09.2025 |"
                    ],
                    officerName: "जिला प्रभारी,",
                    department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
                    districtOffice: `जिला कार्यालय, ${task.district || 'कोण्डागांव'} (छ०ग०)`,
                    salutation: "महोदय,",
                    introParagraph: "उपरोक्त विषयांतर्गत लेख है कि, जिला कोण्डागांव अंतर्गत हमारे द्वारा विभिन्न स्थलों में सोलर पंपों स्थापित किया गया है। जिसकी अकार्य शीलता की सूचना हमें आपके संदर्भित पत्र के माध्यम से प्राप्त हुआ। जिसका विवरण निम्नानुसार है-",
                    closingParagraph: "उपरोक्त साईट के संयंत्र का सुधार कार्य हमारे द्वारा कर दिया गया है, तथा संयंत्र वर्तमान में कार्य शील है। इस पत्र के साथ साईट की संपुष्टि पत्र संलग्न है। पत्र आपकी ओर सादर सूचनार्थ हेतु प्रेषित।",
                    thankYou: "सधन्यवाद !",
                    regards: "भवदीय",
                    forCompany: `वास्ते, ${companyDetails.name}`,
                    designation: "अधिकृत हस्ताक्षरकर्ता",
                    copiesTo: [
                        "कार्यपालन अभियंता महोदय, (RE-05) क्रेडा प्रधान कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।",
                        "कार्यपालन अभियंता महोदय,क्रेडा जोनल कार्यालय, जगदलपुर को सादर सूचनार्थ प्रेषित।"
                    ]
                }
            }


            // Construct Header Info for the helper
            const headerInfo = {
                companyName: companyDetails.name,
                address: companyDetails.address,
                location: "",
                contact: `Phone No. ${companyDetails.phone} Email : ${companyDetails.email}`
            };

            // Dynamic import to avoid top-level import issue in this chunk? No, React supports top level.
            // I will add the import in a separate chunk in this multi_replace.

            const htmlContent = (await import("../utils/letterTemplate.js")).generateLetterHTML(task, headerInfo, letterInfoToUse);

            const formData = new FormData()
            formData.append('action', 'sendComplaintLetter') // New action for email
            formData.append('email', email)
            formData.append('subject', letterInfoToUse.subject)
            formData.append('htmlBody', htmlContent)
            formData.append('complaintId', task.complaintId)
            formData.append('companyName', selectedCompany) // Save company name

            formData.append('checkedValue', task.checked || (task.trackerStatus === 'APPROVED-CLOSE' ? 'APPROVED-CLOSE' : ''))
            formData.append('remarkValue', task.remark || '')

            console.log('DraftLetter: Submitting data:', {
                action: 'sendComplaintLetter',
                email,
                company: selectedCompany
            })

            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()
            console.log('DraftLetter: Response:', result)

            if (!result.success) {
                // If backend warns about missing action, we might need to fallback
                if (result.error && result.error.includes("action")) {
                    alert("Backend does not support sending email yet. Please contact admin.")
                } else {
                    throw new Error(result.error || 'Failed to send email')
                }
            } else {
                alert(`Letter generated and sent to ${email} successfully!`)
            }


            // I will update the lists as before to give feedback.
            setPendingTasks(prev => prev.filter(t => t.complaintId !== task.complaintId))

            setHistoryTasks(prev => {
                const exists = prev.some(t => t.complaintId === task.complaintId)
                if (exists) {
                    return prev.map(t => t.complaintId === task.complaintId ? task : t)
                }
                return [...prev, task]
            })

            setIsDialogOpen(false)
            resetDialogState()

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

        setIsSendingEmail(true)
        try {
            // Each recipient carries their own fileId; also include any extra attachments from dropdown
            const recipientsWithFiles = emailRecipients.map(r => ({
                ...r,
                fileId: r.fileId || ""
            }))
            // Extra attachments added via dropdown (not already linked to a recipient)
            const extraFileIds = emailAttachments
                .filter(a => !emailRecipients.some(r => r.fileId === a.fileId))
                .map(a => a.fileId)

            const formData = new FormData()
            formData.append('action', 'sendBulkEmail')
            formData.append('recipients', JSON.stringify(recipientsWithFiles))
            formData.append('subject', emailSubject)
            formData.append('body', emailBody)
            formData.append('complaintId', emailModalRow?.complaintId || '')
            formData.append('fileIds', JSON.stringify(extraFileIds))

            console.log('DraftLetter: Sending bulk email:', {
                recipients: recipientsWithFiles.length,
                subject: emailSubject,
                complaintId: emailModalRow?.complaintId,
                extraAttachments: extraFileIds.length
            })

            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                alert("Email sent successfully to selected recipients")
                setEmailModalOpen(false)
                setEmailModalRow(null)
                setEmailRecipients([])
                setEmailSubject("")
                setEmailBody("")
                setEmailAttachments([])
            } else {
                throw new Error(result.error || 'Failed to send email')
            }
        } catch (err) {
            console.error('DraftLetter: Email modal send error:', err)
            alert('Failed to send email: ' + err.message)
        } finally {
            setIsSendingEmail(false)
        }
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

        setIsSendingEmail(true)

        try {
            const selectedTasks = historyTasks.filter(t => selectedHistoryIds.has(t.complaintId))
            const { generateLetterHTML } = await import("../utils/letterTemplate.js")

            let successCount = 0
            let failCount = 0

            for (const task of selectedTasks) {
                try {
                    // Use saved letter data from localStorage if available, otherwise build defaults
                    const savedData = localStorage.getItem(`admin_letter_${task.complaintId}`)
                    let letterInfoToUse = {}
                    let headerInfo = {}

                    if (savedData) {
                        const parsed = JSON.parse(savedData)
                        letterInfoToUse = parsed.letterInfo || {}
                        headerInfo = parsed.headerInfo || {
                            companyName: task.companyName,
                            address: "",
                            location: "",
                            contact: ""
                        }
                    } else {
                        // Build default letter info
                        letterInfoToUse = {
                            letterNo: `SSY/2025/${Math.floor(Math.random() * 900) + 100}`,
                            date: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
                            subject: "जिला कोण्डागांव में सौर सुजला योजनांतर्गत स्थापित सिंचाई सोलर पंप के संबंध में ।",
                            reference: [
                                "पत्र क्र. 2386/क्रेडा/जि.का./SSY/O&M/F-04/2024-25 कोण्डागांव, दिनांक 06.11.2025,",
                                "जिला कार्यालय कोण्डागांव का पत्र क्रमांक / दिनांक 2067 / 26.09.2025, 2282 / 29.10.2025, 2112 / 29.09.2025 |"
                            ],
                            officerName: "जिला प्रभारी,",
                            department: "छत्तीसगढ़ राज्य अक्षय ऊर्जा विकास अभिकरण (क्रेडा)",
                            districtOffice: `जिला कार्यालय, ${task.district || 'कोण्डागांव'} (छ०ग०)`,
                            salutation: "महोदय,",
                            introParagraph: "उपरोक्त विषयांतर्गत लेख है कि, जिला कोण्डागांव अंतर्गत हमारे द्वारा विभिन्न स्थलों में सोलर पंपों स्थापित किया गया है। जिसकी अकार्य शीलता की सूचना हमें आपके संदर्भित पत्र के माध्यम से प्राप्त हुआ। जिसका विवरण निम्नानुसार है-",
                            closingParagraph: "उपरोक्त साईट के संयंत्र का सुधार कार्य हमारे द्वारा कर दिया गया है, तथा संयंत्र वर्तमान में कार्य शील है। इस पत्र के साथ साईट की संपुष्टि पत्र संलग्न है। पत्र आपकी ओर सादर सूचनार्थ हेतु प्रेषित।",
                            thankYou: "सधन्यवाद !",
                            regards: "भवदीय",
                            forCompany: `वास्ते, ${task.companyName}`,
                            designation: "अधिकृत हस्ताक्षरकर्ता",
                            copiesTo: [
                                "कार्यपालन अभियंता महोदय, (RE-05) क्रेडा प्रधान कार्यालय, रायपुर को सादर सूचनार्थ प्रेषित।",
                                "कार्यपालन अभियंता महोदय,क्रेडा जोनल कार्यालय, जगदलपुर को सादर सूचनार्थ प्रेषित।"
                            ]
                        }
                        headerInfo = {
                            companyName: task.companyName,
                            address: "",
                            location: "",
                            contact: ""
                        }
                    }

                    const taskEmail = task.email
                    if (!taskEmail) {
                        console.warn(`DraftLetter: Skipping ${task.complaintId} — no email address`)
                        failCount++
                        continue
                    }

                    const htmlContent = generateLetterHTML(task, headerInfo, letterInfoToUse)

                    const formData = new FormData()
                    formData.append('action', 'sendBulkEmail')
                    formData.append('recipients', JSON.stringify([{ email: taskEmail, name: task.companyName || '' }]))
                    formData.append('subject', letterInfoToUse.subject || '')
                    formData.append('htmlBody', htmlContent) // Traditional letter HTML
                    formData.append('fileIds', JSON.stringify([])) // No Drive attachments for bulk generator
                    formData.append('complaintId', task.complaintId)
                    formData.append('checkedValue', task.checked || '')
                    formData.append('remarkValue', task.remark || '')

                    console.log(`DraftLetter: Sending email for ${task.complaintId} to ${taskEmail}`)

                    const response = await fetch(GOOGLE_SCRIPT_URL, {
                        method: 'POST',
                        body: formData,
                    })

                    const result = await response.json()

                    if (result.success) {
                        successCount++
                    } else {
                        console.error(`DraftLetter: Failed for ${task.complaintId}:`, result.error)
                        failCount++
                    }
                } catch (innerErr) {
                    console.error(`DraftLetter: Error sending email for ${task.complaintId}:`, innerErr)
                    failCount++
                }
            }

            // Show result summary
            if (failCount === 0) {
                alert("Email sent successfully to selected recipients")
            } else if (successCount > 0) {
                alert(`Email sent to ${successCount} recipient(s). ${failCount} failed.`)
            } else {
                alert(`Failed to send emails. Please check email addresses and try again.`)
            }

            setSelectedHistoryIds(new Set())

        } catch (err) {
            console.error("DraftLetter: Batch email error:", err)
            alert("Failed to send emails: " + err.message)
        } finally {
            setIsSendingEmail(false)
        }
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
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Assign To Vendor Letter</h1>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200 flex justify-between items-center">
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

                    {/* Generate Letter Button */}
                    {activeTab === "pending" && selectedPendingIds.size > 0 && (
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsGenerateModalOpen(true)}
                                className="py-2 px-4 shadow-sm border border-blue-300 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center font-medium"
                            >
                                <FileText size={16} className="mr-2" />
                                Generate Letter
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="search"
                            placeholder="Search across all fields"
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* District Filter */}
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                    >
                        <option value="">All Districts</option>
                        {[...new Set(getCurrentTasks().map(t => t.district))].filter(Boolean).sort().map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                        ))}
                    </select>

                    {/* Block Filter */}
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterBlock}
                        onChange={(e) => setFilterBlock(e.target.value)}
                    >
                        <option value="">All Blocks</option>
                        {[...new Set(getCurrentTasks().map(t => t.block))].filter(Boolean).sort().map(block => (
                            <option key={block} value={block}>{block}</option>
                        ))}
                    </select>

                    {/* Technician Filter */}
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterTechnician}
                        onChange={(e) => setFilterTechnician(e.target.value)}
                    >
                        <option value="">All Technicians</option>
                        {[...new Set(getCurrentTasks().map(t => t.technicianName))].filter(Boolean).sort().map(tech => (
                            <option key={tech} value={tech}>{tech}</option>
                        ))}
                    </select>
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
                        {/* Desktop Table View - Fixed Header & Scrollable Body */}
                        <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0 max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            {activeTab === "history" && (
                                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
  <>
    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
      <input
        type="checkbox"
        className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        onChange={(e) => toggleSelectAllPending(e.target.checked)}
      />
    </th>

    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
      Actions
    </th>
  </>
)}
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Complaint Id
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                ID Number
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Technician Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Technician Contact
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Beneficiary Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Contact Number
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Village
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Block
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                District
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Product
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Make
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Nature Of Complaint
                                            </th>

                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                Status
                                            </th>
                                            {activeTab === "history" && (
                                                <>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Actual Date
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Checked
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Remark
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Letter PDF
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Company
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Email
                                                    </th>
                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        Actions
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={activeTab === "pending" ? 14 : 18} className="px-3 py-10 text-center text-gray-500 italic font-medium">
                                                    {activeTab === "pending"
                                                        ? "No pending draft letter complaints found"
                                                        : "No draft letter complaint history found"
                                                    }
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((task, index) => (
                                                <tr key={task.complaintId || index} className={`hover:bg-gray-50 ${activeTab === "history" && selectedHistoryIds.has(task.complaintId) ? "bg-blue-50" : ""}`}>
                                                    {activeTab === "history" && (
                                                        <td className="px-3 py-4 whitespace-nowrap text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                                checked={selectedHistoryIds.has(task.complaintId)}
                                                                onChange={() => toggleHistorySelection(task.complaintId)}
                                                            />
                                                        </td>
                                                    )}
{activeTab === "pending" && (
  <>
    {/* ✅ Checkbox */}
    <td className="px-3 py-4 text-center">
      <input
        type="checkbox"
        className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        checked={selectedPendingIds?.has(task.complaintId)}
        onChange={() => togglePendingSelection(task.complaintId)}
      />
    </td>

    {/* ✅ Action */}
    <td className="px-3 py-4 whitespace-nowrap">
      <button
        className="bg-gradient-to-r from-amber-400 to-orange-500 text-white py-1 px-3 rounded-md"
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
  </>
)}
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.complaintId}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{task.idNumber}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.technicianName}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.technicianContact}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.beneficiaryName}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.contactNumber}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.village}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.block}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.district}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.product}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.make}</td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={task.natureOfComplaint}>
                                                        {task.natureOfComplaint}
                                                    </td>

                                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{task.trackerStatus}</td>
                                                    {activeTab === "history" && (
                                                        <>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm">{task.actualDate}</td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm">
                                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                    {task.checked}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={task.remark}>
                                                                {task.remark}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm">
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
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{task.companyName}</td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{task.email}</td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-center">
                                                                <button
                                                                    onClick={() => openEmailModal(task)}
                                                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
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
                                                            {companyOptions.map((opt, index) => (
                                                                <option key={index} value={opt.name}>
                                                                    {opt.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                                {/* <button
                                                    type="button"
                                                    onClick={() => navigate(`/dashboard/admin-letter/${selectedTaskData?.complaintId}`, { 
                                                        state: { 
                                                            task: selectedTaskData,
                                                            autoSelectCompany: "RBP ENERGY (INDIA) PVT. LTD."
                                                        } 
                                                    })}
                                                    className="py-2 px-4 border border-blue-300 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center"
                                                    disabled={isSubmitting}
                                                >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Generate Letter Final 1
                                                </button> */}
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

                {/* Generate Letter Modal */}
                {isGenerateModalOpen && (
                    <div className="fixed border inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative border border-blue-50">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center text-white">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <FileText size={20} className="text-white" />
                                    Generate Letter
                                </h3>
                                <button
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                                        <select
                                            value={selectedLetterType}
                                            onChange={(e) => setSelectedLetterType(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Battery">Battery</option>
                                            <option value="Inverter">Inverter</option>
                                            <option value="Street Light">Street Light</option>
                                        </select>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Selected complaint for letter generation: <span className="font-semibold text-gray-700">{pendingTasks.find(t => t.complaintId === [...selectedPendingIds][0])?.complaintId || 'Unknown'}</span>
                                    </p>
                                </div>
                                
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setIsGenerateModalOpen(false)}
                                        className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const selectedTasksArray = pendingTasks.filter(t => selectedPendingIds.has(t.complaintId));
                                            const firstSelectedId = [...selectedPendingIds][0];
                                            setIsGenerateModalOpen(false);
                                            navigate(`/dashboard/admin-letter/${firstSelectedId}`, { 
                                                state: { 
                                                    tasks: selectedTasksArray,
                                                    itemType: selectedLetterType,
                                                    autoSelectCompany: "RBP ENERGY (INDIA) PVT. LTD."
                                                } 
                                            });
                                        }}
                                        className="py-2 px-4 border border-blue-300 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center text-sm font-medium"
                                    >
                                        <FileText size={16} className="mr-2" />
                                        Generate Letter Final
                                    </button>
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
