"use client"

import { useState } from "react"
import PendingTasksTable from "./PendingTasksTable"
import HistoryTasksTable from "./HistoryTasksTable"
import { Clock, Archive } from "react-feather"

function TrackerTabs({
  activeTab: controlledActiveTab,
  setActiveTab: setControlledActiveTab,
  pendingExportRef,
  historyExportRef,
}) {
  const [internalActiveTab, setInternalActiveTab] = useState("pending")

  const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab
  const handleTabChange = (tab) => {
    if (setControlledActiveTab) {
      setControlledActiveTab(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  return (
    <div className="w-full">
      {/* Modern Segmented Tab Switcher */}
      <div className="flex items-center mb-6">
        <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
          <button
            type="button"
            onClick={() => handleTabChange("pending")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              currentTab === "pending"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
            }`}
          >
            <Clock className={`h-4 w-4 ${currentTab === "pending" ? "text-blue-600" : "text-gray-500"}`} />
            <span>Pending Complaints</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              currentTab === "history"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
            }`}
          >
            <Archive className={`h-4 w-4 ${currentTab === "history" ? "text-blue-600" : "text-gray-500"}`} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Keep both tables mounted so tab switching is instantaneous (0 delay) and state is preserved */}
      <div className={currentTab === "pending" ? "block" : "hidden"}>
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <PendingTasksTable exportRef={pendingExportRef} />
        </div>
      </div>

      <div className={currentTab === "history" ? "block" : "hidden"}>
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <HistoryTasksTable exportRef={historyExportRef} />
        </div>
      </div>
    </div>
  )
}

export default TrackerTabs

