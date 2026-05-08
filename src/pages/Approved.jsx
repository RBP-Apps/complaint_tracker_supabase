// ComplaintTracker.jsx
"use client"

import { useState, useEffect } from "react"
import { Calendar, Upload, MapPin, Loader, Edit, Check, X } from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import DashboardLayout from "../components/DashboardLayout"
import supabase from "../utils/supabase"

function ComplaintTracker() {
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
  const [checked, setChecked] = useState("")
  const [remark, setRemark] = useState("")
  const [checkedOptions, setCheckedOptions] = useState([])



  // useEffect(() => {
  //   const fetchTasks = async () => {
  //     setIsLoading(true);
  //     setError(null);

  //     try {
  //       console.log("🚀 Fetching from Supabase...");

  //       const { data: trackerData, error: trackerError } = await supabase
  //         .from("Tracker")
  //         .select("*")
  //         .range(0, 99999)

  //       if (trackerError) throw trackerError;

  //       const { data: fmsData, error: fmsError } = await supabase
  //         .from("FMS")
  //         .select("complaint_id, id_number");

  //       if (fmsError) throw fmsError;

  //       // 🔴 ID Number mapping (same logic)
  //       const idNumberMap = {};
  //       fmsData.forEach((row) => {
  //         idNumberMap[String(row.complaint_id).trim()] = row.id_number;
  //       });

  //       const pendingData = [];
  //       const historyData = [];

  //       trackerData.forEach((row) => {
  //         const task = {
  //           id: row.serial_no,
  //           serialNo: row.serial_no,
  //           complaintId: row.complaint_id,
  //           idNumber: idNumberMap[String(row.complaint_id).trim()] || "-",

  //           technicianName: row.technician_name,
  //           technicianContact: row.technician_number,
  //           beneficiaryName: row.beneficiary_name,
  //           contactNumber: row.contact_number,

  //           village: row.village,
  //           block: row.block,
  //           district: row.district,

  //           product: row.product,
  //           make: row.make,

  //           systemVoltage: row.system_voltage,
  //           natureOfComplaint: row.nature_of_complaint,

  //           uploadDocuments: row.upload_documents,
  //           geotagPhoto: row.geotag_photo,

  //           remarks: row.action_taken,
  //           trackerStatus: row.tracker_status,

  //           assigneeName: "",

  //           plannedDate: row.planned,
  //           actualDate: row.actual,

  //           columnV: row.planned,
  //           columnW: row.actual,
  //           checked: row.checked,
  //           remark: row.remark,
  //         };

  //         const hasColumnV = row.planned !== null;
  //         const hasColumnW = row.actual !== null;

  //         if (hasColumnV && !hasColumnW) {
  //           pendingData.push(task);
  //         } else if (hasColumnV && hasColumnW) {
  //           historyData.push(task);
  //         }
  //       });

  //       setPendingTasks(pendingData);
  //       setHistoryTasks(historyData);

  //     } catch (err) {
  //       console.error("❌ Fetch error:", err);
  //       setError(err.message);
  //       setPendingTasks([]);
  //       setHistoryTasks([]);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchTasks()
  //   fetchCheckedOptions()
  // }, [])



  useEffect(() => {
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🚀 Fetching from Supabase...");

      // 🔥 Batch Fetch Logic
      let allTrackerData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("Tracker")
          .select("*")
          .order("id", { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allTrackerData = [...allTrackerData, ...data];
          from += batchSize;

          console.log(`✅ Loaded ${allTrackerData.length} rows`);
        } else {
          hasMore = false;
        }
      }

      const trackerData = allTrackerData;

      const { data: fmsData, error: fmsError } = await supabase
        .from("FMS")
        .select("complaint_id, id_number");

      if (fmsError) throw fmsError;

      // 🔴 ID Number mapping (same logic)
      const idNumberMap = {};
      fmsData.forEach((row) => {
        idNumberMap[String(row.complaint_id).trim()] = row.id_number;
      });

      const pendingData = [];
      const historyData = [];

      trackerData.forEach((row) => {
        const task = {
          id: row.serial_no,
          serialNo: row.serial_no,
          complaintId: row.complaint_id,
          idNumber: idNumberMap[String(row.complaint_id).trim()] || "-",

          technicianName: row.technician_name,
          technicianContact: row.technician_number,
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

          assigneeName: "",

          plannedDate: row.planned,
          actualDate: row.actual,

          columnV: row.planned,
          columnW: row.actual,
          checked: row.checked,
          remark: row.remark,
        };

        const hasColumnV = row.planned !== null;
        const hasColumnW = row.actual !== null;

        if (hasColumnV && !hasColumnW) {
          pendingData.push(task);
        } else if (hasColumnV && hasColumnW) {
          historyData.push(task);
        }
      });

      setPendingTasks(pendingData);
      setHistoryTasks(historyData);

    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
      setPendingTasks([]);
      setHistoryTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  fetchTasks();
  fetchCheckedOptions();
}, []);





  const fetchCheckedOptions = async () => {
    try {
      console.log("🚀 Fetching checked options from Supabase...");

      const { data, error } = await supabase
        .from("Master")
        .select("checked");

      if (error) throw error;

      const options = data
        .map((row) => row.checked)
        .filter(Boolean);

      setCheckedOptions([...new Set(options)]);

    } catch (err) {
      console.error("❌ Error fetching options:", err);
    }
  };




  const handleUpdateTask = async () => {
    setIsSubmitting(true);

    try {
      const task = pendingTasks.find(t => t.id === selectedTask);
      if (!task) throw new Error("Task not found");

      const actualDate = new Date();

      const { error } = await supabase
        .from("Tracker")
        .update({
          checked: checked,
          remark: remark || "",
          actual: actualDate,
        })
        .eq("serial_no", task.serialNo);

      if (error) throw error;

      const updatedTask = {
        ...task,
        checked: checked,
        remark: remark,
        actualDate: actualDate,
      };

      setPendingTasks(prev => prev.filter(t => t.serialNo !== task.serialNo));

      setHistoryTasks(prev => {
        const exists = prev.some(t => t.serialNo === task.serialNo);
        if (exists) {
          return prev.map(t => t.serialNo === task.serialNo ? updatedTask : t);
        }
        return [...prev, updatedTask];
      });

      alert(`Task ${selectedTask} updated successfully`);

      setIsDialogOpen(false);
      resetDialogState();

    } catch (err) {
      console.error("❌ Update error:", err);
      alert("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialogState = () => {
    setSelectedTask(null)
    setSelectedTaskData(null)
    setChecked("")
    setRemark("")
  }

  const getCurrentTasks = () => {
    return activeTab === "pending" ? pendingTasks : historyTasks
  }

  const filteredTasks = getCurrentTasks().filter((task) => {
    if (!searchTerm || searchTerm.trim() === "") return true

    const searchFields = [
      task.serialNo,
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
      task.systemVoltage,
      task.natureOfComplaint,
      task.remarks,
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
            <div className="text-gray-500">Loading complaint tracker data...</div>
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
        <h1 className="text-2xl font-bold mb-6">Complaint Tracker</h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Pending ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              History ({historyTasks.length})
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="mb-4">
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
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            {filteredTasks.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">
                  {activeTab === "pending"
                    ? "No pending complaints found"
                    : "No complaint history found"
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {filteredTasks.map((task, index) => (
                    <div key={task.serialNo || index} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{task.serialNo}</span>
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">{task.trackerStatus}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Complaint ID</span>
                          <span className="text-gray-900 font-medium">{task.complaintId}</span>
                        </div>
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

                        {/* Documents & Photos */}
                        {(task.uploadDocuments || task.geotagPhoto) && (
                          <div className="flex gap-2 mt-2">
                            {task.uploadDocuments && (
                              <a href={task.uploadDocuments} target="_blank" rel="noopener noreferrer"
                                className="flex-1 text-center bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">
                                📄 Doc
                              </a>
                            )}
                            {task.geotagPhoto && (
                              <a href={task.geotagPhoto} target="_blank" rel="noopener noreferrer"
                                className="flex-1 text-center bg-green-50 text-green-600 px-2 py-1 rounded text-xs">
                                📷 Photo
                              </a>
                            )}
                          </div>
                        )}

                        {/* History specific fields */}
                        {activeTab === "history" && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex justify-between text-xs items-center">
                              <span className="text-gray-500">Status</span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${task.checked === 'Approved' ? 'bg-green-100 text-green-800' :
                                task.checked === 'Reject' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {task.checked}
                              </span>
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
                                setChecked(task.checked || "")
                                setRemark(task.remark || "")
                              }}
                            >
                              Review
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View - Fixed Header & Scrollable Body */}
                <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0 max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          {activeTab === "pending" && (
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Actions
                            </th>
                          )}
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Serial No
                          </th>
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
                            Tracker Status
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
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTasks.map((task, index) => (
                          <tr key={task.serialNo || index} className="hover:bg-gray-50">
                            {activeTab === "pending" && (
                              <td className="px-3 py-4 whitespace-nowrap">
                                <button
                                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 border-0 py-1 px-3 rounded-md"
                                  onClick={() => {
                                    setSelectedTask(task.id)
                                    setSelectedTaskData(task)
                                    setIsDialogOpen(true)
                                    setChecked(task.checked || "")
                                    setRemark(task.remark || "")
                                  }}
                                >
                                  Review
                                </button>
                              </td>
                            )}
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{task.serialNo}</td>
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
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.checked === 'Approved' ? 'bg-green-100 text-green-800' :
                                    task.checked === 'Reject' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {task.checked}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm max-w-xs truncate" title={task.remark}>
                                  {task.remark}
                                </td>
                              </>
                            )}
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
                              Serial No
                            </label>
                            <input
                              type="text"
                              value={selectedTaskData?.serialNo || ""}
                              readOnly
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                            />
                          </div>

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
                              Tracker Status
                            </label>
                            <input
                              type="text"
                              value={selectedTaskData?.trackerStatus || ""}
                              readOnly
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                            />
                          </div>

                          {/* NEW FIELDS - Upload Documents */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Upload Documents
                            </label>
                            {selectedTaskData?.uploadDocuments ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value="Document Available"
                                  readOnly
                                  className="flex-1 border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                />
                                <a
                                  href={selectedTaskData.uploadDocuments}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm flex items-center"
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value="No document uploaded"
                                readOnly
                                className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                              />
                            )}
                          </div>

                          {/* NEW FIELDS - Geotag Photo */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Geotag Photo
                            </label>
                            {selectedTaskData?.geotagPhoto ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value="Photo Available"
                                  readOnly
                                  className="flex-1 border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                                />
                                <a
                                  href={selectedTaskData.geotagPhoto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm flex items-center"
                                >
                                  <MapPin className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value="No photo uploaded"
                                readOnly
                                className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                              />
                            )}
                          </div>

                          {/* NEW FIELDS - Action Taken (full width) */}
                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Action Taken
                            </label>
                            <textarea
                              value={selectedTaskData?.remarks || "No action taken yet"}
                              readOnly
                              className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-600"
                              rows="3"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="checked" className="block text-sm font-medium text-gray-700">
                              Checked
                            </label>
                            <select
                              id="checked"
                              value={checked}
                              onChange={(e) => setChecked(e.target.value)}
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select option (optional)</option>
                              {checkedOptions.map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>


                          <div className="space-y-2">
                            <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                              Remark
                            </label>
                            <textarea
                              id="remark"
                              value={remark}
                              onChange={(e) => setRemark(e.target.value)}
                              placeholder="Enter your remarks here (optional)..."
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="3"
                            />
                          </div>
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

      </div>
    </DashboardLayout>
  )
}

export default ComplaintTracker
