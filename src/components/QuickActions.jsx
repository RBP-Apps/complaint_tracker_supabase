import { Link } from "react-router-dom"
import { PlusCircle, Clipboard, CheckCircle, BarChart, Download, UserCheck } from "react-feather"

function QuickActions() {
  return (
    <div className="rounded-lg border-0 shadow-lg bg-white">
      <div className="pb-2 p-6">
        <h3 className="text-lg font-medium">Quick Actions</h3>
      </div>
      <div className="pt-0 px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/dashboard/new-complaint" className="col-span-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Complaint
            </button>
          </Link>

          <Link to="/dashboard/assign-complaint">
            <button className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-md flex items-center justify-center">
              <UserCheck className="mr-2 h-4 w-4" />
              Assign Complaint
            </button>
          </Link>

          <Link to="/dashboard/tracker">
            <button className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-md flex items-center justify-center">
              <Clipboard className="mr-2 h-4 w-4" />
              Track Complaints
            </button>
          </Link>

          <Link to="/dashboard/verification">
            <button className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-md flex items-center justify-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Complaints
            </button>
          </Link>

          <button className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-md flex items-center justify-center">
            <BarChart className="mr-2 h-4 w-4" />
            Generate Report
          </button>

          <button className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-md flex items-center justify-center">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuickActions
