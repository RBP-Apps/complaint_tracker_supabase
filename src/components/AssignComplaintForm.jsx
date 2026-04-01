"use client"

import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

function AssignComplaintForm({ complaintId, onClose, onSubmit }) {
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [technicians, setTechnicians] = useState([])
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true)

  const [formData, setFormData] = useState({
    technicianName: "",
    technicianContact: "",
    assigneeName: "", // Changed from "assignee" to "assigneeName"
    assigneeWhatsapp: "",
    location: "",
    complaintDetails: "",
    expectedCompletionDate: "",
    notesForTechnician: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const fetchTechnicians = async () => {
      setIsLoadingTechnicians(true)

      try {
        // Fetch the Master sheet using Google Sheets API
        const sheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=Master"
        const response = await fetch(sheetUrl)
        const text = await response.text()

        // Extract the JSON part from the response
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}') + 1
        const jsonData = text.substring(jsonStart, jsonEnd)

        const data = JSON.parse(jsonData)

        // Process the technicians data from column F (index 5)
        if (data && data.table && data.table.rows) {
          const technicianNames = []

          // Skip header rows and process data rows
          data.table.rows.slice(1).forEach((row, index) => {
            if (row.c && row.c[5] && row.c[5].v) { // Column F is index 5
              const techName = row.c[5].v.toString().trim()
              if (techName && !technicianNames.includes(techName)) {
                technicianNames.push(techName)
              }
            }
          })

          setTechnicians(technicianNames.sort()) // Sort alphabetically
        }
      } catch (err) {
        console.error("Error fetching technicians:", err)
        setTechnicians([]) // Set empty array on error
      } finally {
        setIsLoadingTechnicians(false)
      }
    }

    fetchTechnicians()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.assigneeName.trim()) {
        alert("Please enter the assignee name")
        return
      }

      if (!formData.technicianName.trim()) {
        alert("Please select or enter a technician name")
        return
      }

      if (!formData.technicianContact.trim()) {
        alert("Please enter the technician contact")
        return
      }

      if (!formData.location.trim()) {
        alert("Please enter the location")
        return
      }

      if (!formData.complaintDetails.trim()) {
        alert("Please enter complaint details")
        return
      }

      if (!expectedCompletionDate) {
        alert("Please select an expected completion date")
        return
      }


      // Create assignment data according to your Google Apps Script assignComplaint function
      const assigneeData = {
        assigneeName: formData.assigneeName, // Maps to assigneeData.assignee
        technicianName: formData.technicianName, // Maps to assigneeData.technicianName
        technicianContact: formData.technicianContact, // Maps to assigneeData.technicianContact
        assigneeWhatsapp: formData.assigneeWhatsapp, // Maps to assigneeData.assigneeWhatsapp
        location: formData.location, // Maps to assigneeData.location
        complaintDetails: formData.complaintDetails, // Maps to assigneeData.complaintDetails
        expectedCompletionDate: expectedCompletionDate.toISOString(),  // Maps to assigneeData.expectedCompletionDate
        notesForTechnician: formData.notesForTechnician // Maps to assigneeData.notes
      }

      console.log("Submitting assignment data:", assigneeData)

      // Call the parent component's onSubmit function
      if (onSubmit) {
        await onSubmit(complaintId, assigneeData)
      } else {
        throw new Error("No onSubmit function provided")
      }

    } catch (error) {
      console.error("Error submitting assignment:", error)
      alert(`Failed to assign complaint: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="assigneeName" className="block text-sm font-medium">
          Assignee Name <span className="text-red-500">*</span>
        </label>
        <input
          id="assigneeName"
          name="assigneeName"  // Changed from "assignee" to "assigneeName"
          placeholder="Enter assignee name"
          value={formData.assigneeName}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="technicianName" className="block text-sm font-medium">
          Technician Name <span className="text-red-500">*</span>
        </label>
        {isLoadingTechnicians ? (
          <div className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-500 text-sm">
            Loading technicians...
          </div>
        ) : (
          <>
            <input
              id="technicianName"
              name="technicianName"
              list="technicianOptions"
              value={formData.technicianName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              placeholder="Type or select a technician"
              autoComplete="off"
            />
            <datalist id="technicianOptions">
              {technicians.map((techName, index) => (
                <option key={index} value={techName} />
              ))}
            </datalist>
          </>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="technicianContact" className="block text-sm font-medium">
          Technician Contact <span className="text-red-500">*</span>
        </label>
        <input
          id="technicianContact"
          name="technicianContact"
          placeholder="Enter technician contact"
          value={formData.technicianContact}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md py-2 px-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="assigneeWhatsapp" className="block text-sm font-medium">
          Assignee WhatsApp Number
        </label>
        <input
          id="assigneeWhatsapp"
          name="assigneeWhatsapp"
          placeholder="Enter assignee WhatsApp number"
          value={formData.assigneeWhatsapp}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2 px-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="location" className="block text-sm font-medium">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          id="location"
          name="location"
          placeholder="Enter location details"
          value={formData.location}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md py-2 px-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="complaintDetails" className="block text-sm font-medium">
          Complaint Details <span className="text-red-500">*</span>
        </label>
        <textarea
          id="complaintDetails"
          name="complaintDetails"
          placeholder="Enter complaint details"
          value={formData.complaintDetails}
          onChange={handleChange}
          required
          rows={3}
          className="w-full border border-gray-300 rounded-md py-2 px-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="expectedCompletionDate" className="block text-sm font-medium">
          Expected Completion Date <span className="text-red-500">*</span>
        </label>
        <div className="relative w-full">
          <DatePicker
            id="expected-date-picker"
            selected={expectedCompletionDate}
            onChange={(date) => setExpectedCompletionDate(date)}
            className="w-full border border-gray-300 rounded-md py-2 px-3"
            customInput={
              <div className="w-full flex justify-start items-center text-left border border-gray-300 rounded-md py-2 px-3 bg-white cursor-pointer" style={{ width: '100%' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                {expectedCompletionDate ? expectedCompletionDate.toLocaleDateString() : "Select expected completion date"}
              </div>
            }
            wrapperClassName="w-full"
            required
            minDate={new Date()} // Prevent selecting past dates
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notesForTechnician" className="block text-sm font-medium">
          Notes for Technician
        </label>
        <textarea
          id="notesForTechnician"
          name="notesForTechnician"
          value={formData.notesForTechnician}
          onChange={handleChange}
          rows={2}
          className="w-full border border-gray-300 rounded-md py-2 px-3"
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Assigning...
            </>
          ) : (
            "Assign Complaint"
          )}
        </button>
      </div>
    </form>
  )
}

export default AssignComplaintForm