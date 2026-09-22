"use client"

import { useState, useEffect } from "react"
import supabase from "../utils/supabase"

function VerifiedTasksTable() {
  const [verifiedTasks, setVerifiedTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
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
    const fetchVerifiedTasks = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let { data, error: vErr } = await supabase
          .from("Verifications")
          .select("*")
          .order("id", { ascending: false });

        if (vErr) {
          const fallback = await supabase
            .from("verifications")
            .select("*")
            .order("id", { ascending: false });
          if (!fallback.error) {
            data = fallback.data;
            vErr = null;
          }
        }

        // If no records in Verifications table, also check FMS for verified tasks
        if (!data || data.length === 0) {
          const { data: fmsData } = await supabase
            .from("FMS")
            .select("*")
            .or("status.eq.VERIFIED,verification_date.not.is.null")
            .order("id", { ascending: false });

          if (fmsData && fmsData.length > 0) {
            data = fmsData.map((r) => ({
              timestamp: r.timestamp || r.created_at,
              complaint_id: r.complaint_id,
              status: "VERIFIED",
              verification_date: r.verification_date,
              password: "—",
            }));
          }
        }

        const tasksData = (data || []).map((row, index) => ({
          rowIndex: index + 1,
          timestamp: formatDateString(row.timestamp || row.created_at),
          complaintId: row.complaint_id || row.complaintId || "",
          status: row.status || "Verified",
          verificationDate: formatDateString(row.verification_date || row.verificationDate),
          password: row.password || "—",
        }));

        setVerifiedTasks(tasksData);
      } catch (err) {
        console.error("Error fetching verified tasks from Supabase:", err)
        setError(err.message)
        setVerifiedTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchVerifiedTasks()
  }, [])

  // Filter tasks based on search term
  const filteredTasks = verifiedTasks.filter(
    (task) =>
      task.complaintId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.timestamp?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading verified tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-red-500">Error loading verified tasks: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl font-bold">Verified Tasks</h1>

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
              <p className="text-gray-500">No verified tasks found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Timestamp
                  </th>
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
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Verification Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Password
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{task.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{task.complaintId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${task.status?.toLowerCase() === 'verified' ? 'bg-green-500' :
                        task.status?.toLowerCase() === 'rejected' ? 'bg-red-500' : 'bg-gray-500'

                        }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.verificationDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifiedTasksTable