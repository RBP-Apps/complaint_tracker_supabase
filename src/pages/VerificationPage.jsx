import DashboardLayout from "../components/DashboardLayout"
import VerificationTabs from "../components/VerificationTabs"

function VerificationPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Verification</h1>
          <p className="text-gray-500">Verify completed tasks and complaints</p>
        </div>
        <VerificationTabs />
      </div>
    </DashboardLayout>
  )
}

export default VerificationPage
