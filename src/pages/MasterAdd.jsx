"use client";
import { useEffect, useState } from "react";
import supabase from "../utils/supabase";
import DashboardLayout from "../components/DashboardLayout"

export default function MasterDataManagement() {
  const [masterData, setMasterData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  
const [formData, setFormData] = useState({
  company_name: "",
  mode_of_call: "",
  project_name: "",
  district: "",
  technician_name: "",
  technician_contact: "",
  insurance_type: "",
  tracker_status: "",
  checked: false,
  company_name1: "",
  address: "",
  email_id: "",
  phone_no: "",
  vendor_name: "",
  product_type: ""
});

  const [editData, setEditData] = useState(formData);

  // ================= FETCH MASTER DATA =================
const fetchMasterData = async () => {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from("Master")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    setMasterData(data || []);
  } catch (error) {
    console.error("Error fetching master data:", error);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchMasterData();
  }, []);

  // ================= HANDLE FORM INPUT =================
const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  // Handle checkbox
  if (type === "checkbox") {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    return;
  }

  // Phone validation (only digits)
  if (name === "phone_no" || name === "technician_contact") {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 15) {
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    }
    return;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setEditData({ ...editData, [name]: checked });
    } else {
      setEditData({ ...editData, [name]: value });
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditData(item);
  };

  // ================= HANDLE SUBMIT (CREATE) =================
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const payload = {
      company_name: formData.company_name,
      mode_of_call: formData.mode_of_call,
      project_name: formData.project_name,
      district: formData.district,
      technician_name: formData.technician_name,
      technician_contact: formData.technician_contact,
      insurance_type: formData.insurance_type,
      tracker_status: formData.tracker_status,
      checked: formData.checked || false,
      company_name1: formData.company_name1,
      address: formData.address,
      email_id: formData.email_id,
      phone_no: formData.phone_no,
      vendor_name: formData.vendor_name,
      product_type: formData.product_type,
    };

    const { error } = await supabase
      .from("Master")
      .insert([payload]);

    if (error) throw error;

    // Reset form
    setFormData({
      company_name: "",
      mode_of_call: "",
      project_name: "",
      district: "",
      technician_name: "",
      technician_contact: "",
      insurance_type: "",
      tracker_status: "",
      checked: false,
      company_name1: "",
      address: "",
      email_id: "",
      phone_no: "",
      vendor_name: "",
      product_type: "",
    });

    setOpen(false);
    fetchMasterData();

  } catch (error) {
    console.error("Error adding data:", error);
    alert("Error adding data: " + error.message);
  }
};

  // ================= HANDLE UPDATE =================
const handleUpdate = async (id) => {
  try {
    const payload = {};

    Object.keys(editData).forEach((key) => {
      if (
        editData[key] !== "" &&
        editData[key] !== undefined &&
        editData[key] !== null
      ) {
        payload[key] = editData[key];
      }
    });

    const { error } = await supabase
      .from("Master")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    setEditId(null);
    fetchMasterData();

  } catch (error) {
    console.error("Error updating data:", error);
    alert("Error updating data: " + error.message);
  }
};

  // ================= HANDLE DELETE =================
const handleDelete = async (id) => {
  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    const { error } = await supabase
      .from("Master")
      .delete()
      .eq("id", id);

    if (error) throw error;

    fetchMasterData();

  } catch (error) {
    console.error("Error deleting data:", error);
    alert("Error deleting data: " + error.message);
  }
};

  // ================= STATS CALCULATIONS =================
  const uniqueDepartments = [...new Set(masterData.map(item => item.department).filter(Boolean))];
  const uniqueFirms = [...new Set(masterData.map(item => item.firm_name).filter(Boolean))];

  // ================= UI =================
  return (
    <DashboardLayout>
    <div className="p-2 md:p-4 lg:p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Master Data Management
          </h1>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Add New Record
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
   
      </div>

    {/* ================= DESKTOP TABLE ================= */}
<div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
    <div className="flex justify-between items-center">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          Loading...
        </div>
      )}
    </div>
  </div>

  <div className="overflow-x-auto max-h-[400px]">
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-30">
        <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <th className="px-4 py-3 text-left font-medium rounded-tl-xl">S.No</th>
          <th className="px-4 py-3 text-center font-medium">Actions</th>
          <th className="px-4 py-3 text-left font-medium">Company Name</th>
          <th className="px-4 py-3 text-left font-medium">Mode of Call</th>
          <th className="px-4 py-3 text-left font-medium">Project Name</th>
          <th className="px-4 py-3 text-left font-medium">District</th>
          <th className="px-4 py-3 text-left font-medium">Technician Name</th>
          <th className="px-4 py-3 text-left font-medium">Technician Contact</th>
          <th className="px-4 py-3 text-left font-medium">Insurance Type</th>
          <th className="px-4 py-3 text-left font-medium">Tracker Status</th>
          <th className="px-4 py-3 text-left font-medium">Checked</th>
          <th className="px-4 py-3 text-left font-medium">Company Name 1</th>
          <th className="px-4 py-3 text-left font-medium">Address</th>
          <th className="px-4 py-3 text-left font-medium">Email ID</th>
          <th className="px-4 py-3 text-left font-medium">Phone No</th>
          <th className="px-4 py-3 text-left font-medium">Vendor Name</th>
          <th className="px-4 py-3 text-left font-medium rounded-tr-xl">Product Type</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan="17" className="text-center py-8">
              <div className="flex justify-center items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="text-gray-500">Loading records...</p>
              </div>
            </td>
          </tr>
        ) : masterData.length === 0 ? (
          <tr>
            <td colSpan="17" className="text-center py-8">
              <p className="text-gray-500">No records found. Click "Add New Record" to get started.</p>
            </td>
          </tr>
        ) : (
          masterData.map((item, index) => (
            <tr
              key={item.id}
              className="border-b border-gray-100 hover:bg-purple-50 transition-all duration-150"
            >
              <td className="px-4 py-4 text-gray-500">{index + 1}</td>

                 <td className="px-4 py-4 text-center">
                {editId === item.id ? (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleUpdate(item.id)}
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </td>
              
              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="company_name"
                    value={editData.company_name || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span className="font-medium">{item.company_name || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="mode_of_call"
                    value={editData.mode_of_call || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.mode_of_call || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="project_name"
                    value={editData.project_name || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.project_name || "-"}</span>
                )}
              </td>

              

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="district"
                    value={editData.district || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.district || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="technician_name"
                    value={editData.technician_name || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.technician_name || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="technician_contact"
                    value={editData.technician_contact || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.technician_contact || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="insurance_type"
                    value={editData.insurance_type || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.insurance_type || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <select
                    name="tracker_status"
                    value={editData.tracker_status || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.tracker_status === "Active" ? "bg-green-100 text-green-700" :
                    item.tracker_status === "Inactive" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {item.tracker_status || "-"}
                  </span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    type="checkbox"
                    name="checked"
                    checked={editData.checked || false}
                    onChange={handleEditChange}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    readOnly
                    disabled
                    className="w-4 h-4 text-purple-600"
                  />
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="company_name1"
                    value={editData.company_name1 || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.company_name1 || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <textarea
                    name="address"
                    value={editData.address || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                    rows="2"
                  />
                ) : (
                  <span className="line-clamp-2">{item.address || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="email_id"
                    value={editData.email_id || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.email_id || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="phone_no"
                    value={editData.phone_no || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.phone_no || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="vendor_name"
                    value={editData.vendor_name || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.vendor_name || "-"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                {editId === item.id ? (
                  <input
                    name="product_type"
                    value={editData.product_type || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span>{item.product_type || "-"}</span>
                )}
              </td>

           
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
    Showing {masterData.length} of {masterData.length} records
  </div>
</div>
      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="md:hidden space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Master Data Records
            </h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
              {masterData.length} records
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading records...</p>
            </div>
          ) : masterData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {masterData.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-400 text-xs">#{index + 1}</span>
                        <h3 className="font-semibold text-gray-900">
                          {item.company_name || item.project_name || "Unnamed"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.tracker_status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            item.tracker_status === "Active" ? "bg-green-100 text-green-700" :
                            item.tracker_status === "Inactive" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {item.tracker_status}
                          </span>
                        )}
                        {item.checked && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Checked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {editId === item.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company Name</p>
                      {editId === item.id ? (
                        <input
                          name="company_name"
                          value={editData.company_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.company_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mode of Call</p>
                      {editId === item.id ? (
                        <input
                          name="mode_of_call"
                          value={editData.mode_of_call || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.mode_of_call || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Project Name</p>
                      {editId === item.id ? (
                        <input
                          name="project_name"
                          value={editData.project_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.project_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">District</p>
                      {editId === item.id ? (
                        <input
                          name="district"
                          value={editData.district || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.district || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Technician Name</p>
                      {editId === item.id ? (
                        <input
                          name="technician_name"
                          value={editData.technician_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.technician_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Technician Contact</p>
                      {editId === item.id ? (
                        <input
                          name="technician_contact"
                          value={editData.technician_contact || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.technician_contact || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Insurance Type</p>
                      {editId === item.id ? (
                        <input
                          name="insurance_type"
                          value={editData.insurance_type || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.insurance_type || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tracker Status</p>
                      {editId === item.id ? (
                        <select
                          name="tracker_status"
                          value={editData.tracker_status || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Pending">Pending</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium">{item.tracker_status || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Checked</p>
                      {editId === item.id ? (
                        <input
                          type="checkbox"
                          name="checked"
                          checked={editData.checked || false}
                          onChange={handleEditChange}
                          className="w-4 h-4 mt-2"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={item.checked || false}
                          readOnly
                          disabled
                          className="w-4 h-4 mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company Name 1</p>
                      {editId === item.id ? (
                        <input
                          name="company_name1"
                          value={editData.company_name1 || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.company_name1 || "-"}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      {editId === item.id ? (
                        <textarea
                          name="address"
                          value={editData.address || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          rows="2"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.address || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email ID</p>
                      {editId === item.id ? (
                        <input
                          name="email_id"
                          value={editData.email_id || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.email_id || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone No</p>
                      {editId === item.id ? (
                        <input
                          name="phone_no"
                          value={editData.phone_no || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.phone_no || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vendor Name</p>
                      {editId === item.id ? (
                        <input
                          name="vendor_name"
                          value={editData.vendor_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.vendor_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Product Type</p>
                      {editId === item.id ? (
                        <input
                          name="product_type"
                          value={editData.product_type || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.product_type || "-"}</p>
                      )}
                    </div>

                    {editId === item.id && (
                      <>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Created At</p>
                          <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD RECORD MODAL ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sticky top-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Record</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Fill in all the details below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="company_name"
                    placeholder="Enter company name"
                    onChange={handleChange}
                    value={formData.company_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode of Call
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="mode_of_call"
                    placeholder="Enter mode of call"
                    onChange={handleChange}
                    value={formData.mode_of_call}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="project_name"
                    placeholder="Enter project name"
                    onChange={handleChange}
                    value={formData.project_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="district"
                    placeholder="Enter district"
                    onChange={handleChange}
                    value={formData.district}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technician Name
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="technician_name"
                    placeholder="Enter technician name"
                    onChange={handleChange}
                    value={formData.technician_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technician Contact
                  </label>
                  <input
                    type="tel"
                    name="technician_contact"
                    placeholder="Enter technician contact"
                    maxLength={15}
                    inputMode="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    onChange={handleChange}
                    value={formData.technician_contact}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Type
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="insurance_type"
                    placeholder="Enter insurance type"
                    onChange={handleChange}
                    value={formData.insurance_type}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracker Status
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="tracker_status"
                    onChange={handleChange}
                    value={formData.tracker_status}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Checked
                  </label>
                  <input
                    type="checkbox"
                    name="checked"
                    onChange={handleChange}
                    checked={formData.checked}
                    className="w-4 h-4 mt-2 text-purple-600 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name 1
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="company_name1"
                    placeholder="Enter alternate company name"
                    onChange={handleChange}
                    value={formData.company_name1}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="address"
                    placeholder="Enter address"
                    rows="2"
                    onChange={handleChange}
                    value={formData.address}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="email_id"
                    placeholder="Enter email address"
                    onChange={handleChange}
                    value={formData.email_id}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone No
                  </label>
                  <input
                    type="tel"
                    name="phone_no"
                    placeholder="Enter phone number"
                    maxLength={15}
                    inputMode="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    onChange={handleChange}
                    value={formData.phone_no}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="vendor_name"
                    placeholder="Enter vendor name"
                    onChange={handleChange}
                    value={formData.vendor_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="product_type"
                    placeholder="Enter product type"
                    onChange={handleChange}
                    value={formData.product_type}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}