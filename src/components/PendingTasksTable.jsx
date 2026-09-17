"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, Upload, MapPin, Loader, Edit, Check, X, Download, FileText } from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import supabase from "../utils/supabase"
import SearchableSelect from "./SearchableSelect"


function TrackerPendingTable() {
  const [pendingTasks, setPendingTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTaskData, setSelectedTaskData] = useState(null)
  const [date, setDate] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [status, setStatus] = useState("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadedDocument1, setUploadedDocument1] = useState(null)
  const [uploadedDocument2, setUploadedDocument2] = useState(null)
  const [uploadedDocument3, setUploadedDocument3] = useState(null)
  const [uploadedReport, setUploadedReport] = useState(null)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [modeOfCallFilter, setModeOfCallFilter] = useState("")
  const [technicianFilter, setTechnicianFilter] = useState("")
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [username, setUsername] = useState("")
  const [photoLocation, setPhotoLocation] = useState(null)
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  // ✅ Empty array - data sheet se hi fetch hoga
  const [trackerStatusOptions, setTrackerStatusOptions] = useState([]);


  // Form fields for tracker submission
  const [formData, setFormData] = useState({
    systemVoltage: "",
    natureOfComplaint: "",
    remarks: "",
    trackerStatus: ""
  })

  useEffect(() => {
    const u = localStorage.getItem("username") || ""
    const loggedInRole = localStorage.getItem('userRole')

    console.log('TrackerPendingTable - Retrieved from localStorage:', { username: u, userRole: loggedInRole })

    setUsername(u)

    if (loggedInRole) {
      setUserRole(loggedInRole)
    }
  }, [])

  const techDisplayName = (username || "").toLowerCase().startsWith("tech")
    ? (username || "").substring(4).trim()
    : ""

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec"

  const DRIVE_FOLDER_ID = "1-H5DWKRV2u_ueqtLX-ISTPvuySGYBLoT"

  // Location and address functions (from reference)
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
        reject(new Error("आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता"));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000, // ✅ 30 seconds timeout
        maximumAge: 10000, // ✅ Accept cached location up to 10 seconds old
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
            1: "लोकेशन की अनुमति नहीं है। कृपया सेटिंग्स में अनुमति दें।",
            2: "लोकेशन की जानकारी उपलब्ध नहीं है। कृपया GPS चालू करें।",
            3: "लोकेशन टाइमआउट। कृपया फिर से प्रयास करें।",
          };
          reject(
            new Error(errorMessages[error.code] || "लोकेशन एरर। कृपया फिर से प्रयास करें।")
          );
        },
        options
      );
    });
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

  // ✅ UPDATED: Call backend to generate unique serial number
const generateNextRBPSTId = async () => {
  try {
    const { data, error } = await supabase
      .from("Tracker")
      .select("serial_no")
      .order("id", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return "RBPT-001";
    }

    const lastId = data[0].serial_no;

    const numberPart = parseInt(lastId?.split("-")[1] || "0", 10);
    const newNumber = numberPart + 1;

    return `RBPT-${String(newNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("❌ Serial error:", error);
    return "RBPT-001";
  }
};

  const getPriorityColor = (priority) => {
    const priorityStr = priority ? priority.toString().toLowerCase() : ""

    switch (priorityStr) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-blue-500"
      case "low": return "bg-green-500"
      case "1": return "bg-red-500"
      case "2": return "bg-orange-500"
      case "3": return "bg-blue-500"
      case "4": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("FMS")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      const taskData = (data || [])
        .filter(
          (row) =>
            row.complaint_id &&
            row.status !== "APPROVED-CLOSE" &&
            (row.assign_to_vendor === false ||
              row.assign_to_vendor === null ||
              row.assign_to_vendor === undefined)
        )
        .map((row, index) => ({
          rowIndex: index + 1,
          complaintId: row.complaint_id,
          idNumber: row.id_number,
          technicianName: row.technician_name,
          technicianNumber: row.technician_contact,
          beneficiaryName: row.beneficiary_name,
          contactNumber: row.contact_number,
          village: row.village,
          block: row.block,
          district: row.district,
          product: row.product,
          make: row.make,
          systemVoltage: row.system_voltage || row.rating || "",
          natureOfComplaint: row.nature_of_complaint,
          ContollerRIDNo: row.controller_rid_no,
          ProductSLNo: row.product_sl_no,
          ChallanDate: row.challan_date,
          CloseDate: row.close_date || row.resolved_date,
          timestamp: row.timestamp,
          date: row.complaint_date,
          head: row.timestamp,
          companyName: row.company_name,
          modeOfCall: row.mode_of_call,
          priority: row.rating,
          id: row.complaint_id,
        }));

      setPendingTasks(taskData);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
      setError(err.message);
      setPendingTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTechnicianOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("Master")
        .select("technician_name")
        .not("technician_name", "is", null);

      if (error) throw error;

      const options = (data || [])
        .map((item) => item.technician_name)
        .filter(Boolean);

      setTechnicianOptions([...new Set(options)].sort());
    } catch (err) {
      console.error("❌ Error fetching technician options:", err);
      setTechnicianOptions([]);
    }
  };

  const fetchTrackerStatusOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("Master")
        .select("tracker_status")
        .not("tracker_status", "is", null);

      if (error) throw error;

      const statusOptions = (data || [])
        .map((row) => row.tracker_status)
        .filter(Boolean);

      const uniqueOptions = [...new Set(statusOptions)];

      const mappedOptions = uniqueOptions.map((status) => ({
        label: status,
        value: status.toLowerCase().replace(/[^a-z0-9]/g, ""),
      }));

      setTrackerStatusOptions(mappedOptions);
    } catch (err) {
      console.error("❌ Error fetching tracker status:", err);
    }
  };

  useEffect(() => {
    console.log('🚀 Component mounted - Starting parallel data fetch for high performance...');
    // ✅ Parallel execution of all 3 queries for maximum speed
    Promise.all([
      fetchTasks(),
      fetchTechnicianOptions(),
      fetchTrackerStatusOptions(),
    ]);
  }, []);




 const uploadFileToDrive = async (file, fileType) => {
  if (!file) return null;

  try {
    setUploadStatus(`Uploading ${fileType}...`);

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("vendor_tracker")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("vendor_tracker")
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    console.error(`❌ Upload error:`, err);
    alert(`Failed to upload ${fileType}`);
    return null;
  }
};

  // ✅ UPDATED: Better image overlay with error handling
  async function addLocationOverlayToImage(imageFile, latitude, longitude, address) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      const timeoutId = setTimeout(() => {
        reject(new Error("Image loading timeout"));
      }, 10000); // ✅ 10 second timeout

      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const minFontSize = 14; // ✅ Slightly larger minimum
          const maxFontSize = 28;

          const widthBasedSize = Math.floor(img.width / 25);
          const heightBasedSize = Math.floor(img.height / 15);
          const fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.min(widthBasedSize, heightBasedSize)));

          const lineHeight = fontSize + 8; // ✅ Better spacing
          const padding = Math.max(10, fontSize / 2);

          let numberOfLines = 2;
          if (address && address.trim() !== "") {
            numberOfLines = 3;
          }

          const calculatedHeight = (numberOfLines * lineHeight) + (2 * padding);
          const maxOverlayHeight = img.height * 0.5;
          const overlayHeight = Math.min(calculatedHeight, maxOverlayHeight);

          // ✅ Darker overlay for better visibility
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

          ctx.fillStyle = "#fff";
          ctx.font = `bold ${fontSize}px Arial`;

          const textX = padding;
          let textY = canvas.height - overlayHeight + padding + fontSize;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          const latText = `📍 Lat: ${latitude.toFixed(6)}`;
          ctx.fillText(latText, textX, textY);
          textY += lineHeight;

          const lngText = `📍 Lng: ${longitude.toFixed(6)}`;
          ctx.fillText(lngText, textX, textY);

          if (address && address.trim() !== "" && numberOfLines === 3) {
            textY += lineHeight;

            let displayAddress = address;
            const maxTextWidth = canvas.width - (2 * padding);

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
              reject(new Error("Failed to create image blob"));
            }
          }, "image/jpeg", 0.92); // ✅ Slightly better quality

        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  const handleUpdateTask = async () => {
    setIsSubmitting(true);

    try {
      const taskIndex = pendingTasks.findIndex((t) => t.id === selectedTask);
      if (taskIndex === -1) throw new Error("Task not found");

      const task = pendingTasks[taskIndex];

      let docUrl1 = null;
      let docUrl2 = null;
      let docUrl3 = null;
      let reportUrl = null;
      let photoUrl = null;

      if (uploadedDocument1) {
        setUploadStatus("Uploading document 1...");
        docUrl1 = await uploadFileToDrive(uploadedDocument1, "document 1");
      }

      if (uploadedDocument2) {
        setUploadStatus("Uploading document 2...");
        docUrl2 = await uploadFileToDrive(uploadedDocument2, "document 2");
      }

      if (uploadedDocument3) {
        setUploadStatus("Uploading document 3...");
        docUrl3 = await uploadFileToDrive(uploadedDocument3, "document 3");
      }

      if (uploadedReport) {
        setUploadStatus("Uploading report...");
        reportUrl = await uploadFileToDrive(uploadedReport, "report");
      }

      if (uploadedPhoto) {
        setUploadStatus("Uploading photo...");
        photoUrl = await uploadFileToDrive(uploadedPhoto, "photo");
      }

      // Generate RBPST ID
      const serialNo = await generateNextRBPSTId();

      // Submit to Tracker sheet
      await submitToTrackerSheet(task, serialNo, docUrl1, docUrl2, docUrl3, reportUrl, photoUrl);

      // Remove from pending tasks if completed
      if (formData.trackerStatus === "completed") {
        setPendingTasks((prev) => prev.filter((task) => task.id !== selectedTask));
      }

      alert(`Task ${selectedTask} has been updated successfully to Tracker sheet.`);
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task: " + err.message);
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  const submitToTrackerSheet = async (task, serialNo, docUrl1, docUrl2, docUrl3, reportUrl, photoUrl) => {
    try {
      const now = new Date();

      const latitude = photoLocation ? photoLocation.latitude : null;
      const longitude = photoLocation ? photoLocation.longitude : null;
      const address = photoLocation ? photoLocation.formattedAddress : "";

      const selectedStatusOption = trackerStatusOptions.find(
        (option) => option.value === formData.trackerStatus
      );

      const trackerStatusValue = selectedStatusOption
        ? selectedStatusOption.label
        : formData.trackerStatus;

      const allDocs = [docUrl1, docUrl2, docUrl3].filter(Boolean);
      const combinedDocs = allDocs.length > 0 ? allDocs.join(", ") : null;

      const payload = {
        timestamp: now,
        serial_no: serialNo,
        complaint_id: task.complaintId,
        technician_name: task.technicianName,
        technician_number: task.technicianNumber,
        beneficiary_name: task.beneficiaryName,
        contact_number: task.contactNumber,
        village: task.village,
        block: task.block,
        district: task.district,
        product: task.product,
        make: task.make,
        system_voltage: formData.systemVoltage,
        nature_of_complaint: formData.natureOfComplaint,
        upload_documents: combinedDocs,
        upload_documents_1: docUrl1 || null,
        upload_documents_2: docUrl2 || null,
        upload_documents_3: docUrl3 || null,
        report_upload: reportUrl || null,
        geotag_photo: photoUrl,
        action_taken: formData.remarks,
        tracker_status: trackerStatusValue,
        latitude,
        longitude,
        address,
      };

      let { error } = await supabase.from("Tracker").insert([payload]);

      if (error) {
        console.warn("Tracker insert with specific columns failed, falling back:", error.message);
        // Fallback for when specific columns are not yet added in Supabase
        const fallbackPayload = {
          timestamp: now,
          serial_no: serialNo,
          complaint_id: task.complaintId,
          technician_name: task.technicianName,
          technician_number: task.technicianNumber,
          beneficiary_name: task.beneficiaryName,
          contact_number: task.contactNumber,
          village: task.village,
          block: task.block,
          district: task.district,
          product: task.product,
          make: task.make,
          system_voltage: formData.systemVoltage,
          nature_of_complaint: formData.natureOfComplaint,
          upload_documents: combinedDocs,
          geotag_photo: photoUrl,
          action_taken: formData.remarks + (reportUrl ? ` | Report: ${reportUrl}` : ""),
          tracker_status: trackerStatusValue,
          latitude,
          longitude,
          address,
        };
        const fallbackRes = await supabase.from("Tracker").insert([fallbackPayload]);
        if (fallbackRes.error) throw fallbackRes.error;
      }

      return true;
    } catch (error) {
      console.error("❌ Supabase insert error:", error);
      throw error;
    }
  };

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      setIsCapturingLocation(true);
      setLocationError(null);
      setUploadedPhoto(null);

      try {
        console.log("📍 Starting location capture...");
        const location = await getCurrentLocation();
        setPhotoLocation(location);
        console.log("✅ Location captured:", location);

        console.log("🖼️ Processing image with location overlay...");
        const processedPhoto = await addLocationOverlayToImage(
          file,
          location.latitude,
          location.longitude,
          location.formattedAddress
        );

        setUploadedPhoto(processedPhoto);
        setIsCapturingLocation(false);
        console.log("✅ Image successfully processed with location");
      } catch (error) {
        console.error("❌ Location/Image error:", error);
        setLocationError(error.message);
        setIsCapturingLocation(false);
        setUploadedPhoto(file);
        setPhotoLocation(null);
        alert(`लोकेशन कैप्चर नहीं हो पाई: ${error.message}\n\nफोटो बिना लोकेशन के अपलोड होगी।`);
      }
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      systemVoltage: "",
      remarks: "",
      trackerStatus: "pending",
    });
    setUploadedDocument1(null);
    setUploadedDocument2(null);
    setUploadedDocument3(null);
    setUploadedReport(null);
    setUploadedPhoto(null);
    setDate(null);
    setPhotoLocation(null);
    setLocationError(null);
    setIsCapturingLocation(false);
  };

  const handleTaskSelection = (task) => {
    setSelectedTask(task.id);
    setSelectedTaskData(task);
    setIsDialogOpen(true);

    setFormData((prevData) => ({
      ...prevData,
      systemVoltage: task.systemVoltage || "",
      natureOfComplaint: task.natureOfComplaint || "",
      remarks: "",
      trackerStatus: "pending",
    }));
  };

  // ✅ Export to Excel function
  const exportToExcel = () => {
    if (!filteredTasks || filteredTasks.length === 0) {
      alert("No data available to export");
      return;
    }

    try {
      const exportData = filteredTasks.map((task, index) => ({
        "S.No": index + 1,
        "Complaint ID": task.complaintId || "",
        "ID Number": task.idNumber || "",
        "Date": formatDateString(task.date) || "",
        "Company Name": task.companyName || "",
        "Mode of Call": task.modeOfCall || "",
        "Beneficiary Name": task.beneficiaryName || "",
        "Contact Number": task.contactNumber || "",
        "Village": task.village || "",
        "Block": task.block || "",
        "District": task.district || "",
        "Product": task.product || "",
        "Make": task.make || "",
        "System Voltage": task.systemVoltage || "",
        "Nature of Complaint": task.natureOfComplaint || "",
        "Technician Name": task.technicianName || "",
        "Technician Contact": task.technicianNumber || "",
        "Priority": task.priority || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Tasks");

      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 12),
      }));
      worksheet["!cols"] = colWidths;

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Tracker_Pending_Tasks_${dateStr}.xlsx`);
    } catch (err) {
      console.error("Export to Excel failed:", err);
      alert("Failed to export Excel file: " + err.message);
    }
  };

  // ✅ Export to PDF function
  const exportToPDF = () => {
    if (!filteredTasks || filteredTasks.length === 0) {
      alert("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const dateStr = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("Tracker Pending Tasks", 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on: ${dateStr} | Total Records: ${filteredTasks.length}`, 40, 56);

      const tableColumns = [
        "#",
        "Complaint ID",
        "ID Number",
        "Company",
        "Beneficiary",
        "Contact",
        "District",
        "Block",
        "Product",
        "Technician",
        "Nature of Complaint",
      ];

      const tableRows = filteredTasks.map((task, index) => [
        index + 1,
        task.complaintId || "-",
        task.idNumber || "-",
        task.companyName || "-",
        task.beneficiaryName || "-",
        task.contactNumber || "-",
        task.district || "-",
        task.block || "-",
        task.product || "-",
        task.technicianName || "-",
        (task.natureOfComplaint || "-").length > 35
          ? (task.natureOfComplaint || "-").substring(0, 35) + "..."
          : (task.natureOfComplaint || "-"),
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 70,
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
        columnStyles: {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 65, fontStyle: "bold" },
          2: { cellWidth: 60 },
          3: { cellWidth: 70 },
          4: { cellWidth: 80 },
          5: { cellWidth: 65 },
          6: { cellWidth: 60 },
          7: { cellWidth: 55 },
          8: { cellWidth: 65 },
          9: { cellWidth: 70 },
          10: { cellWidth: "auto" },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { left: 40, right: 40 },
        styles: {
          overflow: "linebreak",
          cellPadding: 4,
        },
      });

      const fileDate = new Date().toISOString().split("T")[0];
      doc.save(`Tracker_Pending_Tasks_${fileDate}.pdf`);
    } catch (err) {
      console.error("Export to PDF failed:", err);
      alert("Failed to export PDF file: " + err.message);
    }
  };

  // ✅ Memoized filter lists for high speed
  const uniqueCompanies = useMemo(() => {
    const companies = pendingTasks
      .map((task) => task.companyName)
      .filter((name) => name && name.trim() !== "");
    return [...new Set(companies)].sort();
  }, [pendingTasks]);

  const uniqueModeOfCalls = useMemo(() => {
    const modes = pendingTasks
      .map((task) => task.modeOfCall)
      .filter((mode) => mode && mode.trim() !== "");
    return [...new Set(modes)].sort();
  }, [pendingTasks]);

  const uniqueTechnicians = useMemo(() => {
    const technicians = pendingTasks
      .map((task) => task.technicianName)
      .filter((name) => name && name.trim() !== "");
    return [...new Set(technicians)].sort();
  }, [pendingTasks]);

  // Role-based filtering
  const tasksFilteredByRole = useMemo(() => {
    if (!userRole) return pendingTasks;
    const lowerRole = String(userRole || "").toLowerCase();
    if (lowerRole === "admin") return pendingTasks;

    if ((lowerRole === "tech" || lowerRole === "user") && username) {
      return pendingTasks.filter(
        (task) => String(task.technicianName || "").toLowerCase() === String(username || "").toLowerCase()
      );
    }

    if ((lowerRole === "tech" || lowerRole === "user") && !username) {
      return [];
    }

    return pendingTasks;
  }, [pendingTasks, userRole, username]);

  // Search & column filtering
  const filteredTasks = useMemo(() => {
    return tasksFilteredByRole.filter((task) => {
      const searchFields = [
        task.complaintId,
        task.technicianName,
        task.beneficiaryName,
        task.contactNumber,
        task.village,
        task.block,
        task.district,
        task.product,
        task.make,
        task.companyName,
        task.modeOfCall,
      ];

      const normalizeText = (text) => (text ? text.toString().toLowerCase().trim() : "");

      const matchesSearch = () => {
        if (!searchTerm || searchTerm.trim() === "") return true;
        const searchWords = normalizeText(searchTerm).split(/\s+/).filter((w) => w.length > 0);
        return searchWords.every((word) =>
          searchFields.some((field) => normalizeText(field).includes(word))
        );
      };

      const matchesCompany = companyFilter === "" || task.companyName === companyFilter;
      const matchesModeOfCall = modeOfCallFilter === "" || task.modeOfCall === modeOfCallFilter;
      const matchesTechnician = technicianFilter === "" || task.technicianName === technicianFilter;

      return matchesSearch() && matchesCompany && matchesModeOfCall && matchesTechnician;
    });
  }, [tasksFilteredByRole, searchTerm, companyFilter, modeOfCallFilter, technicianFilter]);

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading tasks data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Tracker Pending Tasks</h1>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Export to Excel & PDF buttons */}
          <button
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors duration-150"
            title="Export filtered data to Excel"
          >
            <Download className="h-4 w-4" />
            <span>Excel Export</span>
          </button>
          <button
            type="button"
            onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors duration-150"
            title="Export filtered data to PDF"
          >
            <FileText className="h-4 w-4" />
            <span>PDF Export</span>
          </button>

          <div className="relative flex-1 sm:flex-initial">
            <input
              type="search"
              placeholder="Search across all fields..."
              className="pl-8 w-full sm:w-[220px] lg:w-[260px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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

          <div className="w-full sm:w-[160px]">
            <SearchableSelect
              placeholder="All Companies"
              allOptionLabel="All Companies"
              options={uniqueCompanies}
              value={companyFilter}
              onChange={(val) => setCompanyFilter(val)}
            />
          </div>

          <div className="w-full sm:w-[140px]">
            <SearchableSelect
              placeholder="All Modes"
              allOptionLabel="All Modes"
              options={uniqueModeOfCalls}
              value={modeOfCallFilter}
              onChange={(val) => setModeOfCallFilter(val)}
            />
          </div>

          <div className="w-full sm:w-[160px]">
            <SearchableSelect
              placeholder="All Technicians"
              allOptionLabel="All Technicians"
              options={uniqueTechnicians}
              value={technicianFilter}
              onChange={(val) => setTechnicianFilter(val)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredTasks.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No pending tracker tasks found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredTasks.map((task, index) => (
                  <div key={task.complaintId || index} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{task.complaintId}</span>
                      {task.priority && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Beneficiary</span>
                        <span className="text-gray-900 font-medium">{task.beneficiaryName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Contact</span>
                        <span className="text-gray-900">{task.contactNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Village</span>
                        <span className="text-gray-900">{task.village}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Block</span>
                        <span className="text-gray-900">{task.block}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">District</span>
                        <span className="text-gray-900">{task.district}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Complaint ID</span>
                        <span className="text-gray-900 font-medium">{task.complaintId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">ID Number</span>
                        <span className="text-gray-900 font-medium">{task.idNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Product</span>
                        <span className="text-gray-900 font-medium">{task.product}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button
                          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 border-0 py-2 px-3 rounded-md text-sm font-medium"
                          onClick={() => handleTaskSelection(task)}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Actions
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Auto Complaint ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          ID Number
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Beneficiary Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Contact Number
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Village
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Block
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          District
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Product
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">
                          Rating
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">Contoller RID No.</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">Product SL No.</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">Challan Date </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-100">Close Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTasks.map((task, index) => (
                        <tr key={task.complaintId || index} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <button
                              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 border-0 py-1 px-3 rounded-md"
                              onClick={() => handleTaskSelection(task)}
                            >
                              Update
                            </button>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{task.complaintId}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{task.idNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.beneficiaryName}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.contactNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.village}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.block}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.district}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.product}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            {task.priority && (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.ContollerRIDNo}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.ProductSLNo}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.ChallanDate}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">{task.CloseDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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


                    {selectedTaskData && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">

                        <div className="grid grid-cols-2 gap-4">

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">शिकायत आईडी</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-600"
                              value={selectedTaskData.complaintId}
                              readOnly
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">तकनीशियन का नाम</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-600"
                              value={selectedTaskData.technicianName}
                              readOnly
                            />
                          </div>



                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">लाभार्थी का नाम</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-600"
                              value={selectedTaskData.beneficiaryName}
                              readOnly
                            />
                          </div>



                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">गाँव</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-600"
                              value={selectedTaskData.village}
                              readOnly
                            />
                          </div>



                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">जिला</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-600"
                              value={selectedTaskData.district}
                              readOnly
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">उत्पाद</label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-600"
                              value={selectedTaskData.product}
                              readOnly
                            />
                          </div>


                        </div>
                      </div>
                    )}


                    <div className="mt-4 max-h-[60vh] overflow-auto">
                      <h4 className="font-medium text-gray-700 mb-4">ट्रैकर फॉर्म फील्ड्स</h4>
                      <div className="grid gap-4">



                        <div className="space-y-2">
                          <label htmlFor="trackerStatus" className="block text-sm font-medium text-gray-700">
                            ट्रैकर स्थिति (Tracker Status)
                          </label>
                          <select
                            id="trackerStatus"
                            name="trackerStatus"
                            value={formData.trackerStatus}
                            onChange={(e) => handleFormChange("trackerStatus", e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                          >
                            <option value="">Select Status</option>
                            {trackerStatusOptions.map((option, index) => (
                              <option key={index} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>


                        {/* Nature of Complaint - Auto-filled from FMS, Read Only */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            शिकायत की प्रकृति (Auto-filled from FMS)
                          </label>
                          <textarea
                            name="natureOfComplaint"
                            value={formData.natureOfComplaint}
                            readOnly
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                            placeholder="Auto-filled from FMS data..."
                          />
                        </div>


                        {/* दस्तावेज़ अपलोड करें 1 */}
                        <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <label htmlFor="documents1" className="block text-sm font-medium text-gray-700">
                            दस्तावेज़ अपलोड करें 1
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="documents1"
                              type="file"
                              className="flex-1 text-sm border border-gray-300 rounded-md py-1.5 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedDocument1(e.target.files[0]);
                                }
                              }}
                            />
                            {uploadedDocument1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedDocument1(null);
                                  const el = document.getElementById("documents1");
                                  if (el) el.value = "";
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-500 border border-gray-300 rounded-md bg-white hover:bg-red-50 transition-colors"
                                title="हटाएं"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {uploadedDocument1 && (
                            <div className="text-xs text-green-600 font-medium">
                              ✓ चयनित: {uploadedDocument1.name}
                            </div>
                          )}
                        </div>

                        {/* दस्तावेज़ अपलोड करें 2 */}
                        <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <label htmlFor="documents2" className="block text-sm font-medium text-gray-700">
                            दस्तावेज़ अपलोड करें 2
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="documents2"
                              type="file"
                              className="flex-1 text-sm border border-gray-300 rounded-md py-1.5 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedDocument2(e.target.files[0]);
                                }
                              }}
                            />
                            {uploadedDocument2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedDocument2(null);
                                  const el = document.getElementById("documents2");
                                  if (el) el.value = "";
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-500 border border-gray-300 rounded-md bg-white hover:bg-red-50 transition-colors"
                                title="हटाएं"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {uploadedDocument2 && (
                            <div className="text-xs text-green-600 font-medium">
                              ✓ चयनित: {uploadedDocument2.name}
                            </div>
                          )}
                        </div>

                        {/* दस्तावेज़ अपलोड करें 3 */}
                        <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <label htmlFor="documents3" className="block text-sm font-medium text-gray-700">
                            दस्तावेज़ अपलोड करें 3
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="documents3"
                              type="file"
                              className="flex-1 text-sm border border-gray-300 rounded-md py-1.5 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedDocument3(e.target.files[0]);
                                }
                              }}
                            />
                            {uploadedDocument3 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedDocument3(null);
                                  const el = document.getElementById("documents3");
                                  if (el) el.value = "";
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-500 border border-gray-300 rounded-md bg-white hover:bg-red-50 transition-colors"
                                title="हटाएं"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {uploadedDocument3 && (
                            <div className="text-xs text-green-600 font-medium">
                              ✓ चयनित: {uploadedDocument3.name}
                            </div>
                          )}
                        </div>

                        {/* Report upload */}
                        <div className="space-y-1.5 p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                          <label htmlFor="reportUpload" className="block text-sm font-medium text-blue-900">
                            Report upload (रिपोर्ट अपलोड करें)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="reportUpload"
                              type="file"
                              className="flex-1 text-sm border border-blue-300 rounded-md py-1.5 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedReport(e.target.files[0]);
                                }
                              }}
                            />
                            {uploadedReport && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedReport(null);
                                  const el = document.getElementById("reportUpload");
                                  if (el) el.value = "";
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-500 border border-blue-300 rounded-md bg-white hover:bg-red-50 transition-colors"
                                title="हटाएं"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {uploadedReport && (
                            <div className="text-xs text-blue-700 font-medium">
                              ✓ चयनित रिपोर्ट: {uploadedReport.name}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="geotagPhoto" className="block text-sm font-medium text-gray-700">
                            जियोटैग फोटो
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
                              ✓ चयनित: {uploadedPhoto.name}
                            </div>
                          )}

                          {isCapturingLocation && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Loader className="h-4 w-4 animate-spin" />
                              स्थान कैप्चर किया जा रहा है...
                            </div>
                          )}

                          {photoLocation && !isCapturingLocation && (
                            <div className="text-sm text-green-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                स्थान सफलतापूर्वक कैप्चर किया गया
                              </div>
                              <div className="text-xs text-gray-600 ml-6">
                                📍 अक्षांश: {photoLocation.latitude.toFixed(6)},
                                देशांतर: {photoLocation.longitude.toFixed(6)}
                              </div>
                              <div className="text-xs text-gray-500 ml-6 truncate">
                                📌 {photoLocation.formattedAddress}
                              </div>
                            </div>
                          )}

                          {locationError && !isCapturingLocation && (
                            <div className="text-sm text-amber-600">
                              ⚠️ स्थान उपलब्ध नहीं है: {locationError}
                              <div className="text-xs text-gray-600 mt-1">
                                फोटो बिना स्थान डेटा के अपलोड की जाएगी
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                            की गई कार्रवाई
                          </label>
                          <textarea
                            id="remarks"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            value={formData.remarks}
                            onChange={(e) => handleFormChange('remarks', e.target.value)}
                            placeholder="की गई कार्रवाई दर्ज करें"
                          />
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
                        रद्द करें
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
                            सहेजा जा रहा है...
                          </>
                        ) : (
                          "परिवर्तन सहेजें"
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
  )
}

export default TrackerPendingTable

