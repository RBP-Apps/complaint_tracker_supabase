"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import supabase from "../utils/supabase";

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
        onChange={() => {}}
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
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-left text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : "hover:border-gray-400"
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
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between ${
                    value === opt ? "bg-blue-50 font-semibold text-blue-600" : "text-gray-700"
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

  const [debouncedCompanyName, setDebouncedCompanyName] = useState("")
  const [debouncedTechnicianName, setDebouncedTechnicianName] = useState("")
  const [debouncedBeneficiaryName, setDebouncedBeneficiaryName] = useState("")
  const [masterBeneficiaryOptions, setMasterBeneficiaryOptions] = useState([]) // For Create/Update Form (from Master)
  const [filterBeneficiaryOptions, setFilterBeneficiaryOptions] = useState([]) // For Table Filter (from FMS)

  // Document upload states
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [documentUploadStatus, setDocumentUploadStatus] = useState("")
  const [isUploadingUpdateDoc, setIsUploadingUpdateDoc] = useState(false)
  const [updateDocStatus, setUpdateDocStatus] = useState("")

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
    reporterName: "",
    assignToVendor: false,
    documentUrl: "",
  })


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCompanyName(filterCompanyName)
    }, 500)

    return () => clearTimeout(timer)
  }, [filterCompanyName])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTechnicianName(filterTechnicianName)
    }, 500)

    return () => clearTimeout(timer)
  }, [filterTechnicianName])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBeneficiaryName(filterBeneficiaryName)
    }, 500)

    return () => clearTimeout(timer)
  }, [filterBeneficiaryName])



  const generateSerialNumber = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("FMS")
        .select("complaint_id")

      if (error) throw error

      let maxNumber = 0;

      data.forEach(item => {
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

  // ================= DOCUMENT UPLOAD HELPERS =================
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
        setDocumentUploadStatus(`✓ Uploaded: ${file.name}`);
        return;
      }

      const { data } = supabase.storage.from("vendor_tracker").getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, documentUrl: data.publicUrl }));
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

  const fetchTableData = useCallback(async () => {
    try {
      setDataError(null)

      const currentUser = localStorage.getItem('currentUser')
      const userRole = localStorage.getItem('userRole')

      const { data, error } = await supabase
        .from("FMS")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      let filteredData = data

      // ROLE FILTER
      if (userRole === 'tech' && currentUser) {
        filteredData = data.filter(row =>
          row.technician_name?.toLowerCase() === currentUser.toLowerCase()
        )
      }

      // FILTERS
      if (debouncedCompanyName) {
        filteredData = filteredData.filter(row =>
          row.company_name?.toLowerCase().includes(debouncedCompanyName.toLowerCase())
        )
      }

      if (debouncedTechnicianName) {
        filteredData = filteredData.filter(row =>
          row.technician_name?.toLowerCase().includes(debouncedTechnicianName.toLowerCase())
        )
      }

      const dynamicBeneficiaries = [...new Set(filteredData.map(row => row.beneficiary_name))]
        .filter(Boolean)
        .sort()

      setFilterBeneficiaryOptions(dynamicBeneficiaries)

      if (debouncedBeneficiaryName) {
        filteredData = filteredData.filter(row =>
          row.beneficiary_name?.toLowerCase().includes(debouncedBeneficiaryName.toLowerCase())
        )
      }

      setTableData(filteredData)

      if (filteredData.length === 0) {
        setDataError(
          userRole === 'tech'
            ? 'No complaints assigned to you'
            : 'No complaints found'
        )
      }

    } catch (error) {
      console.error('Error fetching table data:', error)
      setDataError(error.message)
    }
  }, [debouncedCompanyName, debouncedTechnicianName, debouncedBeneficiaryName])



  // Update serial number whenever tableData changes (and has data)
  useEffect(() => {
    if (tableData && tableData.length > 0) {
    }
  }, [tableData]);


  // Update the auto-refresh useEffect to include filter dependencies
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchTableData()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchTableData, filterCompanyName, filterTechnicianName, filterBeneficiaryName])


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
  const handleOpenUpdateModal = (rowIndex) => {
    const currentRow = tableData[rowIndex]
    console.log('Opening update modal for row:', rowIndex, currentRow)

    // Pre-fill all form data with correct Supabase column names
    setUpdateFormData({
      rowIndex: rowIndex,
      actualRowNumber: currentRow.id, // Store the actual row ID for reference
      complaintId: currentRow.complaint_id || "",
      companyName: currentRow.company_name || "",
      modeOfCall: currentRow.mode_of_call || "",
      idNumber: currentRow.id_number || "",
      projectName: currentRow.project_name || "",
      complaintNumber: currentRow.complaint_number || "",
      complaintDate: currentRow.complaint_date ? new Date(currentRow.complaint_date) : null,
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
      challanDate: currentRow.challan_date ? new Date(currentRow.challan_date) : null,
      closeDate: currentRow.close_date ? new Date(currentRow.close_date) : null,
      resolvedDate: currentRow.resolved_date ? new Date(currentRow.resolved_date) : null,
      reporterName: currentRow.reporter_name || "",
      challanNo: currentRow.challan_no || "",
      letterReferenceNumber: currentRow.letter_reference_number || "",
      modeOfLetter: currentRow.mode_of_letter || "",
      isReferenceName: !currentRow.contact_number && !!currentRow.reference_name,
      referenceName: currentRow.reference_name || "",
      documentUrl: currentRow.document_url || "",
    })

    setCurrentUpdateRow(rowIndex)
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

      const { error } = await supabase
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
        .eq("complaint_id", updateFormData.complaintId)

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



  // Add refresh button handler
  const handleRefreshData = async () => {
    setIsLoading(true)
    await fetchTableData()
    setIsLoading(false)
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!serialNumber) throw new Error("Serial number missing")

      const { error } = await supabase.from("FMS").insert([{
        timestamp: new Date(),
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
        reporterName: "",
        assignToVendor: false,
        documentUrl: "",
      })
      setDocumentUploadStatus("")

      setComplaintDate(null)
      setChallanDate(null)
      setCloseDate(null)
      setResolvedDate(null)

      // ✅ TABLE REFRESH
      await fetchTableData()

      // ✅ NEW SERIAL
      await generateSerialNumber()

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
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  {showForm ? 'Hide Form' : 'Add New Complaint'}
                </button>
              </div>
            </div>
            {/* Add this filter section right after the header and before the table */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">

                </label>
                <input
                  type="text"
                  value={filterCompanyName}
                  onChange={(e) => setFilterCompanyName(e.target.value)}
                  placeholder="Search company..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">

                </label>
                <input
                  type="text"
                  value={filterTechnicianName}
                  onChange={(e) => setFilterTechnicianName(e.target.value)}
                  placeholder="Search technician..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
             
                <SearchableSelect
                  options={filterBeneficiaryOptions}
                  value={filterBeneficiaryName}
                  onChange={(val) => setFilterBeneficiaryName(val)}
                  placeholder="All Beneficiaries"
                />
              </div>

              {/* Clear All Filters Button */}
              {
                (filterCompanyName || filterTechnicianName || filterBeneficiaryName) && (
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      onClick={() => {
                        setFilterCompanyName("")
                        setFilterTechnicianName("")
                        setFilterBeneficiaryName("")
                      }}
                      className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )
              }
            </div >


            {/* Collapsible Form - WHITE BACKGROUND */}
            {
              showForm && (
                <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-white">
                  <h2 className="text-lg font-semibold mb-4">New Complaint Form</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

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
                          Project Name
                        </label>
                        <SearchableSelect
                          name="projectName"
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
                          selected={complaintDate}
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
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                            formData.isReferenceName ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
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
                          selected={resolvedDate}
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
                          <label htmlFor="assignToVendor" className="text-sm font-medium text-gray-700">
                            Assign to Vendor (Disable technician fields)
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
                          selected={formData.assignToVendor ? null : challanDate}  // Modify this line
                          onChange={(date) => !formData.assignToVendor && setChallanDate(date)}  // Modify this line
                          dateFormat="dd/MM/yyyy"
                          disabled={formData.assignToVendor}  // Add this line
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
                            <a
                              href={formData.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline font-semibold hover:text-blue-800 ml-auto"
                            >
                              View Uploaded Document ↗
                            </a>
                          )}
                        </div>
                      </div>

                    </div >

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
                    < div className="flex justify-end space-x-3 pt-4" >
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Complaint'}
                      </button>
                    </div >
                  </form >
                </div >
              )
            }

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
                            selected={updateFormData.complaintDate}
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
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                              updateFormData.isReferenceName ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
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
                            selected={updateFormData.resolvedDate}
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
                            selected={updateFormData.challanDate}
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
                              <a
                                href={updateFormData.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 underline font-semibold hover:text-blue-800 ml-auto"
                              >
                                View Current Document ↗
                              </a>
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

            {/* Table with improved UI */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-xl font-semibold">
                  Complaints Data ({tableData.length} records
                  {localStorage.getItem('userRole') === 'tech' && ' assigned to you'}
                  )
                </h2>
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
              ) : tableData.length > 0 ? (
                <>
                  {/* Desktop Table View - Hidden on mobile with FIXED HEADER */}
                  <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-center text-nowrap">
                        <thead className="bg-gray-100 sticky top-0 z-10 text-center">
                          <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Action
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Complaint ID
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              ID Number
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Complaint Date
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Company Name
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Mode Of Call
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Document
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Technician Name
                            </th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">
                              Challan No
                            </th>

                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">
                              Challan Date
                            </th>

                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">
                              Controller RID
                            </th>

                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">
                              Product SL No
                            </th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">
                              Insurance Type
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Beneficiary Name
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Contact Number
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Village
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              District
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Product
                            </th>
                            <th scope="col" className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                              Nature Of Complaint
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-center">
                          {tableData.map((row, rowIndex) => (
                            <tr key={`complaint-${row.id}-${rowIndex}`} className="hover:bg-gray-50">

                              <td className="px-3 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenUpdateModal(rowIndex)}
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => handleDelete(row.id)}
                                  className="ml-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
                                >
                                  Delete
                                </button>
                              </td>

                              <td className="px-3 py-4 text-sm text-blue-600 font-medium">
                                {row.complaint_id || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm text-purple-600 font-medium">
                                {row.id_number || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.complaint_date
                                  ? new Date(row.complaint_date).toLocaleDateString()
                                  : "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.company_name || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                <div>{row.mode_of_call || "-"}</div>
                                {row.letter_reference_number && (
                                  <div className="text-xs text-purple-600 font-medium">
                                    Ref: {row.letter_reference_number}
                                  </div>
                                )}
                              </td>

                              <td className="px-3 py-4 text-sm whitespace-nowrap">
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

                              <td className="px-3 py-4 text-sm">
                                {row.technician_name || "-"}
                              </td>
                              <td className="px-3 py-4 text-sm">
                                {row.challan_no || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.challan_date
                                  ? new Date(row.challan_date).toLocaleDateString()
                                  : "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.controller_rid_no || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.product_sl_no || "-"}
                              </td>
                              <td className="px-3 py-4 text-sm">
                                {row.insurance_type || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.beneficiary_name || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.contact_number || (row.reference_name ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200">
                                    Ref: {row.reference_name}
                                  </span>
                                ) : "-")}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.village || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.district || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.product || "-"}
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {row.nature_of_complaint
                                  ? row.nature_of_complaint.length > 50
                                    ? row.nature_of_complaint.substring(0, 50) + "..."
                                    : row.nature_of_complaint
                                  : "-"}
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table >
                    </div >
                  </div >

                  {/* Mobile Card View - Visible on mobile only */}
                  <div className="lg:hidden space-y-4">
                    {tableData.map((row, rowIndex) => (
                      <div
                        key={`mobile-${row.id}-${rowIndex}`}
                        className="border rounded-lg p-4 bg-white border-gray-200"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-xs text-gray-500">Complaint ID</div>
                            <div className="font-semibold text-blue-600">
                              {row.complaint_id || "-"}
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenUpdateModal(rowIndex)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                          >
                            Update
                          </button>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">

                          <div><b>ID:</b> {row.id_number || "-"}</div>
                          <div><b>Date:</b> {row.complaint_date ? new Date(row.complaint_date).toLocaleDateString() : "-"}</div>
                          <div><b>Company:</b> {row.company_name || "-"}</div>
                          <div><b>Technician:</b> {row.technician_name || "-"}</div>
                          <div><b>Beneficiary:</b> {row.beneficiary_name || "-"}</div>
                          <div>
                            <b>Contact:</b>{" "}
                            {row.contact_number || (row.reference_name ? (
                              <span className="text-amber-800 font-medium">Ref: {row.reference_name}</span>
                            ) : "-")}
                          </div>
                          <div><b>Village:</b> {row.village || "-"}</div>
                          <div><b>District:</b> {row.district || "-"}</div>
                          <div><b>Product:</b> {row.product || "-"}</div>
                          <div>
                            <b>Mode:</b> {row.mode_of_call || "-"}
                            {row.letter_reference_number && (
                              <span className="ml-1 text-purple-600 font-medium">(Ref: {row.letter_reference_number})</span>
                            )}
                          </div>
                          {row.document_url && (
                            <div>
                              <b>Document:</b>{" "}
                              <a
                                href={row.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline font-semibold"
                              >
                                📄 View Uploaded Document ↗
                              </a>
                            </div>
                          )}
                          <div><b>Complaint:</b> {row.nature_of_complaint || "-"}</div>

                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                </div>
              )}

            </div >
          </>
        )}
      </div >
    </div >
  )
}

export default NewComplaintForm
