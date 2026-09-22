import { useState, useRef } from "react"
import DashboardLayout from "../components/DashboardLayout"
import TrackerTabs from "../components/TrackerTabs"
import { Download, FileText } from "react-feather"

function TrackerPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const pendingExportRef = useRef(null)
  const historyExportRef = useRef(null)

  const handleExportExcel = () => {
    if (activeTab === "pending" && pendingExportRef.current?.exportToExcel) {
      pendingExportRef.current.exportToExcel()
    } else if (activeTab === "history" && historyExportRef.current?.exportToExcel) {
      historyExportRef.current.exportToExcel()
    }
  }

  const handleExportPDF = () => {
    if (activeTab === "pending" && pendingExportRef.current?.exportToPDF) {
      pendingExportRef.current.exportToPDF()
    } else if (activeTab === "history" && historyExportRef.current?.exportToPDF) {
      historyExportRef.current.exportToPDF()
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6 p-4 md:p-8 max-w-[1700px] mx-auto w-full">
        {/* Top Header with Title and Top-Right Export Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Tracker</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and update the status of complaints</p>
          </div>

          {/* Top Right: Export to Excel & PDF */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
              title="Export to Excel"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
              title="Export to PDF"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <TrackerTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingExportRef={pendingExportRef}
          historyExportRef={historyExportRef}
        />
      </div>
    </DashboardLayout>
  )
}

export default TrackerPage
