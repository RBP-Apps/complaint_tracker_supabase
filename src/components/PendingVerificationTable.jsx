"use client"

import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

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

    // Handle ISO string format (2025-05-22T07:38:28.052Z)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    }
    // Handle date format (2025-05-21)
    else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets Date constructor format like "Date(2025,4,21)"
    else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      // Extract the date parts from "Date(2025,4,21)" format
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]); // Month is 0-indexed in this format
        const day = parseInt(match[3]);
        date = new Date(year, month, day);
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

  // Function to fetch data from Google Sheets
  useEffect(() => {
    const fetchPendingTasks = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the entire sheet using Google Sheets API directly
        const sheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS"
        const response = await fetch(sheetUrl)
        const text = await response.text()

        // Extract the JSON part from the response
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}') + 1
        const jsonData = text.substring(jsonStart, jsonEnd)

        const data = JSON.parse(jsonData)

        // Process the pending verification tasks data
        if (data && data.table && data.table.rows) {
          const tasksData = []

          // Skip the header row and process the data rows
          data.table.rows.slice(3).forEach((row, index) => {
            if (row.c) {
              // Check if column AO (index 41) is not null and column AP (index 42) is null
              const hasColumnAO = row.c[43] && row.c[43].v !== null && row.c[43].v !== "";
              const isColumnAPEmpty = !row.c[44] || row.c[44].v === null || row.c[44].v === "";

              // Only include rows where column AO has data and column AP is null/empty
              if (hasColumnAO && isColumnAPEmpty) {
                // Format the date value
                let dateValue = row.c[38] ? row.c[38].v : "";
                dateValue = formatDateString(dateValue);

                const task = {
                  rowIndex: index + 6, // Actual row index in the sheet (1-indexed, +5 for header rows, +1 for 1-indexing)
                  id: row.c[1] ? row.c[1].v : `COMP-${index + 1}`, // Column B - Complaint No.
                  date: dateValue, // Column C - Date (formatted)
                  name: row.c[39] ? row.c[39].v : "", // Column D - Name
                  phone: row.c[4] ? row.c[4].v : "", // Column E - Phone
                  email: row.c[41] ? row.c[41].v : "", // Column F - Email
                  address: row.c[42] ? row.c[42].v : "", // Column G - Address
                }

                tasksData.push(task)
              }
            }
          })

          setPendingTasks(tasksData)
        }
      } catch (err) {
        console.error("Error fetching pending tasks data:", err)
        setError(err.message)
        // On error, set to empty array
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
      task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle verification form submission
  const handleVerifyTask = async () => {
    if (!verificationDate || !verificationPassword) {
      alert("Please fill in all required fields")
      return
    }

    const taskToVerify = pendingTasks.find(task => task.id === selectedTask)
    if (!taskToVerify) {
      alert("Task not found")
      return
    }

    try {
      // Format the verification date
      const formattedDate = verificationDate instanceof Date ?
        `${verificationDate.getMonth() + 1}/${verificationDate.getDate()}/${verificationDate.getFullYear()}` :
        ""

      // Prepare form data for the update
      const formData = new FormData()
      formData.append('sheetName', 'Verifications')
      formData.append('action', 'insert') // Changed from 'update' to 'insert' to add to a new row

      // Get current timestamp for the first column
      // const currentTimestamp = new Date().toLocaleString()
      const currentTimestamp = new Date().toLocaleString('en-US')

      // Create an array with columns we want to update
      // [timestamp, complaint_id, status, verification_date, verification_password]
      const rowDataArray = [
        currentTimestamp,         // First column - Timestamp
        selectedTask,             // Second column - Complaint ID
        verificationStatus,       // Third column - Verification Status
        formattedDate,            // Fourth column - Verification Date
        verificationPassword      // Fifth column - Verification Password
      ]

      // Add the JSON string of row data to the form
      formData.append('rowData', JSON.stringify(rowDataArray))

      console.log("Submitting verification data")
      console.log("Row data:", rowDataArray)

      // Google Apps Script Web App URL
      const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec"


      // Post the update
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData
      })

      // Log the response for debugging
      console.log("Verification response:", response)

      // Try to parse the JSON response if available
      try {
        const result = await response.json()
        console.log("Response JSON:", result)

        if (result.error) {
          throw new Error(result.error)
        }
      } catch (jsonError) {
        console.log("Could not parse JSON response (likely due to CORS). This is expected.")
      }

      // Update the local state to remove this task from the list
      setPendingTasks(pendingTasks.filter(task => task.id !== selectedTask))

      // Close the dialog and reset form
      setIsDialogOpen(false)
      setVerificationDate(null)
      setVerificationStatus("verified")
      setVerificationPassword("")

      alert(`Task ${selectedTask} has been verified successfully!`)
    } catch (err) {
      console.error("Error verifying task:", err)
      alert(`Error verifying task: ${err.message}`)
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

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredTasks.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No pending verification tasks found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
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