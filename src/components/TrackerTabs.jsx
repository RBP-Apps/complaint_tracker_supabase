"use client"

import { useState } from "react"
import PendingTasksTable from "./PendingTasksTable"
import HistoryTasksTable from "./HistoryTasksTable"

function TrackerTabs() {
  const [activeTab, setActiveTab] = useState("pending")

  return (
    <div className="w-full">
      <div className="grid w-full grid-cols-2 mb-6 rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Pending Complaints
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "history" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          History
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="rounded-lg border-0 shadow-md bg-white">
          <PendingTasksTable />
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-lg border-0 shadow-md bg-white">
          <HistoryTasksTable />
        </div>
      )}
    </div>
  )
}

export default TrackerTabs
