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



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/new-complaint" element={<NewComplaintPage />} />
        <Route
          path="/dashboard/assign-complaint"
          element={<AssignComplaintPage />}
        />
        <Route path="/dashboard/tracker" element={<TrackerPage />} />
        <Route path="/dashboard/verification" element={<VerificationPage />} />
        <Route
          path="/dashboard/document-verification"
          element={<DocumentVerificationPage />}
        />
        <Route
          path="/dashboard/petrol-expenses"
          element={<PetrolExpensesPage />}
        />
        <Route path="/dashboard/Report" element={<Reportpage />} />
        <Route
          path="/dashboard/technician-dasboard"
          element={<TechnicianDashboard />}
        />
        <Route
          path="/dashboard/technician-tracker"
          element={<TechnicianTracker />}
        />
        <Route path="/dashboard/approved" element={<Approved />} />
        <Route path="/dashboard/draft-letter" element={<DraftLetter />} />
        <Route
          path="/dashboard/admin-letter/:complaintId"
          element={<AdminLetter />}
        />
        <Route
          path="/dashboard/tracker-history"
          element={<TrackerHistoryPage />}
        />
        <Route path="/dashboard/assign-vendor" element={<AssignToVendor />} />
        <Route path="/dashboard/vendor-tracker" element={<VendorTracker />} />
        <Route path="/dashboard/user-add" element={<UserAdd />} />
        <Route path="/dashboard/master-page" element={<MasterPage />} />
        <Route path="/dashboard/assign-vendor-letter" element={<AssignToVendorLetter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
