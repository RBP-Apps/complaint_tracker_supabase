import DashboardLayout from "../components/DashboardLayout"
import TrackerTabs from "../components/TrackerTabs"

function TrackerPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tracker</h1>
          <p className="text-gray-500">Track and update the status of complaints</p>
        </div>
        <TrackerTabs />
      </div>
    </DashboardLayout>
  )
}

export default TrackerPage
