"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DashboardLayout from "../components/DashboardLayout";
import supabase from "../utils/supabase"

function AssignToVendorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorDate, setVendorDate] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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


  const fetchAssignToVendorData = async () => {
    try {
      setAssignToVendorLoading(true)

      const { data, error } = await supabase
        .from("AssignToVendor")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setAssignToVendorData(data)

    } catch (error) {
      console.error("❌ Error:", error)
    } finally {
      setAssignToVendorLoading(false)
    }
  }

  const fetchComplaintsForVendor = async () => {
    try {
      setTableLoading(true)
      setDataError(null)

      const { data, error } = await supabase
        .from("FMS")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // SAME LOGIC: assign_to_vendor === true
      const filteredData = data.filter(row =>
        String(row.assign_to_vendor).toLowerCase() === "true"
      )

      setTableData(filteredData)

    } catch (error) {
      console.error("❌ Error fetching complaints:", error)
      setDataError(error.message)
      setTableData([])
    } finally {
      setTableLoading(false)
    }
  }



  // NEW: Get filtered data based on active tab
  const getFilteredTableData = () => {
    if (activeTab === "history") {
      return assignToVendorData || []
    }

    if (!tableData || !assignToVendorData) return []

    const existingComplaintIds = new Set(
      assignToVendorData.map(row => row.complaint_id)
    )

    return tableData.filter(row =>
      !existingComplaintIds.has(row.complaint_id)
    )
  }

  // NEW: Get tab counts
  const getTabCounts = () => {
    if (!tableData || !assignToVendorData) {
      return { pending: 0, history: 0 }
    }

    const existingComplaintIds = new Set(
      assignToVendorData
        .map(row => row.complaint_id)
        .filter(Boolean)
    )

    const pending = tableData.filter(row =>
      !existingComplaintIds.has(row.complaint_id)
    ).length

    const history = tableData.filter(row =>
      existingComplaintIds.has(row.complaint_id)
    ).length

    return { pending, history }
  }

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

        const vendorNames = data.map(i => i.vendor_name).filter(Boolean);
        const productTypes = data.map(i => i.product_type).filter(Boolean);

        setVendorNameOptions([...new Set(vendorNames)].sort());
        setProductTypeOptions([...new Set(productTypes)].sort());

      } catch (error) {
        console.error("Error fetching dropdown options:", error);
        setDataError("Error loading form options");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownOptions();
    fetchComplaintsForVendor();
    fetchAssignToVendorData();
  }, []);



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Show upload section when checkbox is checked
    if (name === "sendDetailsToVendor") {
      setShowUpload(checked);
      if (!checked) {
        setSelectedFiles([]); // Clear selected files when unchecked
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

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

  const uploadFileToSupabase = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from("assign_to_vendor")
        .upload(fileName, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from("assign_to_vendor")
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl

    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }




  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let uploadedFileUrl = null

      // ✅ Upload file inside submit
      if (selectedFiles.length > 0) {
        setUploading(true)

        const file = selectedFiles[0]
        uploadedFileUrl = await uploadFileToSupabase(file)

        setUploading(false)
      }

      const { error } = await supabase
        .from("AssignToVendor")
        .insert([{
          timestamp: new Date(),
          vendor_name: formData.vendorName,
          product_type: formData.productType,
          send_details_to_vendor: formData.sendDetailsToVendor,
          vendor_complaint_id: formData.vendorComplaintId,
          date: vendorDate,
          complaint_id: selectedComplaint?.complaint_id || null,
          upload_file: uploadedFileUrl || null
        }])

      if (error) throw error

      alert("Assignment created ✅")

      handleBackToTable()
      await fetchComplaintsForVendor()
      await fetchAssignToVendorData()
      setActiveTab("history")

    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsSubmitting(false)
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      vendorName: "",
      productType: "",
      sendDetailsToVendor: false,
      vendorComplaintId: "",
    });
    setVendorDate(null);
    setShowUpload(false);
    setSelectedFiles([]);
    setDataError(null);
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
                    : "Complaints Ready for Vendor Assignment"}
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "pending"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    Pending ({tabCounts.pending})
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "history"
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
                      {activeTab === "history" ? (
                        <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="px-4 py-3 text-left">Timestamp</th>
                          <th className="px-4 py-3 text-left">Vendor Name</th>
                          <th className="px-4 py-3 text-left">Product Type</th>
                          <th className="px-4 py-3 text-left">Send Details</th>
                          <th className="px-4 py-3 text-left">Vendor Complaint ID</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Complaint ID</th>
                          <th className="px-4 py-3 text-left">Upload File</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>Action</th>
                          <th>Complaint ID</th>
                          <th>Company Name</th>
                          <th>Beneficiary Name</th>
                          <th>Contact Number</th>
                          <th>District</th>
                          <th>Product</th>
                          <th>Nature of Complaint</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTableData.map((row, index) => {
                        if (activeTab === "history") {
                          return (
                            <tr key={index} className="hover:bg-gray-50 text-sm text-gray-700">

                              {/* Timestamp */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.timestamp
                                  ? new Date(row.timestamp).toLocaleDateString("en-GB")
                                  : "-"}
                              </td>

                              {/* Vendor Name */}
                              <td className="px-4 py-3 whitespace-nowrap font-medium">
                                {row.vendor_name || "-"}
                              </td>

                              {/* Product Type */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.product_type || "-"}
                              </td>

                              {/* Send Details */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${row.send_details_to_vendor
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                    }`}
                                >
                                  {row.send_details_to_vendor ? "Yes" : "No"}
                                </span>
                              </td>

                              {/* Vendor Complaint ID */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.vendor_complaint_id || "-"}
                              </td>

                              {/* Date */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.date
                                  ? new Date(row.date).toLocaleDateString("en-GB")
                                  : "-"}
                              </td>

                              {/* Complaint ID */}
                              <td className="px-4 py-3 whitespace-nowrap text-blue-600 font-semibold">
                                {row.complaint_id || "-"}
                              </td>

                              {/* Upload File */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.upload_file ? (
                                  <a
                                    href={row.upload_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    View File
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>

                            </tr>
                          );
                        }

                        // 🔵 Pending (same as before)
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewComplaint(row)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md"
                              >
                                View
                              </button>
                            </td>
                            <td className="px-4 py-3 text-blue-600">{row.complaint_id || "-"}</td>
                            <td className="px-4 py-3">{row.company_name || "-"}</td>
                            <td className="px-4 py-3">{row.beneficiary_name || "-"}</td>
                            <td className="px-4 py-3">{row.contact_number || "-"}</td>
                            <td className="px-4 py-3">{row.district || "-"}</td>
                            <td className="px-4 py-3">{row.product || "-"}</td>
                            <td className="px-4 py-3">{row.nature_of_complaint || "-"}</td>
                          </tr>
                        );
                      })}
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
          {showAssignmentForm && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* NEW: Read-only complaint details section */}
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
                        {selectedComplaint.complaint_id || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Complaint Number
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.complaint_number || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Beneficiary Name
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.beneficiary_name || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Contact Number
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.contact_number || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Village
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.village || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Block
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.block || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        District
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.district || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Company Name
                      </label>
                      <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {selectedComplaint.company_name || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendor Name Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={(e) =>
                      handleSelectChange("vendorName", e.target.value)
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200"
                  >
                    <option value="">Select Vendor</option>
                    {vendorNameOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {vendorNameOptions.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No vendors found in master sheet
                    </p>
                  )}
                </div>

                {/* Product Type Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={(e) =>
                      handleSelectChange("productType", e.target.value)
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition duration-200"
                  >
                    <option value="">Select Product Type</option>
                    {productTypeOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {productTypeOptions.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No product types found in master sheet
                    </p>
                  )}
                </div>

                {/* Send Details to Vendor Checkbox */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="sendDetailsToVendor"
                      name="sendDetailsToVendor"
                      checked={formData.sendDetailsToVendor}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="sendDetailsToVendor"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Send details to vendor{" "}
                      <span className="text-gray-500 font-normal">
                        (Check this to upload files)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Upload Section - Shows when checkbox is checked */}
                {showUpload && (
                  <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg
                        className="h-5 w-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-700">
                        Upload Documents to Google Drive
                      </h3>
                    </div>

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
                            Files will be stored in: AssignToVendor Drive Folder
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
                )}

                {/* Vendor Complaint ID Text Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vendor Complaint ID
                  </label>
                  <input
                    type="text"
                    name="vendorComplaintId"
                    value={formData.vendorComplaintId}
                    onChange={handleChange}
                    placeholder="Enter vendor complaint ID"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>

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
                    required
                  />
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
                    "Submit Assignment"
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
