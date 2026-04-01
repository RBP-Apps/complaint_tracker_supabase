import DashboardLayout from "../components/DashboardLayout"
import DocumentVerificationTabs from "../components/DocumentsVerificaionTabs"

function DocumentVerificationPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Document Verification</h1>
          <p className="text-gray-500">Verify submitted documents and manage document history</p>
        </div>
        <DocumentVerificationTabs />
      </div>
    </DashboardLayout>
  )
}

export default DocumentVerificationPage
