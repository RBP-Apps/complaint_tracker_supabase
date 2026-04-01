"use client"

import { useState, useEffect, useMemo } from "react"
import supabase from "../utils/supabase";



function ComplaintsByRegion() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const loggedInUser = localStorage.getItem("username")
    const loggedInRole = localStorage.getItem("userRole")
    if (loggedInUser) setUser(loggedInUser)
    if (loggedInRole) setUserRole(loggedInRole)
  }, [])

  const formatDateString = (dateValue) => {
    if (!dateValue) return ""
    let date
    if (typeof dateValue === "number" && dateValue > 40000) {
      const googleEpoch = new Date(1899, 11, 30)
      date = new Date(googleEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000)
    } else if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
      const match = dateValue.match(
        /Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/
      )
      if (match) {
        const year = parseInt(match[1])
        const month = parseInt(match[2])
        const day = parseInt(match[3])
        date = new Date(year, month, day)
      } else {
        return dateValue
      }
    } else if (typeof dateValue === "object" && dateValue && dateValue.getDate) {
      date = dateValue
    } else {
      return dateValue
    }
    if (!date || isNaN(date.getTime())) return dateValue
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

useEffect(() => {
  const fetchComplaints = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("FMS")
        .select("*")

      if (error) throw error

      const complaintData = []

      data.forEach((row) => {
        const complaint = {
          complaintId: row.complaint_id || "",
          companyName: row.company_name || "",
          modeOfCall: row.mode_of_call || "",
          idNumber: row.id_number || "",
          projectName: row.project_name || "",
          complaintNumber: row.complaint_number || "",
          complaintDate: row.complaint_date
            ? formatDateString(row.complaint_date)
            : "",
          beneficiaryName: row.beneficiary_name || "",
          contactNumber: row.contact_number || "",
          village: row.village || "",
          block: row.block || "",
          district: row.district || "",
          product: row.product || "",
          make: row.make || "",
          rating: row.rating || "",
          qty: row.qty || "",
          insuranceType: row.insurance_type || "",
          natureOfComplaint: row.nature_of_complaint || "",
          technicianName: row.technician_name || "",
          technicianContact: row.technician_contact || "",
          assigneeWhatsApp: row.assignee_whatsapp_number || "",
          status: row.status || "Open",
          closeDate:
            row.status === "APPROVED-CLOSE" && row.close_date
              ? formatDateString(row.close_date)
              : "",
        }

        if (complaint.complaintId) {
          complaintData.push(complaint)
        }
      })

      setComplaints(complaintData)

    } catch (err) {
      console.error("Error fetching complaints data:", err)
      setError(err.message || "Error")
      setComplaints([])
    } finally {
      setIsLoading(false)
    }
  }

  fetchComplaints()
}, [])




  const getFilteredComplaintsByRole = () => {
    let roleFilteredComplaints = complaints
    if (!userRole) return roleFilteredComplaints
    const roleLower = userRole.toLowerCase()
    if (roleLower === "admin" || roleLower === "user") return roleFilteredComplaints
    if (roleLower === "tech") {
      if (user) {
        roleFilteredComplaints = complaints.filter(
          (complaint) => complaint.technicianName === user
        )
      } else {
        roleFilteredComplaints = []
      }
    }
    return roleFilteredComplaints
  }

  const filteredComplaints = getFilteredComplaintsByRole().filter(
    (complaint) => {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        String(complaint.beneficiaryName || "")
          .toLowerCase()
          .includes(search) ||
        String(complaint.complaintId || "").toLowerCase().includes(search) ||
        String(complaint.village || "").toLowerCase().includes(search) ||
        String(complaint.district || "").toLowerCase().includes(search) ||
        String(complaint.projectName || "").toLowerCase().includes(search) ||
        String(complaint.natureOfComplaint || "").toLowerCase().includes(
          search
        ) ||
        String(complaint.complaintNumber || "").toLowerCase().includes(
          search
        ) ||
        String(complaint.technicianName || "").toLowerCase().includes(search)

      return matchesSearch
    }
  )

  const districtSummary = useMemo(() => {
    const map = new Map()

    filteredComplaints.forEach((c) => {
      const key = c.district || "UNKNOWN"
      if (!map.has(key)) {
        map.set(key, {
          district: key,
          total: 0,
          resolved: 0,
          pending: 0,
        })
      }
      const entry = map.get(key)
      entry.total += 1

      const s = String(c.status || "").toUpperCase()
      if (s.includes("APPROVED-CLOSE") || s.includes("COMPLETED")) {
        entry.resolved += 1
      } else {
        entry.pending += 1
      }
    })

    return Array.from(map.values()).sort((a, b) =>
      a.district.localeCompare(b.district)
    )
  }, [filteredComplaints])

  const grandTotals = useMemo(() => {
    return districtSummary.reduce(
      (acc, d) => {
        acc.total += d.total
        acc.resolved += d.resolved
        acc.pending += d.pending
        return acc
      },
      { total: 0, resolved: 0, pending: 0 }
    )
  }, [districtSummary])

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading complaints data...</div>
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
    <div className="bg-white rounded-lg shadow p-6">
      {/* HEADER */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold">
          Complaint Tracker
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredComplaints.length} records)
          </span>
          {userRole && (
            <span className="ml-2 text-sm font-normal text-blue-600">
              Role: {userRole}
            </span>
          )}
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center">
            <input
              type="search"
              placeholder="Search complaints..."
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* DISTRICT DASHBOARD - STICKY HEADER */}
      <div className="mb-2 max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
        <div className="flex items-center bg-blue-50 px-4 py-2 text-xs font-semibold text-gray-600 sticky top-0 z-10">
          <div className="w-6 text-center">✓</div>
          <div className="flex-1">District</div>
          <div className="w-24 text-center">Total Complaint</div>
          <div className="w-24 text-center">Resolved</div>
          <div className="w-24 text-center">Pending</div>
        </div>

        <div className="divide-y divide-gray-100">
          {districtSummary.map((d) => (
            <div
              key={d.district}
              className="flex items-center px-4 py-2 hover:bg-gray-50 text-sm"
            >
              <div className="w-6 text-center">
                <input type="checkbox" className="h-4 w-4" checked readOnly />
              </div>
              <div className="flex-1 font-semibold text-gray-700">
                {d.district}
              </div>
              <div className="w-24 text-center">
                <span className="inline-flex items-center justify-center min-w-[32px] rounded-full bg-gray-200 text-xs font-bold text-gray-700 px-2 py-0.5">
                  {d.total}
                </span>
              </div>
              <div className="w-24 text-center">
                <span className="inline-flex items-center justify-center min-w-[32px] rounded-full bg-green-500 text-xs font-bold text-white px-2 py-0.5">
                  {d.resolved}
                </span>
              </div>
              <div className="w-24 text-center">
                <span className="inline-flex items-center justify-center min-w-[32px] rounded-full bg-orange-400 text-xs font-bold text-white px-2 py-0.5">
                  {d.pending}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOTAL BAR */}
      <div className="mt-2 flex items-center border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 overflow-hidden">
        <div className="flex-1 px-4 py-2 flex items-center gap-2">
          <span>Total Complaint</span>
          <span className="inline-flex items-center justify-center min-w-[40px] rounded-full bg-red-500 text-white px-2 py-0.5">
            {grandTotals.total}
          </span>
        </div>
        <div className="flex-1 px-4 py-2 flex items-center gap-2 justify-center border-l border-gray-200">
          <span>Closed Complaint</span>
          <span className="inline-flex items-center justify-center min-w-[40px] rounded-full bg-green-500 text-white px-2 py-0.5">
            {grandTotals.resolved}
          </span>
        </div>
        <div className="flex-1 px-4 py-2 flex items-center gap-2 justify-end border-l border-gray-200">
          <span>Pending Complaint</span>
          <span className="inline-flex items-center justify-center min-w-[40px] rounded-full bg-yellow-400 text-white px-2 py-0.5">
            {grandTotals.pending}
          </span>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} Complaints Tracker. All rights reserved. |
        Powered By - Botivate
      </div>
    </div>
  )
}

export default ComplaintsByRegion
