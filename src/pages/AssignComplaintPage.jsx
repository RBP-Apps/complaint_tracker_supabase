import DashboardLayout from "../components/DashboardLayout"
import AssignComplaintTabs from "../components/AssignComplaintTabs"

function AssignComplaintPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign Complaint</h1>
          <p className="text-gray-500">Assign complaints to technicians for resolution</p>
        </div>
        <AssignComplaintTabs />
      </div>
    </DashboardLayout>
  )
}

export default AssignComplaintPage
