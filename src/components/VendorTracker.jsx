"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DashboardLayout from "../components/DashboardLayout";
import supabase from "../utils/supabase";



function AssignToVendorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorDate, setVendorDate] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [vendorTrackerData, setVendorTrackerData] = useState([]);

  // States for dropdown options
  const [vendorNameOptions, setVendorNameOptions] = useState([]);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // New states for table data
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // NEW: Tab states
  const [activeTab, setActiveTab] = useState("pending");
  const [assignToVendorData, setAssignToVendorData] = useState([]);
  const [assignToVendorLoading, setAssignToVendorLoading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    vendorName: "",
    productType: "",
    sendDetailsToVendor: false,
    vendorComplaintId: "",
  });

 const fetchVendorTrackerData = async () => {
  try {
    console.log("🚀 Fetch VendorTracker from Supabase");

    const { data, error } = await supabase
      .from("VendorTracker")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🔴 IMPORTANT: same array format maintain karna
    const formattedData = data.map((row) => [
      row.timestamp,
      row.serial_number,
      row.complaint_id,
      row.date,
      row.status,
      row.remark,
      row.upload,
      row.planned,
      row.actual,
    ]);

    setVendorTrackerData(formattedData);
  } catch (err) {
    console.error("❌ VendorTracker error:", err);
  }
};

  // NEW: Fetch AssignToVendor sheet data
const fetchAssignToVendorData = async () => {
  try {
    setAssignToVendorLoading(true);

    const { data, error } = await supabase
      .from("AssignToVendor")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedData = data.map((row) => [
      row.timestamp,
      row.vendor_name,
      row.product_type,
      row.send_details_to_vendor,
      row.vendor_complaint_id,
      row.date,
      row.complaint_id,
      row.upload_file,
      row.planned,
      row.actual,
    ]);

    setAssignToVendorData(formattedData);
  } catch (error) {
    console.error("Error fetching AssignToVendor:", error);
  } finally {
    setAssignToVendorLoading(false);
  }
};

  // Fetch complaints where Column AN (index 39) is "true"
const fetchComplaintsForVendor = async () => {
  try {
    setTableLoading(true);
    setDataError(null);

    console.log("🔍 Fetching complaints from Supabase FMS...");

    const { data, error } = await supabase
      .from("FMS")
      .select("*");

    if (error) throw error;

    // 🔴 same structure maintain
    const formattedData = data.map((row) => [
      row.timestamp,        // 0
      row.id,               // 1
      row.complaint_id,     // 2
      row.company_name,     // 3
      row.mode_of_call,     // 4
      row.id_number,        // 5
      row.project_name,     // 6
      row.complaint_number, // 7
      row.complaint_date,   // 8
      row.beneficiary_name, // 9
      row.contact_number,   // 10
      row.village,          // 11
      row.block,            // 12
      row.district,         // 13
      row.product,          // 14
      row.make,             // 15
      row.rating,           // 16
      row.qty,              // 17
      row.insurance_type,   // 18
      row.nature_of_complaint, // 19
      row.technician_name,  // 20
      row.technician_contact, // 21
      row.assignee_whatsapp_number, // 22
      row.planned,          // 23
      row.actual,           // 24
      row.delay,            // 25
      row.status,           // 26
      row.attend,           // 27
      row.controller_rid_no,// 28
      row.product_sl_no,    // 29
      row.challan_date,     // 30
      row.close_date,       // 31
      row.challan_no,       // 32
      row.last_attend_status,// 33
      row.planned1,         // 34
      row.actual1,          // 35
      row.delay1,           // 36
      row.company,          // 37
      row.email,            // 38
      row.pdf,              // 39
      row.assign_to_vendor, // 40 ✅ (AN column replace)
    ]);

    // 🔴 SAME FILTER LOGIC
    const filteredData = formattedData.filter((row) => {
      const columnAN = row[40];

      if (!columnAN) return false;

      return String(columnAN).toLowerCase().trim() === "true";
    });

    setTableData(filteredData);
  } catch (error) {
    console.error("❌ Error:", error);
    setDataError(error.message);
    setTableData([]);
  } finally {
    setTableLoading(false);
  }
};

  // NEW: Get filtered data based on active tab
  // History data filter karne ka function
  const getFilteredTableData = () => {
    if (activeTab === "history") {
      // VendorTracker data filter karo jahan:
      // 1. Planned Date (Column H, index 7) NOT NULL
      // 2. Actual Date (Column I, index 8) NOT NULL
      return vendorTrackerData.filter((row) => {
        const plannedDate = row[7]?.toString().trim(); // Column H
        const actualDate = row[8]?.toString().trim(); // Column I

        return (
          plannedDate &&
          actualDate &&
          plannedDate !== "" &&
          actualDate !== "" &&
          plannedDate !== "null" &&
          actualDate !== "null" &&
          plannedDate !== "undefined" &&
          actualDate !== "undefined"
        );
      });
    }

    // Pending tab - show complaints not yet in VendorTracker
    if (!tableData || !vendorTrackerData) return [];

  return tableData.filter((row) => {
  const complaintId = row[2]?.toString().trim();

  const match = vendorTrackerData.find(
    (v) => v[2]?.toString().trim() === complaintId
  );

  if (!match) return true;

  const status = match[4]?.toString().toLowerCase().trim(); // Column E

  return status !== "completed"; // ✅ KEY FIX
});
  };

  // Tab counts calculate karne ka function
  const getTabCounts = () => {
    // History count = VendorTracker records with both Planned and Actual dates
    let historyCount = 0;
    if (vendorTrackerData) {
      historyCount = vendorTrackerData.filter((row) => {
        const plannedDate = row[7]?.toString().trim(); // Column H
        const actualDate = row[8]?.toString().trim(); // Column I

        return (
          plannedDate &&
          actualDate &&
          plannedDate !== "" &&
          actualDate !== "" &&
          plannedDate !== "null" &&
          actualDate !== "null"
        );
      }).length;
    }

    // Pending count = complaints not in VendorTracker
    let pendingCount = 0;
    if (tableData && vendorTrackerData) {
      pendingCount = tableData.filter((row) => {
        const complaintId = row[2]?.toString().trim();
        const match = vendorTrackerData.find(
          (v) => v[2]?.toString().trim() === complaintId,
        );
        return !match;
      }).length;
    }

    return { pending: pendingCount, history: historyCount };
  };

  // Fetch dropdown options from master sheet
  useEffect(() => {
   const fetchDropdownOptions = async () => {
  try {
    setIsLoading(true);
    setDataError(null);

    const { data, error } = await supabase
      .from("Master")
      .select("vendor_name, product_type");

    if (error) throw error;

    const vendorNames = data
      .map((item) => item.vendor_name)
      .filter(Boolean);

    const productTypes = data
      .map((item) => item.product_type)
      .filter(Boolean);

    setVendorNameOptions(
      [...new Set(vendorNames)].sort()
    );

    setProductTypeOptions(
      [...new Set(productTypes)].sort()
    );

  } catch (error) {
    console.error("Error fetching dropdown options:", error);
    setDataError("Error loading form options.");
  } finally {
    setIsLoading(false);
  }
};

    fetchDropdownOptions();
    fetchComplaintsForVendor(); // Fetch complaints on component mount
    fetchAssignToVendorData(); // NEW: Fetch AssignToVendor data
  }, []);



 
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  useEffect(() => {
    fetchVendorTrackerData(); // ✅ ADD THIS
  }, []);

  // Handle View button click
  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignmentForm(true);
  };

  // Handle back to table
  const handleBackToTable = () => {
    setShowAssignmentForm(false);
    setSelectedComplaint(null);
    // Reset form
    setFormData({
      vendorName: "",
      productType: "",
      sendDetailsToVendor: false,
      vendorComplaintId: "",
    });
    setVendorDate(null);
    setShowUpload(false);
    setSelectedFiles([]);
  };

  // Upload file to Google Drive
 const uploadFileToDrive = async (file) => {
  try {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("vendor_tracker") // ✅ bucket name
      .upload(fileName, file);

    if (error) throw error;

    // public URL
    const { data: publicUrlData } = supabase.storage
      .from("vendor_tracker")
      .getPublicUrl(fileName);

    return {
      name: file.name,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error("❌ Upload error:", error);
    throw error;
  }
};

const generateVTId = async () => {
  const { data, error } = await supabase.rpc("generate_vt_id");
  if (error) throw error;
  return data;
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setDataError(null);

  try {
    if (!vendorDate) throw new Error("Please select date");
    if (!formData.status) throw new Error("Please select status");

    const uploadedFiles = [];

    if (selectedFiles.length > 0) {
      setUploading(true);

      for (const file of selectedFiles) {
        const uploadedFile = await uploadFileToDrive(file);
        uploadedFiles.push(uploadedFile);
      }

      setUploading(false);
    }

    const timestamp = new Date();

    const vtId = await generateVTId();

    const plannedDate = vendorDate;
    const actualDate = new Date();

    const { error } = await supabase.from("VendorTracker").insert([
      {
        timestamp,
        serial_number: vtId,
        complaint_id: selectedComplaint?.[2] || "",
        date: plannedDate,
        status: formData.status,
        remark: formData.remark || "",
        upload: uploadedFiles.map((f) => f.url).join(", "),
        planned: plannedDate,
        actual: actualDate,
      },
    ]);

    if (error) throw error;

    alert("Submitted successfully!");

    handleBackToTable();
    await fetchComplaintsForVendor();
    await fetchAssignToVendorData();
    setActiveTab("history");
  } catch (error) {
    console.error("Submission error:", error);
    alert(error.message);
  } finally {
    setIsSubmitting(false);
    setUploading(false);
  }
};


  // NEW: Get filtered data for current tab
  const filteredTableData = getFilteredTableData();
  const tabCounts = getTabCounts();

  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {showAssignmentForm
                    ? "Assign to Vendor"
                    : "Vendor Tracker"}
                </h2>
              </div>
              {showAssignmentForm && (
                <button
                  onClick={handleBackToTable}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition duration-200 font-medium"
                >
                  ← Back to List
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {dataError && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-700 text-sm">{dataError}</p>
              </div>
            </div>
          )}

          {/* Table View */}
          {!showAssignmentForm && (
            <div className="p-6">
              {/* NEW: Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === "pending"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Pending ({tabCounts.pending})
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === "history"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    History ({tabCounts.history})
                  </button>
                </nav>
              </div>

              {tableLoading || assignToVendorLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : filteredTableData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {activeTab === "history" ? (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Timestamp
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Serial Number
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Complaint ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Remark
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Upload
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Action
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Complaint ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Company Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Beneficiary Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Contact Number
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              District
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Nature of Complaint
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTableData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {activeTab === "history" ? (
                            <>
                              <td className="px-4 py-3 text-sm">
  {row[0]
    ? new Date(row[0]).toLocaleDateString("en-GB")
    : "-"}
</td>
                              <td className="px-4 py-3 text-sm">
                                {row[1] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                                {row[2] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[3] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[4] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[5] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[6] ? (
                                  <a
                                    href={row[6]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline"
                                  >
                                    View File
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleViewComplaint(row)}
                                  className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                                >
                                  View
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                                {row[2] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[3] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[9] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[10] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[13] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[14] || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row[19]?.substring(0, 50) || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No complaints found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === "pending"
                      ? "No pending complaints ready for vendor assignment."
                      : "No historical assignments found."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assignment Form */}
          {/* Assignment Form */}
          {showAssignmentForm && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Read-only complaint details section */}
              {selectedComplaint && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Complaint Details (Read Only)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Complaint ID
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[2] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Complaint Number
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[7] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Beneficiary Name
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[9] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Contact Number
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[10] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Village
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[11] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Block
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[12] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        District
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[13] || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Company Name
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint[3] || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={vendorDate}
                    onChange={(date) => setVendorDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholderText="Select date"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200"
                  >
                    <option value="">Select Status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Service Record Upload Section */}
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Service Record <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors duration-200">
                      <input
                        type="file"
                        multiple
                        id="fileUpload"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer block"
                      >
                        <div className="space-y-2">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-blue-600">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, JPG, PNG up to 10MB
                          </p>
                          <p className="text-xs text-blue-600">
                            Files will be stored in: VendorTracker Drive Folder
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Selected Files:
                        </p>
                        <ul className="space-y-1">
                          {selectedFiles.map((file, index) => (
                            <li
                              key={index}
                              className="text-xs text-gray-600 flex items-center"
                            >
                              <svg
                                className="h-4 w-4 text-green-500 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remark Field */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Remark
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        remark: e.target.value,
                      }))
                    }
                    rows="4"
                    placeholder="Enter any remarks or comments..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBackToTable}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 font-medium"
                  disabled={isSubmitting || uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium shadow-md"
                >
                  {isSubmitting || uploading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {uploading ? "Uploading..." : "Submitting..."}
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default AssignToVendorForm;
