
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, hasPageAccess, getUserPermissions } from "../utils/auth";

const ProtectedRoute = ({ children, permissionKey }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (permissionKey && !hasPageAccess(permissionKey)) {
    // If user doesn't have permission for this specific page, 
    // find a page they DO have access to
    const permissions = getUserPermissions();
    if (permissions.length > 0) {
      // Find a safe page to land on
      const permissionRoutes = {
        "dashboard": "/dashboard",
        "new complaint": "/dashboard/new-complaint",
        "assign-vendor": "/dashboard/assign-vendor",
        "vendor-tracker": "/dashboard/vendor-tracker",
        "tracker": "/dashboard/tracker",
        "approved": "/dashboard/approved",
        "draft-letter": "/dashboard/draft-letter",
        "tracker-history": "/dashboard/tracker-history",
        "master-page": "/dashboard/master-page",
      };

      for (const p of permissions) {
        const route = permissionRoutes[String(p).toLowerCase().trim()];
        if (route) return <Navigate to={route} replace />;
      }
    }
    
    // If no valid pages found, logout to be safe
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
