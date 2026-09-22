"use client"

import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import supabase from "../utils/supabase"

function PendingVerificationTable() {
  const [pendingTasks, setPendingTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [verificationDate, setVerificationDate] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState("verified")
  const [verificationPassword, setVerificationPassword] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Function to format date string to dd/mm/yyyy
  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('/') && dateValue.includes(',')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    } else {
      return String(dateValue);
    }

    if (isNaN(date.getTime())) {
      return String(dateValue);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to fetch data from Supabase
  useEffect(() => {
    const fetchPendingTasks = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [{ data: fmsData, error: fmsErr }, { data: trackerData }] = await Promise.all([
          supabase.from("FMS").select("*").order("id", { ascending: false }),
          supabase.from("Tracker").select("*").order("id", { ascending: false })
        ]);

        if (fmsErr) throw fmsErr;

        const trackerMap = new Map();
        (trackerData || []).forEach((t) => {
          if (t.complaint_id && !trackerMap.has(t.complaint_id)) {
            trackerMap.set(t.complaint_id, t);
          }
        });

        const tasksData = (fmsData || [])
          .filter((row) => {
            const isNotVerified = row.status !== "VERIFIED" && !row.verification_date;
            const hasWorkDone = row.actual1 || row.actual || row.planned1 || row.planned;
            return row.complaint_id && isNotVerified && hasWorkDone;
          })
          .map((row, index) => {
            const t = trackerMap.get(row.complaint_id) || {};
            return {
              rowIndex: index + 1,
              id: row.complaint_id,
              date: formatDateString(row.actual1 || row.actual || row.close_date || t.actual || t.timestamp),
              name: t.tracker_status || row.status || "Completed",
              phone: row.company_name || "",
              email: t.upload_documents || "",
              address: t.geotag_photo || "",
            };
          });

        setPendingTasks(tasksData);
      } catch (err) {
        console.error("Error fetching pending tasks from Supabase:", err)
        setError(err.message)
        setPendingTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingTasks()
  }, [])

  // Filter tasks based on search term
  const filteredTasks = pendingTasks.filter(
    (task) =>
      task.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle task verification
  const handleVerifyTask = async () => {
    if (!verificationDate) {
      alert("Please select a verification date")
      return
    }

    if (!verificationPassword) {
      alert("Please enter a verification password")
      return
    }

    try {
      const formattedDate = verificationDate instanceof Date ?
        verificationDate.toISOString() :
        new Date().toISOString();

      // 1. Update FMS status and verification date
      const { error: fmsUpdateErr } = await supabase
        .from("FMS")
        .update({
          status: "VERIFIED",
          verification_date: formattedDate,
        })
        .eq("complaint_id", selectedTask);

      if (fmsUpdateErr) {
        console.warn("Could not update FMS verification:", fmsUpdateErr);
      }

      // 2. Insert into Verifications table
      const verificationRecord = {
        timestamp: new Date().toISOString(),
        complaint_id: selectedTask,
        status: verificationStatus,
        verification_date: formattedDate,
        password: verificationPassword,
      };

      let { error: vErr } = await supabase
        .from("Verifications")
        .insert([verificationRecord]);

      if (vErr) {
        const fallback = await supabase
          .from("verifications")
          .insert([verificationRecord]);
        if (fallback.error) {
          console.warn("Verifications table fallback error:", fallback.error);
        }
      }

      // Update local state
      setPendingTasks(pendingTasks.filter((task) => task.id !== selectedTask));
      setIsDialogOpen(false);
      setVerificationDate(null);
      setVerificationStatus("verified");
      setVerificationPassword("");

      alert(`Task ${selectedTask} has been verified successfully!`);
    } catch (err) {
      console.error("Error verifying task in Supabase:", err);
      alert(`Error verifying task: ${err.message}`);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pending verification tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl font-bold">Pending Verification Tasks</h1>

        <div className="relative">
          <input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-[200px] md:w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="overflow-x-auto overflow-y-auto max-h-[500px] -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredTasks.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No pending verification tasks found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Complaint ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Date Of Complete
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Tracker Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Company Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Upload Documents
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Geotag Photo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{task.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.phone}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">{task.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.address}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.email ? (
                        <a
                          href={`mailto:${task.email}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.email}
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.address ? (
                        <a
                          href={task.address}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.address}
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:from-purple-500 hover:to-pink-600 border-0 py-1 px-3 rounded-md"
                        onClick={() => {
                          setSelectedTask(task.id)
                          setIsDialogOpen(true)
                        }}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Verification Modal Dialog */}
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
                      Verify Task: {selectedTask}
                    </h3>
                    <div className="mt-4 max-h-[60vh] overflow-auto">
                      <div className="grid gap-4">
                        {/* Status Field */}
                        <div className="space-y-2">
                          <label htmlFor="status" className="block text-sm font-medium">
                            Status
                          </label>
                          <select
                            id="status"
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                            value={verificationStatus}
                            onChange={(e) => setVerificationStatus(e.target.value)}
                          >
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Verification Date Field */}
                        <div className="space-y-2">
                          <label htmlFor="verificationDate" className="block text-sm font-medium">
                            Verification Date *
                          </label>
                          <DatePicker
                            selected={verificationDate}
                            onChange={(date) => setVerificationDate(date)}
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                            dateFormat="MM/dd/yyyy"
                            placeholderText="Select date"
                            isClearable
                            showYearDropdown
                            dropdownMode="select"
                          />
                        </div>

                        {/* Verification Password Field */}
                        <div className="space-y-2">
                          <label htmlFor="verificationPassword" className="block text-sm font-medium">
                            Verification Password *
                          </label>
                          <input
                            id="verificationPassword"
                            type="password"
                            placeholder="Enter verification password"
                            className="w-full border border-gray-300 rounded-md py-2 px-3"
                            value={verificationPassword}
                            onChange={(e) => setVerificationPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsDialogOpen(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyTask}
                        className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white py-2 px-4 rounded-md flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Confirm Verification
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

export default PendingVerificationTable