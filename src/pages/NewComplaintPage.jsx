import DashboardLayout from "../components/DashboardLayout"
import NewComplaintForm from "../components/NewComplaintForm"

function NewComplaintPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Complaint</h1>
          <p className="text-gray-500">Create a new complaint record</p>
        </div>
        <NewComplaintForm />
      </div>
    </DashboardLayout>
  )
}

export default NewComplaintPage
