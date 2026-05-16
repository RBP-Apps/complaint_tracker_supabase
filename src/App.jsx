import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NewComplaintPage from "./pages/NewComplaintPage";
import AssignComplaintPage from "./pages/AssignComplaintPage";
import TrackerPage from "./pages/TrackerPage";
import VerificationPage from "./pages/VerificationPage";
import DocumentVerificationPage from "./pages/DocumentVerficationPage";
import PetrolExpensesPage from "./pages/PetrolExpensesPage";
import Reportpage from "./pages/Reportpage";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianTracker from "./pages/TechnicianTracker";
import Approved from "./pages/Approved";
import DraftLetter from "./pages/DraftLetter";
import AdminLetter from "./pages/AdminLetter";
import TrackerHistoryPage from "./pages/TrackerHistoryPage";

import AssignToVendor from "./components/AssignToVendor";
import VendorTracker from "./components/VendorTracker";
import AssignToVendorLetter from "./components/AssignToVendorLetter"

import UserAdd from "./pages/AddUser"
import MasterPage from "./pages/MasterAdd"


import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permissionKey="dashboard">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/new-complaint"
          element={
            <ProtectedRoute permissionKey="new complaint">
              <NewComplaintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/assign-complaint"
          element={
            <ProtectedRoute permissionKey="assign-complaint">
              <AssignComplaintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tracker"
          element={
            <ProtectedRoute permissionKey="tracker">
              <TrackerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/verification"
          element={
            <ProtectedRoute permissionKey="verification">
              <VerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/document-verification"
          element={
            <ProtectedRoute permissionKey="document-verification">
              <DocumentVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/petrol-expenses"
          element={
            <ProtectedRoute permissionKey="petrol-expenses">
              <PetrolExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/Report"
          element={
            <ProtectedRoute permissionKey="report">
              <Reportpage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/technician-dasboard"
          element={
            <ProtectedRoute permissionKey="tracker">
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/technician-tracker"
          element={
            <ProtectedRoute permissionKey="tracker">
              <TechnicianTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/approved"
          element={
            <ProtectedRoute permissionKey="approved">
              <Approved />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/draft-letter"
          element={
            <ProtectedRoute permissionKey="draft-letter">
              <DraftLetter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin-letter/:complaintId"
          element={
            <ProtectedRoute permissionKey="approved">
              <AdminLetter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tracker-history"
          element={
            <ProtectedRoute permissionKey="tracker-history">
              <TrackerHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/assign-vendor"
          element={
            <ProtectedRoute permissionKey="assign-vendor">
              <AssignToVendor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/vendor-tracker"
          element={
            <ProtectedRoute permissionKey="vendor-tracker">
              <VendorTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/user-add"
          element={
            <ProtectedRoute permissionKey="user-add">
              <UserAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/master-page"
          element={
            <ProtectedRoute permissionKey="master-page">
              <MasterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/assign-vendor-letter"
          element={
            <ProtectedRoute permissionKey="approved">
              <AssignToVendorLetter />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
