import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Plus, Calendar, Activity, ShieldCheck, Sparkles } from "lucide-react"
import DashboardLayout from "../components/DashboardLayout"
import DashboardStats from "../components/DashboardStats"
import ComplaintsByRegion from "../components/ComplaintsByRegion"
import DasbhoardPendingTask from "../components/DashboardPendingTable"

function DashboardPage() {
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    setUsername(localStorage.getItem("username") || localStorage.getItem("currentUser") || "User")
    setUserRole(localStorage.getItem("userRole") || "Staff")
  }, [])

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen">
        
        {/* Executive Welcome & Header Banner */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/80 via-indigo-50/40 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  System Active
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wide">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  {userRole}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {currentDate}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Welcome back, <span className="capitalize text-blue-600">{username}</span></span>
                <span className="text-2xl hidden sm:inline">👋</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time overview of complaint resolutions, pending tasks, and regional performance.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <Link
                to="/dashboard/new-complaint"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span>Add Complaint</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats KPI Cards */}
        <DashboardStats />

        {/* Pending Tasks & Overdue Tracker Table */}
        <DasbhoardPendingTask />

        {/* District / Regional Breakdown Analysis */}
        <ComplaintsByRegion />

      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
