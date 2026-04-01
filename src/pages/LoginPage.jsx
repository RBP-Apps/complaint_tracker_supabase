
"use client"

import { useState, useEffect } from "react";
import { Clipboard, Info } from "react-feather";
import supabase from "../utils/supabase"
function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const { data, error } = await supabase
      .from("Login")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      throw new Error("Invalid credentials");
    }

    // Extract data from Supabase row
    const userPermission = data.page_access || "";
    const userRole = data.role || "";
    const technicianName = data.username || "";
    const technicianContact = data.contact_no || "";

    // Store in localStorage (same as before)
    localStorage.setItem('currentUser', technicianName);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userPermissions', userPermission);
    localStorage.setItem('username', username);
    localStorage.setItem('technicianContact', technicianContact);

    console.log("Login successful - Stored data:", {
      currentUser: technicianName,
      userRole: userRole,
      username: username,
      technicianContact: technicianContact
    });

    // SAME redirect logic (unchanged)
    let redirectPath = "/dashboard";

    if (userRole && userRole.toLowerCase() === 'admin') {
      redirectPath = "/dashboard";
    }
    else if (userRole && userRole.toLowerCase() === 'technician') {
      redirectPath = "/dashboard/tracker";
    }
    else if (userPermission && userPermission.toLowerCase() !== "all") {
      const permissions = userPermission.split(',').map(p => p.trim().toLowerCase());

      const permissionRoutes = {
        "dashboard": "/dashboard",
        "new complaint": "/dashboard/new-complaint",
        "assign complaint": "/dashboard/assign-complaint",
        "tracker": "/dashboard/tracker",
        "verification": "/dashboard/verification",
        "document verification": "/dashboard/document-verification"
      };

      for (const permission of permissions) {
        if (permissionRoutes[permission]) {
          redirectPath = permissionRoutes[permission];
          break;
        }
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      window.location.href = redirectPath;
    }, 1000);

  } catch (error) {
    console.error("Login error:", error);
    setError("Invalid credentials. Please try again.");
    setIsLoading(false);
  }
};
  const copyCredentials = () => {
    setUsername("admin");
    setPassword("password123");
  };

  // Clear any existing login data on component mount
  useEffect(() => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('username');
    localStorage.removeItem('technicianContact');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Complaints Tracker</h1>
          <p className="text-gray-600">Login to manage and track complaints</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4 flex items-center rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <Info size={18} className="mr-2 flex-shrink-0" />
            <p>Use your assigned credentials to login</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                User ID
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your user ID"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-3 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          Complaints Tracker System v1.0
        </div>
      </div>
    </div>
  );
}

export default LoginPage;