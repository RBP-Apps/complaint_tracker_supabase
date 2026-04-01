import DashboardLayout from "../components/DashboardLayout"
import ReportTabs from "../components/Report"

function AssignComplaintPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report</h1>
          {/* <p className="text-gray-500">Assign complaints to technicians for resolution</p> */}
        </div>
        <ReportTabs/>
      </div>
    </DashboardLayout>
  )
}

export default AssignComplaintPage
