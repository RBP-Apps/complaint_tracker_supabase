



// TechnicianTracker.jsx
"use client"

import { useState, useEffect } from "react"
import { Calendar, Upload, MapPin, Loader, Edit, Check, X } from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import DashboardLayout from "../components/DashboardLayout"
import supabase from "../utils/supabase"

function TechnicianTracker() {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingTasks, setPendingTasks] = useState([])
  const [historyTasks, setHistoryTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTaskData, setSelectedTaskData] = useState(null)
  const [date, setDate] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [status, setStatus] = useState("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadedDocument, setUploadedDocument] = useState(null)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [modeOfCallFilter, setModeOfCallFilter] = useState("")
  const [technicianFilter, setTechnicianFilter] = useState("")
  const [technicianName, setTechnicianName] = useState("")
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [username, setUsername] = useState("")
  const [photoLocation, setPhotoLocation] = useState(null)
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)

  useEffect(() => {
    const u = localStorage.getItem("username") || ""
    setUsername(u)
  }, [])

  const techDisplayName = (username || "").toLowerCase().startsWith("tech")
    ? (username || "").substring(4).trim()
    : ""



  const getFilteredPendingTasks = () => {
    console.log("🔵 Getting Pending Tasks, techDisplayName:", techDisplayName);
    console.log("📊 Total pending tasks:", pendingTasks.length);

    if (!techDisplayName) {
      console.log("👨‍💼 Admin mode - returning all pending tasks");
      return pendingTasks;
    }

    const filtered = pendingTasks.filter(task => {
      const matchesTechUser = task.technicianName?.toLowerCase().includes(techDisplayName.toLowerCase());
      return matchesTechUser;
    });

    console.log("👷 Technician mode - filtered pending:", filtered.length);
    return filtered;
  };

  const getFilteredHistoryTasks = () => {
    console.log("🟢 Getting History Tasks, techDisplayName:", techDisplayName);
    console.log("📊 Total history tasks:", historyTasks.length);

    if (!techDisplayName) {
      console.log("👨‍💼 Admin mode - returning all history tasks");
      return historyTasks;
    }

    const filtered = historyTasks.filter(task => {
      const matchesTechUser = task.technicianName?.toLowerCase().includes(techDisplayName.toLowerCase());
      return matchesTechUser;
    });

    console.log("👷 Technician mode - filtered history:", filtered.length);
    return filtered;
  };

  // FIXED: Proper tab-specific data fetching
  const getCurrentTasks = () => {
    if (activeTab === "pending") {
      return getFilteredPendingTasks();
    } else if (activeTab === "history") {
      return getFilteredHistoryTasks();
    }
    return [];
  };
  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        date = new Date(year, month, day);
      } else {
        return dateValue;
      }
    } else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    } else {
      return dateValue;
    }

    if (isNaN(date.getTime())) {
      return dateValue;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFormattedAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      } else {
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.error("Error getting formatted address:", error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

          const formattedAddress = await getFormattedAddress(latitude, longitude);

          const locationInfo = {
            latitude,
            longitude,
            mapLink,
            formattedAddress,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
          };

          resolve(locationInfo);
        },
        (error) => {
          const errorMessages = {
            1: "Location permission denied. Please enable location services.",
            2: "Location information unavailable.",
            3: "Location request timed out.",
          };
          reject(
            new Error(errorMessages[error.code] || "An unknown error occurred.")
          );
        },
        options
      );
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-blue-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch pending tasks from Supabase FMS (planned1 set, actual1 null)
        const { data: fmsData, error: fmsError } = await supabase
          .from("FMS")
          .select("*")
          .not("planned1", "is", null)
          .is("actual1", null)

        if (fmsError) throw fmsError

        const pendingData = (fmsData || []).map((row, index) => ({
          rowIndex: index + 1,
          complaintNo: row.complaint_id || "",
          date: row.timestamp ? formatDateString(row.timestamp) : "",
          head: row.company_name || "",
          companyName: row.company_name || "",
          modeOfCall: row.mode_of_call || "",
          idNumber: row.id_number || "",
          projectName: row.project_name || "",
          complaintNumber: row.complaint_id || "",
          complaintDate: row.complaint_date ? formatDateString(row.complaint_date) : "",
          beneficiaryName: row.beneficiary_name || "",
          contactNumber: row.contact_number || "",
          village: row.village || "",
          block: row.block || "",
          district: row.district || "",
          product: row.product || "",
          make: row.make || "",
          systemVoltage: row.system_voltage || "",
          rating: row.rating || "",
          qty: row.qty || "",
          priority: row.rating || "",
          insuranceType: row.insurance_type || "",
          natureOfComplaint: row.nature_of_complaint || "",
          technicianName: row.technician_name || "",
          technicianContact: row.technician_contact || "",
          assigneeName: row.assignee_name || "",
          assigneeWhatsApp: row.assignee_whatsapp_number || "",
          location: row.location || "",
          complaintDetails: row.complaint_details || "",
          expectedCompletionDate: row.expected_completion_date ? formatDateString(row.expected_completion_date) : "",
          notesForTechnician: row.notes_for_technician || "",
          id: row.complaint_id || `COMP-${index + 1}`,
          fullRowData: row
        }))

        // Fetch history from Supabase Tracker table
        const { data: trackerData, error: trackerError } = await supabase
          .from("Tracker")
          .select("*")
          .order("id", { ascending: false })

        if (trackerError) throw trackerError

        const historyData = (trackerData || []).map((row) => ({
          id: row.serial_no || `TRACK-${row.id}`,
          timestamp: row.timestamp || "",
          attendId: row.serial_no || "",
          complaintNumber: row.complaint_id || "",
          technicianName: row.technician_name || "",
          beneficiaryName: row.beneficiary_name || "",
          contactNumber: row.contact_number || "",
          village: row.village || "",
          block: row.block || "",
          district: row.district || "",
          product: row.product || "",
          make: row.make || "",
          systemVoltage: row.system_voltage || "",
          natureOfComplaint: row.nature_of_complaint || "",
          uploadDocuments: row.upload_documents || "",
          geotagPhoto: row.geotag_photo || "",
          remarks: row.action_taken || "",
          trackerStatus: row.tracker_status || "",
          latitude: row.latitude || "",
          longitude: row.longitude || "",
          address: row.address || ""
        }))

        setPendingTasks(pendingData)
        setHistoryTasks(historyData)
      } catch (err) {
        console.error("Error fetching tasks data:", err)
        setError(err.message)
        setPendingTasks([])
        setHistoryTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    const fetchTechnicianOptions = async () => {
      try {
        const { data, error } = await supabase.from("Master").select("technician_name")
        if (error) throw error
        const options = data.map(r => r.technician_name).filter(Boolean)
        setTechnicianOptions([...new Set(options)].sort())
      } catch (err) {
        console.error("Error fetching technician options:", err)
        setTechnicianOptions([])
      }
    }

    fetchTasks()
    fetchTechnicianOptions()
  }, [])

  // All other functions remain the same...
  const uploadFileToDrive = async (file, fileType) => {
    if (!file) return null;
    try {
      setUploadStatus(`Uploading ${fileType}...`);
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("vendor_tracker")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("vendor_tracker").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error(`Error uploading ${fileType}:`, err);
      alert(`Failed to upload ${fileType}: ${err.message}`);
      return null;
    }
  };

  const handleUpdateTask = async () => {
    setIsSubmitting(true);

    try {
      const currentTasks = getCurrentTasks();
      const taskIndex = currentTasks.findIndex(t => t.id === selectedTask);
      if (taskIndex === -1) throw new Error("Task not found");

      const task = currentTasks[taskIndex];

      let documentUrl = null;
      let photoUrl = null;

      if (uploadedDocument) {
        setUploadStatus("Uploading document...");
        documentUrl = await uploadFileToDrive(uploadedDocument, "document");
      }

      if (uploadedPhoto) {
        setUploadStatus("Uploading photo...");
        photoUrl = await uploadFileToDrive(uploadedPhoto, "photo");
      }

      const completionDate = date ? date.toISOString().split('T')[0] : '';
      const remarks = document.getElementById('remarks').value;

      await submitToTrackerSheet(task, completionDate, remarks, documentUrl, photoUrl, status);

    // Update FMS status in Supabase
    try {
      const { error: fmsError } = await supabase
        .from("FMS")
        .update({ last_attend_status: status })
        .eq("complaint_id", task.complaintNumber)
      if (fmsError) console.warn("FMS status update failed (non-critical):", fmsError.message)
    } catch (fmsErr) {
      console.warn("FMS status update error (non-critical):", fmsErr)
    }

      if (status === "close_task") {
        setPendingTasks(prev =>
          prev.filter(task => task.id !== selectedTask)
        );
      }

      alert(`Task ${selectedTask} has been submitted successfully to Tracker sheet.`);
      setIsDialogOpen(false);

      setSelectedTask(null);
      setSelectedTaskData(null);
      setUploadedDocument(null);
      setUploadedPhoto(null);
      setDate(null);
      setStatus("pending");
      setTechnicianName("");

    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task: " + err.message);
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  const submitToTrackerSheet = async (task, completionDate, remarks, documentUrl, photoUrl, trackerStatus) => {
    try {
      // Generate RBPST serial number from Supabase
      const { data: lastRow } = await supabase
        .from("Tracker")
        .select("serial_no")
        .order("id", { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (lastRow && lastRow.length > 0 && lastRow[0].serial_no) {
        const num = parseInt(lastRow[0].serial_no.replace("RBPST-", "")) || 0
        nextNumber = num + 1
      }
      const attendId = `RBPST-${String(nextNumber).padStart(2, "0")}`

      const latitude = photoLocation ? photoLocation.latitude : null
      const longitude = photoLocation ? photoLocation.longitude : null
      const address = photoLocation ? photoLocation.formattedAddress : ""

      const { error } = await supabase.from("Tracker").insert([{
        timestamp: new Date(),
        serial_no: attendId,
        complaint_id: task.id || task.complaintNumber || "",
        technician_name: technicianName || task.technicianName || "",
        technician_number: task.technicianContact || "",
        beneficiary_name: task.beneficiaryName || "",
        contact_number: task.contactNumber || "",
        village: task.village || "",
        block: task.block || "",
        district: task.district || "",
        product: task.product || "",
        make: task.make || "",
        system_voltage: task.systemVoltage || "",
        nature_of_complaint: task.natureOfComplaint || "",
        upload_documents: documentUrl || "",
        geotag_photo: photoUrl || "",
        action_taken: remarks || "",
        tracker_status: trackerStatus || "pending",
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || ""
      }])

      if (error) throw error
      return true
    } catch (error) {
      console.error("❌ Tracker insert error:", error)
      throw error
    }
  };

  async function addLocationOverlayToImage(imageFile, latitude, longitude, address) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const minFontSize = 12;
          const maxFontSize = 24;

          const widthBasedSize = Math.floor(img.width / 25);
          const heightBasedSize = Math.floor(img.height / 15);
          const fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.min(widthBasedSize, heightBasedSize)));

          const lineHeight = fontSize + 6;
          const padding = Math.max(8, fontSize / 2);

          let numberOfLines = 2;
          if (address && address.trim() !== "") {
            numberOfLines = 3;
          }

          const calculatedHeight = (numberOfLines * lineHeight) + (2 * padding);
          const maxOverlayHeight = img.height * 0.5;
          const overlayHeight = Math.min(calculatedHeight, maxOverlayHeight);

          console.log("📐 Canvas dimensions:", canvas.width, "x", canvas.height);
          console.log("📏 Overlay height:", overlayHeight);
          console.log("🔤 Font size:", fontSize);
          console.log("📝 Number of lines:", numberOfLines);

          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

          ctx.fillStyle = "#fff";
          ctx.font = `bold ${fontSize}px Arial`;

          const textX = padding;
          let textY = canvas.height - overlayHeight + padding + fontSize;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          const latText = `Lat: ${latitude.toFixed(6)}`;
          ctx.fillText(latText, textX, textY);
          textY += lineHeight;

          const lngText = `Lng: ${longitude.toFixed(6)}`;
          ctx.fillText(lngText, textX, textY);

          if (address && address.trim() !== "" && numberOfLines === 3) {
            textY += lineHeight;

            let displayAddress = address;
            const maxTextWidth = canvas.width - (2 * padding);
            const avgCharWidth = fontSize * 0.6;
            const maxChars = Math.floor(maxTextWidth / avgCharWidth) - 2;

            if (ctx.measureText(displayAddress).width > maxTextWidth) {
              while (displayAddress.length > 5 && ctx.measureText(displayAddress + "...").width > maxTextWidth) {
                displayAddress = displayAddress.substring(0, displayAddress.length - 1);
              }
              displayAddress = displayAddress + "...";
            }

            ctx.fillText(displayAddress, textX, textY);
          }

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], imageFile.name, { type: "image/jpeg" }));
            } else {
              reject(new Error("Failed to create blob"));
            }
          }, "image/jpeg", 0.9);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedDocument(e.target.files[0]);
    }
  };

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      setIsCapturingLocation(true);
      setLocationError(null);

      try {
        const location = await getCurrentLocation();
        setPhotoLocation(location);
        console.log("📍 Location captured:", location);

        const processedPhoto = await addLocationOverlayToImage(
          file,
          location.latitude,
          location.longitude,
          location.formattedAddress
        );

        setUploadedPhoto(processedPhoto);
        setIsCapturingLocation(false);

        console.log("✅ Image updated with overlay text");

      } catch (error) {
        console.error("Location error:", error);
        setLocationError(error.message);
        setIsCapturingLocation(false);
        setUploadedPhoto(file);
      }
    }
  };

  const handleTechnicianSelect = (name) => {
    setTechnicianName(name);
    setShowTechnicianDropdown(false);
  };

  const handleEditRow = (task) => {
    setEditingRow(task.id);
    setEditedData({
      technicianName: task.technicianName || "",
      technicianContact: task.technicianContact || "",
      assigneeName: task.assigneeName || "",
      assigneeWhatsApp: task.assigneeWhatsApp || "",
      location: task.location || "",
      complaintDetails: task.complaintDetails || "",
      expectedCompletionDate: task.expectedCompletionDate || "",
      notesForTechnician: task.notesForTechnician || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitEdit = async (task) => {
    setIsSubmitting(true);
    try {
      const supabaseUpdates = {}
      if (editedData.technicianName !== undefined) supabaseUpdates.technician_name = editedData.technicianName
      if (editedData.technicianContact !== undefined) supabaseUpdates.technician_contact = editedData.technicianContact
      if (editedData.assigneeName !== undefined) supabaseUpdates.assignee_name = editedData.assigneeName
      if (editedData.assigneeWhatsApp !== undefined) supabaseUpdates.assignee_whatsapp_number = editedData.assigneeWhatsApp
      if (editedData.location !== undefined) supabaseUpdates.location = editedData.location
      if (editedData.complaintDetails !== undefined) supabaseUpdates.complaint_details = editedData.complaintDetails
      if (editedData.expectedCompletionDate !== undefined) supabaseUpdates.expected_completion_date = editedData.expectedCompletionDate
      if (editedData.notesForTechnician !== undefined) supabaseUpdates.notes_for_technician = editedData.notesForTechnician
      if (editedData.trackerStatus !== undefined) supabaseUpdates.last_attend_status = editedData.trackerStatus

      if (Object.keys(supabaseUpdates).length > 0) {
        const { error } = await supabase
          .from("FMS")
          .update(supabaseUpdates)
          .eq("complaint_id", task.complaintNumber)
        if (error) throw error
      }

      // Update local state
      const localUpdates = {}
      if (editedData.technicianName !== undefined) localUpdates.technicianName = editedData.technicianName
      if (editedData.technicianContact !== undefined) localUpdates.technicianContact = editedData.technicianContact
      if (editedData.assigneeName !== undefined) localUpdates.assigneeName = editedData.assigneeName
      if (editedData.assigneeWhatsApp !== undefined) localUpdates.assigneeWhatsApp = editedData.assigneeWhatsApp
      if (editedData.location !== undefined) localUpdates.location = editedData.location
      if (editedData.complaintDetails !== undefined) localUpdates.complaintDetails = editedData.complaintDetails
      if (editedData.expectedCompletionDate !== undefined) localUpdates.expectedCompletionDate = editedData.expectedCompletionDate
      if (editedData.notesForTechnician !== undefined) localUpdates.notesForTechnician = editedData.notesForTechnician
      if (editedData.trackerStatus !== undefined) localUpdates.trackerStatus = editedData.trackerStatus

      if (activeTab === "pending") {
        setPendingTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...localUpdates } : t))
      } else {
        setHistoryTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...localUpdates } : t))
      }
      setEditingRow(null)
      setEditedData({})
      alert("Task updated successfully!")
    } catch (err) {
      console.error("Error updating task:", err)
      alert("Failed to update task: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  };

  const getUniqueCompanyNames = (tasks) => {
    const companies = tasks
      .map(task => task.companyName)
      .filter(name => name && name.trim() !== "")
    return [...new Set(companies)].sort()
  }

  const getUniqueModeOfCalls = (tasks) => {
    const modes = tasks
      .map(task => task.modeOfCall)
      .filter(mode => mode && mode.trim() !== "")
    return [...new Set(modes)].sort()
  }

  const getUniqueTechnicianNames = (tasks) => {
    const technicians = tasks
      .map(task => task.technicianName)
      .filter(name => name && name.trim() !== "")
    return [...new Set(technicians)].sort()
  }

  // FIXED: Clean filtering logic - only search/filters, no user filtering here
  const filteredTasks = getCurrentTasks().filter(
    (task) => {
      const searchFields = [
        task.complaintNo,
        task.date,
        task.head,
        task.companyName,
        task.modeOfCall,
        task.idNumber,
        task.projectName,
        task.complaintNumber,
        task.complaintDate,
        task.beneficiaryName,
        task.contactNumber,
        task.village,
        task.block,
        task.district,
        task.product,
        task.make,
        task.systemVoltage,
        task.rating,
        task.qty,
        task.acDc,
        task.priority,
        task.insuranceType,
        task.natureOfComplaint,
        task.technicianName,
        task.technicianContact,
        task.assigneeName,
        task.assigneeWhatsApp,
        task.location,
        task.complaintDetails,
        task.expectedCompletionDate,
        task.notesForTechnician,
        task.id,
        task.assignee,
        task.technician,
        task.details,
        task.targetDate
      ]

      const normalizeText = (text) => {
        if (!text) return ""
        return text.toString().toLowerCase().trim()
      }

      const matchesSearch = () => {
        if (!searchTerm || searchTerm.trim() === "") return true

        const normalizedSearchTerm = normalizeText(searchTerm)
        const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0)

        return searchWords.every(word =>
          searchFields.some(field =>
            normalizeText(field).includes(word)
          )
        );
      }

      const matchesSearchTerm = matchesSearch()
      const matchesCompany = companyFilter === "" || task.companyName === companyFilter
      const matchesModeOfCall = modeOfCallFilter === "" || task.modeOfCall === modeOfCallFilter
      const matchesTechnician = technicianFilter === "" || task.technicianName === technicianFilter

      return matchesSearchTerm && matchesCompany && matchesModeOfCall && matchesTechnician
    }
  )

  const renderTableCell = (task, field, value) => {
    if (editingRow === task.id) {
      return (
        <td className="px-3 py-4 whitespace-nowrap">
          <input
            type="text"
            value={editedData[field] || value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </td>
      );
    }
    return (
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        {value}
      </td>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading technician tracker data...</div>
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
        <h1 className="text-2xl font-bold mb-6">Technician Tracker</h1>

        {/* FIXED: Tab counts now use filtered functions */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Pending ({getFilteredPendingTasks().length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              History ({getFilteredHistoryTasks().length})
            </button>
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search across all fields"
              className="pl-8 w-full sm:w-[280px] lg:w-[320px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2 h-6 w-6 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded-full hover:bg-gray-100"
                title="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              className="w-full sm:w-[160px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="">All Companies</option>
              {getUniqueCompanyNames(getCurrentTasks()).map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>

            <select
              className="w-full sm:w-[140px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={modeOfCallFilter}
              onChange={(e) => setModeOfCallFilter(e.target.value)}
            >
              <option value="">All Modes</option>
              {getUniqueModeOfCalls(getCurrentTasks()).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>

            <select
              className="w-full sm:w-[160px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
            >
              <option value="">All Technicians</option>
              {getUniqueTechnicianNames(getCurrentTasks()).map((technician) => (
                <option key={technician} value={technician}>
                  {technician}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            {filteredTasks.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">
                  {activeTab === "pending"
                    ? "No pending technician tasks found"
                    : "No technician history found"
                  }
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {activeTab === "pending" ? (
                      <>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Edit
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Complaint No.
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Complaint Number
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
                          System Voltage
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Rating
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Qty
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Priority
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Insurance Type
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Nature Of Complaint
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Complaint No.
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
                          Nature Of Complaint
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Upload Documents
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Geotag Photo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Remarks
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task, index) => (
                    <tr key={`${activeTab}-${task.id || task.complaintNo || task.attendId}-${index}`} className="hover:bg-gray-50">
                      {activeTab === "pending" ? (
                        <>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {editingRow === task.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSubmitEdit(task)}
                                  className="text-green-600 hover:text-green-800"
                                  disabled={isSubmitting}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditRow(task)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <button
                              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 border-0 py-1 px-3 rounded-md"
                              onClick={() => {
                                setSelectedTask(task.id)
                                setSelectedTaskData(task)
                                setIsDialogOpen(true)
                                setUploadedDocument(null)
                                setUploadedPhoto(null)
                                setPhotoLocation(null)
                                setLocationError(null)
                                setIsCapturingLocation(false)
                                setDate(null)
                                setStatus("pending")
                                setTechnicianName(task.technicianName || "")
                              }}
                            >
                              Update
                            </button>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.complaintNo}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.complaintNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{task.beneficiaryName}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.contactNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.village}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.block}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.district}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.product}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.make}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.systemVoltage}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.rating}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.qty}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            {task.priority && (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.insuranceType}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={task.natureOfComplaint}>
                            {task.natureOfComplaint}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.complaintNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.beneficiaryName}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.contactNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.village}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.block}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.district}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.product}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={task.natureOfComplaint}>
                            {task.natureOfComplaint}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            {task.uploadDocuments && (
                              <a href={task.uploadDocuments} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                View
                              </a>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            {task.geotagPhoto && (
                              <a href={task.geotagPhoto} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                View
                              </a>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={task.remarks}>
                            {task.remarks}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Update Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsDialogOpen(false)}></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Complaint Number: {selectedTaskData?.complaintNumber || selectedTask}
                      </h3>
                      <div className="mt-4 max-h-[60vh] overflow-auto">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <label htmlFor="technicianName" className="block text-sm font-medium text-gray-700">
                              Technician Name - तकनीशियन का नाम *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="technicianName"
                                className="w-full border border-gray-300 rounded-md py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Type or select a technician"
                                value={technicianName}
                                onChange={(e) => setTechnicianName(e.target.value)}
                                onFocus={() => setShowTechnicianDropdown(true)}
                              />
                              {showTechnicianDropdown && (
                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                  {technicianOptions.map((name, index) => (
                                    <div
                                      key={index}
                                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                      onClick={() => handleTechnicianSelect(name)}
                                    >
                                      {name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="status" className="block text-sm font-medium">
                              Tracker Status - ट्रैकर स्थिति
                            </label>
                            <select
                              id="status"
                              value={status}
                              onChange={(e) => setStatus(e.target.value)}
                              className="w-full border border-gray-300 rounded-md py-2 px-3"
                            >
                              <option value="in_progress">In Progress - प्रगति में</option>
                              <option value="insurance">Insurance - बीमा</option>
                              <option value="close_task">Close Task - कार्य बंद करें</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="remarks" className="block text-sm font-medium">
                              Remarks - टिप्पणियां
                            </label>
                            <textarea
                              id="remarks"
                              placeholder="Enter remarks about the task"
                              className="w-full border border-gray-300 rounded-md py-2 px-3"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="documents" className="block text-sm font-medium">
                              Upload Documents - दस्तावेज़ अपलोड करें
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id="documents"
                                type="file"
                                className="flex-1 border border-gray-300 rounded-md py-2 px-3"
                                onChange={handleDocumentChange}
                              />
                              <button
                                type="button"
                                className="p-2 border border-gray-300 rounded-md"
                                disabled={!uploadedDocument}
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                            </div>
                            {uploadedDocument && (
                              <div className="text-sm text-green-600">
                                Selected: {uploadedDocument.name}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="geotagPhoto" className="block text-sm font-medium">
                              Geotag Photo - जियोटैग फोटो
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id="geotagPhoto"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="flex-1 border border-gray-300 rounded-md py-2 px-3"
                                onChange={handlePhotoChange}
                              />
                              <button
                                type="button"
                                className="p-2 border border-gray-300 rounded-md"
                                disabled={!uploadedPhoto}
                              >
                                <MapPin className="h-4 w-4" />
                              </button>
                            </div>

                            {uploadedPhoto && (
                              <div className="text-sm text-green-600">
                                ✓ Selected: {uploadedPhoto.name}
                              </div>
                            )}

                            {isCapturingLocation && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Loader className="h-4 w-4 animate-spin" />
                                Capturing location...
                              </div>
                            )}

                            {photoLocation && !isCapturingLocation && (
                              <div className="text-sm text-green-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Location captured successfully
                                </div>
                                <div className="text-xs text-gray-600 ml-6">
                                  📍 Lat: {photoLocation.latitude.toFixed(6)},
                                  Lon: {photoLocation.longitude.toFixed(6)}
                                </div>
                                <div className="text-xs text-gray-500 ml-6 truncate">
                                  📌 {photoLocation.formattedAddress}
                                </div>
                              </div>
                            )}

                            {locationError && !isCapturingLocation && (
                              <div className="text-sm text-amber-600">
                                ⚠️ Location unavailable: {locationError}
                                <div className="text-xs text-gray-600 mt-1">
                                  Photo will be uploaded without location data
                                </div>
                              </div>
                            )}
                          </div>

                          {uploadStatus && (
                            <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-md">
                              {uploadStatus}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
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
                              Saving...
                            </>
                          ) : (
                            "Save Changes "
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
      </div>
    </DashboardLayout>
  )
}

export default TechnicianTracker
