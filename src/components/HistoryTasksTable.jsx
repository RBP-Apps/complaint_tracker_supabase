


"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Calendar, Upload, MapPin, Loader, Edit, Check, X, Download, FileText, RefreshCw } from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import supabase from "../utils/supabase"

function TrackerHistoryTable({ exportRef }) {
  const [historyData, setHistoryData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState(null)

  // Edit popup states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedDocument, setUploadedDocument] = useState(null)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [photoLocation, setPhotoLocation] = useState(null)
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [trackerStatusOptions, setTrackerStatusOptions] = useState([])

  // Form data for editing
  const [formData, setFormData] = useState({
    systemVoltage: "",
    natureOfComplaint: "",
    remarks: "",
    trackerStatus: ""
  })



  useEffect(() => {
    const u = localStorage.getItem("username") || ""
    const loggedInRole = localStorage.getItem('userRole')

    console.log('TrackerHistoryTable - Retrieved from localStorage:', { username: u, userRole: loggedInRole })

    setUsername(u)

    if (loggedInRole) {
      setUserRole(loggedInRole)
    }
  }, [])

  const techDisplayName = (username || "").toLowerCase().startsWith("tech")
    ? (username || "").substring(4).trim()
    : ""

  // Location and address functions
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
        reject(new Error("Geolocation is not supported by this browser"));
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
            1: "Location access denied. Please enable location services.",
            2: "Location information is unavailable.",
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

  useEffect(() => {
const fetchTrackerStatusOptions = async () => {
  try {
    const { data, error } = await supabase
      .from("Master")
      .select("tracker_status");

    if (error) throw error;

    const options = data
      .map((row) => row.tracker_status)
      .filter(Boolean);

    setTrackerStatusOptions([...new Set(options)]);
  } catch (err) {
    console.error("❌ Error fetching tracker status options:", err);
    setTrackerStatusOptions([]);
  }
};

    fetchTrackerStatusOptions()
  }, [])

  // Function to format date string to dd/mm/yyyy
  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    // Handle ISO string format (2025-05-22T07:38:28.052Z)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    }
    // Handle date format (2025-05-21)
    else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets format like "5/22/2025, 2:32:51 PM"
    else if (typeof dateValue === 'string' && dateValue.includes('/') && dateValue.includes(',')) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets Date constructor format like "Date(2025,4,21)" or "Date(2025,4,22,14,32,51)"
    else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      // Extract the date parts from "Date(2025,4,21)" or "Date(2025,4,22,14,32,51)" format
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]); // Month is 0-indexed in this format
        const day = parseInt(match[3]);
        // Optional time components
        const hours = match[4] ? parseInt(match[4]) : 0;
        const minutes = match[5] ? parseInt(match[5]) : 0;
        const seconds = match[6] ? parseInt(match[6]) : 0;
        date = new Date(year, month, day, hours, minutes, seconds);
      } else {
        return dateValue;
      }
    }
    // Handle if it's already a Date object
    else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    }
    else {
      return dateValue; // Return as is if not a recognizable date format
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateValue; // Return original value if invalid date
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Upload file functions
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




  // Image location overlay function
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

          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.fillRect(0, canvas.width - overlayHeight, canvas.width, overlayHeight);

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

  // Instant cache load (Stale-While-Revalidate)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("tracker_history_tasks_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryData(parsed);
          setIsLoading(false);
        }
      }
    } catch (e) {
      console.warn("Failed to load cached history tasks:", e);
    }
  }, []);

  const fetchHistoryData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    setError(null);

    try {
      // ✅ Parallel execution of Tracker and FMS for 2x faster loading
      const [trackerRes, fmsRes] = await Promise.all([
        supabase
          .from("Tracker")
          .select(`
            id,
            serial_no,
            complaint_id,
            technician_name,
            technician_number,
            beneficiary_name,
            contact_number,
            village,
            block,
            district,
            product,
            make,
            system_voltage,
            nature_of_complaint,
            upload_documents,
            geotag_photo,
            action_taken,
            tracker_status,
            latitude,
            longitude,
            address
          `)
          .order("id", { ascending: false }),
        supabase
          .from("FMS")
          .select("complaint_id, id_number, status, attend")
      ]);

      if (trackerRes.error) throw trackerRes.error;
      if (fmsRes.error) throw fmsRes.error;

      const trackerData = trackerRes.data || [];
      const fmsData = fmsRes.data || [];

      // Map FMS data for fast O(1) lookup
      const fmsMap = new Map();
      fmsData.forEach((row) => {
        fmsMap.set(row.complaint_id, {
          idNumber: row.id_number,
          status: row.status,
          attendDate: row.attend,
        });
      });

      const recordsData = trackerData.map((row) => {
        const fmsInfo = fmsMap.get(row.complaint_id) || {};

        return {
          actualRowNumber: row.id,
          serialNo: row.serial_no,
          complaintId: row.complaint_id,
          idNumber: fmsInfo.idNumber || "-",

          technicianName: row.technician_name,
          technicianNumber: row.technician_number,
          beneficiaryName: row.beneficiary_name,
          contactNumber: row.contact_number,

          village: row.village,
          block: row.block,
          district: row.district,

          product: row.product,
          make: row.make,

          systemVoltage: row.system_voltage,
          natureOfComplaint: row.nature_of_complaint,

          uploadDocuments: row.upload_documents,
          geotagPhoto: row.geotag_photo,

          remarks: row.action_taken,
          trackerStatus: row.tracker_status,

          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,

          status: fmsInfo.status,
          attendDate: fmsInfo.attendDate,

          hasDriveUrl: {
            uploadDocuments: !!row.upload_documents,
            geotagPhoto: !!row.geotag_photo,
          },
        };
      });

      setHistoryData(recordsData);
      try {
        sessionStorage.setItem("tracker_history_tasks_cache", JSON.stringify(recordsData));
      } catch (cacheErr) {
        // Ignore cache storage errors
      }

    } catch (err) {
      console.error("❌ Error fetching history:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hasCache = !!sessionStorage.getItem("tracker_history_tasks_cache");
    fetchHistoryData(hasCache);
  }, []);

  // Role-based filtering function
  const getFilteredHistoryByRole = () => {
    console.log('TrackerHistoryTable - Filtering with user:', username, 'role:', userRole)

    // If no role is set, show all history
    if (!userRole) {
      console.log('TrackerHistoryTable - No role set, showing all history')
      return historyData;
    }

    // If admin, show all history
    const lowerRole = String(userRole || "").toLowerCase();
    if (lowerRole === 'admin') {
      console.log('TrackerHistoryTable - Admin role, showing all history')
      return historyData;
    }

    // If tech or user role and has username, filter by technician name
    if ((lowerRole === 'tech' || lowerRole === 'user') && username) {
      console.log(`TrackerHistoryTable - ${lowerRole} role, filtering by technician name:`, username)
      const filtered = historyData.filter((record) => {
        const match = String(record.technicianName || "").toLowerCase() === String(username || "").toLowerCase();
        return match;
      });
      console.log('TrackerHistoryTable - Filtered history count:', filtered.length)
      return filtered;
    }

    // If tech/user role but no username, show empty
    if ((lowerRole === 'tech' || lowerRole === 'user') && !username) {
      console.log(`TrackerHistoryTable - ${lowerRole} role but no username, showing empty`)
      return [];
    }

    // Default: show all history
    console.log('TrackerHistoryTable - Default, showing all history')
    return historyData;
  }

  const filteredData = getFilteredHistoryByRole().filter((record) => {
    const matchesSearch = !searchTerm || (
      record.serialNo?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.complaintId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.technicianName?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.beneficiaryName?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )

    // For history, we want records that have been completed/processed
    const isHistoryRecord = record.trackerStatus && record.trackerStatus.toString().trim() !== ""

    return matchesSearch && isHistoryRecord
  })

  // ✅ Export to Excel function
  const exportToExcel = useCallback(() => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data available to export");
      return;
    }

    try {
      const exportData = filteredData.map((record, index) => ({
        "S.No": index + 1,
        "Serial No": record.serialNo || "",
        "Complaint ID": record.complaintId || "",
        "ID Number": record.idNumber || "",
        "Technician Name": record.technicianName || "",
        "Technician Contact": record.technicianNumber || "",
        "Beneficiary Name": record.beneficiaryName || "",
        "Contact Number": record.contactNumber || "",
        "Village": record.village || "",
        "Block": record.block || "",
        "District": record.district || "",
        "Product": record.product || "",
        "Make": record.make || "",
        "System Voltage": record.systemVoltage || "",
        "Nature of Complaint": record.natureOfComplaint || "",
        "Action Taken / Remarks": record.remarks || "",
        "Tracker Status": record.trackerStatus || "",
        "Address": record.address || "",
        "Status": record.status || "",
        "Attend Date": formatDateString(record.attendDate) || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker History");

      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 12),
      }));
      worksheet["!cols"] = colWidths;

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Tracker_History_${dateStr}.xlsx`);
    } catch (err) {
      console.error("Export to Excel failed:", err);
      alert("Failed to export Excel file: " + err.message);
    }
  }, [filteredData]);

  // ✅ Export to PDF function
  const exportToPDF = useCallback(() => {
    if (!filteredData || filteredData.length === 0) {
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
      doc.text("Tracker History Records", 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on: ${dateStr} | Total Records: ${filteredData.length}`, 40, 56);

      const tableColumns = [
        "#",
        "Serial No",
        "Complaint ID",
        "ID Number",
        "Technician",
        "Beneficiary",
        "Contact",
        "District",
        "Nature of Complaint",
        "Tracker Status",
        "Attend Date"
      ];

      const tableRows = filteredData.map((record, index) => [
        index + 1,
        record.serialNo || "-",
        record.complaintId || "-",
        record.idNumber || "-",
        record.technicianName || "-",
        record.beneficiaryName || "-",
        record.contactNumber || "-",
        record.district || "-",
        (record.natureOfComplaint || "-").length > 30
          ? (record.natureOfComplaint || "-").substring(0, 30) + "..."
          : (record.natureOfComplaint || "-"),
        record.trackerStatus || "-",
        formatDateString(record.attendDate) || "-",
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
      doc.save(`Tracker_History_${fileDate}.pdf`);
    } catch (err) {
      console.error("Export to PDF failed:", err);
      alert("Failed to export PDF file: " + err.message);
    }
  }, [filteredData]);

  // Connect export methods to parent exportRef
  useEffect(() => {
    if (exportRef) {
      exportRef.current = {
        exportToExcel,
        exportToPDF,
      };
    }
  }, [exportRef, exportToExcel, exportToPDF]);

  // Edit functions
  const handleEditRecord = (record) => {
    console.log('Editing record:', record)
    setSelectedRecord(record)
    setFormData({
      systemVoltage: record.systemVoltage || "",
      natureOfComplaint: record.natureOfComplaint || "",
      remarks: record.remarks || "",
      trackerStatus: record.trackerStatus || ""
    })
    setIsEditDialogOpen(true)
    resetEditForm()
  }

  const resetEditForm = () => {
    setUploadedDocument(null)
    setUploadedPhoto(null)
    setPhotoLocation(null)
    setLocationError(null)
    setIsCapturingLocation(false)
    setUploadStatus("")
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedDocument(e.target.files[0])
    }
  }

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      setIsCapturingLocation(true)
      setLocationError(null)

      try {
        const location = await getCurrentLocation()
        setPhotoLocation(location)
        console.log("📍 Location captured:", location)

        const processedPhoto = await addLocationOverlayToImage(
          file,
          location.latitude,
          location.longitude,
          location.formattedAddress
        )

        setUploadedPhoto(processedPhoto)
        setIsCapturingLocation(false)

        console.log("✅ Image updated with overlay text")

      } catch (error) {
        console.error("Location error:", error)
        setLocationError(error.message)
        setIsCapturingLocation(false)
        setUploadedPhoto(file)
      }
    }
  }

  const handleUpdateRecord = async () => {
    setIsSubmitting(true)

    try {
      let documentUrl = selectedRecord.uploadDocuments
      let photoUrl = selectedRecord.geotagPhoto

      if (uploadedDocument) {
        setUploadStatus("Uploading document...")
        documentUrl = await uploadFileToDrive(uploadedDocument, "document")
      }

      if (uploadedPhoto) {
        setUploadStatus("Uploading photo...")
        photoUrl = await uploadFileToDrive(uploadedPhoto, "photo")
      }

      // 🔥 Update the Tracker sheet record by Serial No (RBPST-01, RBPST-02, etc)
      await updateTrackerRecordBySerial(selectedRecord, documentUrl, photoUrl)

      // Update local state
      setHistoryData(prev => prev.map(record =>
        record.serialNo === selectedRecord.serialNo
          ? {
            ...record,
            systemVoltage: formData.systemVoltage,
            natureOfComplaint: formData.natureOfComplaint,
            remarks: formData.remarks,
            trackerStatus: formData.trackerStatus,
            uploadDocuments: documentUrl || record.uploadDocuments,
            geotagPhoto: photoUrl || record.geotagPhoto,
            hasDriveUrl: {
              uploadDocuments: (documentUrl || record.uploadDocuments)?.includes('drive.google.com'),
              geotagPhoto: (photoUrl || record.geotagPhoto)?.includes('drive.google.com')
            }
          }
          : record
      ))

      alert("Record updated successfully!")
      setIsEditDialogOpen(false)
      resetEditForm()

    } catch (err) {
      console.error("Error updating record:", err)
      alert("Failed to update record: " + err.message)
    } finally {
      setIsSubmitting(false)
      setUploadStatus("")
    }
  }



const updateTrackerRecordBySerial = async (record, documentUrl, photoUrl) => {
  try {
    const latitude = photoLocation ? photoLocation.latitude : record.latitude;
    const longitude = photoLocation ? photoLocation.longitude : record.longitude;
    const address = photoLocation ? photoLocation.formattedAddress : record.address;

    const { error } = await supabase
      .from("Tracker")
      .update({
        system_voltage: formData.systemVoltage,
        nature_of_complaint: formData.natureOfComplaint,
        upload_documents: documentUrl || record.uploadDocuments,
        geotag_photo: photoUrl || record.geotagPhoto,
        action_taken: formData.remarks,
        tracker_status: formData.trackerStatus,
        latitude,
        longitude,
        address,
      })
      .eq("serial_no", record.serialNo);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("❌ Supabase update error:", error);
    throw error;
  }
};

  if (isLoading && historyData.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        {/* Skeleton Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse">
          <div className="h-7 w-52 bg-gray-200 rounded-md"></div>
          <div className="h-9 w-64 bg-gray-200 rounded-md"></div>
        </div>

        {/* Skeleton Table (400px container) */}
        <div className="max-h-[400px] h-[400px] overflow-hidden border border-gray-200 rounded-lg bg-white relative shadow-inner">
          <div className="bg-slate-100 p-3 border-b border-gray-200 flex gap-4">
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-28 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
            <div className="h-4 w-28 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
          </div>
          <div className="divide-y divide-gray-100 p-3 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center py-2 animate-pulse">
                <div className="h-7 w-16 bg-amber-100 rounded"></div>
                <div className="h-4 w-20 bg-blue-100 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-28 bg-gray-100 rounded"></div>
                <div className="h-4 w-36 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-100 rounded"></div>
                <div className="h-4 w-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>

          {/* Centered Professional Spinner Overlay */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-200 shadow-md rounded-full text-sm font-medium text-gray-700">
              <Loader className="h-4 w-4 text-blue-600 animate-spin" />
              <span>Loading history records...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && historyData.length === 0) {
    return (
      <div className="p-6 flex flex-col justify-center items-center h-64 text-center">
        <div className="text-red-500 font-medium mb-2">Error loading history: {error}</div>
        <button
          onClick={() => fetchHistoryData(false)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 justify-between items-start mb-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Tracker History</h1>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
            {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
          </span>
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium animate-pulse">
              <Loader className="h-3 w-3 animate-spin" />
              Refreshing...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchHistoryData(false)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-md shadow-xs transition-all cursor-pointer"
            title="Refresh history data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-600" : "text-gray-500"}`} />
            <span>Refresh</span>
          </button>

          <div className="relative flex-1 sm:flex-initial">
            <input
              type="search"
              placeholder="Search history..."
              className="pl-8 w-full sm:w-[220px] md:w-[280px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredData.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No history data found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredData.map((record, index) => (
                  <div key={index} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{record.serialNo}</span>
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">{record.status}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Complaint ID</span>
                        <span className="text-gray-900 font-medium">{record.complaintId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">ID Number</span>
                        <span className="text-gray-900 font-medium">{record.idNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Beneficiary</span>
                        <span className="text-gray-900 font-medium">{record.beneficiaryName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Contact</span>
                        <span className="text-gray-900">{record.contactNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Village</span>
                        <span className="text-gray-900">{record.village}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Block</span>
                        <span className="text-gray-900">{record.block}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">District</span>
                        <span className="text-gray-900">{record.district}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Tracker Status</span>
                        <span className="text-gray-900">{record.trackerStatus}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Attend Date</span>
                        <span className="text-gray-900">{record.attendDate}</span>
                      </div>

                      {/* Technician Info Section */}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex-1">
                            <div className="text-gray-500 mb-0.5">Technician</div>
                            <div className="text-gray-900 font-medium">{record.technicianName}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 mb-0.5">Contact</div>
                            <div className="text-gray-900">{record.technicianNumber}</div>
                          </div>
                        </div>
                      </div>

                      {/* Documents & Photos Section */}
                      {(record.hasDriveUrl.uploadDocuments || record.hasDriveUrl.geotagPhoto) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
                          {record.hasDriveUrl.uploadDocuments && (
                            <a
                              href={record.uploadDocuments}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1.5 rounded text-xs font-medium"
                            >
                              📄 Document
                            </a>
                          )}
                          {record.hasDriveUrl.geotagPhoto && (
                            <a
                              href={record.geotagPhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1.5 rounded text-xs font-medium"
                            >
                              📷 Photo
                            </a>
                          )}
                        </div>
                      )}

                      {/* Remarks if available */}
                      {record.remarks && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-gray-500 text-xs mb-1">Remarks</div>
                          <div className="text-gray-900 text-xs">{record.remarks}</div>
                        </div>
                      )}

                      {/* Edit Button */}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button
                          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 border-0 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View - 400px Fixed Header with Unwrapped Header and Wrapped Body */}
              <div className="hidden md:block max-h-[400px] h-[400px] overflow-y-auto overflow-x-auto border border-gray-200 rounded-lg shadow-inner bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Actions</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Serial No</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Complaint Id</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">ID Number</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Technician Name</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Technician Number</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Beneficiary Name</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Contact Number</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Village</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Block</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">District</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Make</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Nature Of Complaint</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Upload Documents</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Geotag Photo</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Action Taken</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Tracker Status</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Address</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Status</th>
                      <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase whitespace-nowrap bg-slate-100 border-b border-gray-200">Attend Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((record, index) => (
                      <tr key={index} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold py-1 px-2.5 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-600 text-sm">{record.serialNo}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-semibold text-gray-800">{record.complaintId}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium text-blue-600 text-sm">{record.idNumber}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-800">{record.technicianName}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700">{record.technicianNumber}</td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[160px] min-w-[120px] text-sm text-gray-800">{record.beneficiaryName}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700">{record.contactNumber}</td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[130px] min-w-[90px] text-sm text-gray-700">{record.village}</td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[130px] min-w-[90px] text-sm text-gray-700">{record.block}</td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[130px] min-w-[90px] text-sm text-gray-700">{record.district}</td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[130px] min-w-[90px] text-sm text-gray-700">{record.make}</td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[200px] min-w-[140px] text-sm text-gray-700">{record.natureOfComplaint}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                          {record.hasDriveUrl.uploadDocuments ? (
                            <a href={record.uploadDocuments} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                              View Document
                            </a>
                          ) : (record.uploadDocuments || "-")}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                          {record.hasDriveUrl.geotagPhoto ? (
                            <a href={record.geotagPhoto} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                              View Photo
                            </a>
                          ) : (record.geotagPhoto || "-")}
                        </td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[200px] min-w-[140px] text-sm text-gray-700">{record.remarks}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {record.trackerStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-normal break-words max-w-[220px] min-w-[150px] text-sm text-gray-700">{record.address}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-medium text-emerald-700">{record.status}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700">{formatDateString(record.attendDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog - Same as before */}
      {isEditDialogOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto ">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsEditDialogOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white relative z-10 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">


                    {/* Editable form fields */}
                    <div className="mt-4 max-h-[60vh] overflow-auto">
                      <h4 className="font-medium text-gray-700 mb-4">ट्रैकर फॉर्म फील्ड्स (Edit)</h4>
                      <div className="grid gap-4">

                        <div className="space-y-2">
                          <label htmlFor="trackerStatus" className="block text-sm font-medium text-gray-700">
                            ट्रैकर स्थिति *
                          </label>
                          <select
                            id="trackerStatus"
                            name="trackerStatus"
                            value={formData.trackerStatus}
                            onChange={(e) => handleFormChange("trackerStatus", e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                          >
                            <option value="">स्थिति चुनें</option>
                            {trackerStatusOptions.map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* System Voltage Field - Added for Edit */}
                        <div className="space-y-2">
                          <label htmlFor="systemVoltage" className="block text-sm font-medium text-gray-700">
                            सिस्टम वोल्टेज
                          </label>
                          <input
                            id="systemVoltage"
                            type="text"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.systemVoltage}
                            onChange={(e) => handleFormChange('systemVoltage', e.target.value)}
                            placeholder="सिस्टम वोल्टेज दर्ज करें"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="natureOfComplaint" className="block text-sm font-medium text-gray-700">
                            शिकायत की प्रकृति
                          </label>
                          <textarea
                            id="natureOfComplaint"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            value={formData.natureOfComplaint}
                            onChange={(e) => handleFormChange('natureOfComplaint', e.target.value)}
                            placeholder="शिकायत की प्रकृति दर्ज करें"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="documents" className="block text-sm font-medium text-gray-700">
                            दस्तावेज़ अपलोड करें {selectedRecord.uploadDocuments && <span className="text-green-600">(Current: Available)</span>}
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
                              चयनित: {uploadedDocument.name}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="geotagPhoto" className="block text-sm font-medium text-gray-700">
                            जियोटैग फोटो {selectedRecord.geotagPhoto && <span className="text-green-600">(Current: Available)</span>}
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
                        onClick={() => setIsEditDialogOpen(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                        disabled={isSubmitting}
                      >
                        रद्द करें
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateRecord}
                        className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white py-2 px-4 rounded-md flex items-center"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            सहेजा जा रहा है...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            परिवर्तन सहेजें
                          </>
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

export default TrackerHistoryTable
