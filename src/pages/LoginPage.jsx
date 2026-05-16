
"use client"

import { useState, useEffect } from "react";
import { Clipboard, Info } from "react-feather";
import { Eye, EyeOff } from "lucide-react";


import supabase from "../utils/supabase"
import { clearAuth } from "../utils/auth";
function LoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      // More flexible query without .single() to prevent common errors
      const { data: users, error: dbError } = await supabase
        .from("Login")
        .select("*")
        .eq("username", cleanUsername);

      if (dbError) {
        console.error("Database Error:", dbError);
        throw new Error("Database connection error");
      }

      console.log("Database search result:", users);

      if (!users || users.length === 0) {
        console.warn("Login Failed: No user found with username:", cleanUsername);
        throw new Error("User ID not found");
      }

      // Check password manually to provide better error messages
      const userMatch = users.find(u => u.password === cleanPassword);
      
      if (!userMatch) {
        console.warn("Login Failed: Password incorrect for user:", cleanUsername);
        throw new Error("Incorrect password");
      }

      const data = userMatch;

      // Extract data from Supabase row
      const userPermission = Array.isArray(data.page_access) ? data.page_access : [];
      const userRole = String(data.role || "").toLowerCase();
      const technicianName = String(data.username || "");
      const technicianContact = String(data.contact_no || "");

      console.log("Login successful - Processed User Data:", {
        technicianName,
        userRole,
        userPermission,
      });

      // Store in localStorage
      localStorage.setItem('currentUser', technicianName);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userPermissions', JSON.stringify(userPermission));
      localStorage.setItem('username', username);
      localStorage.setItem('technicianContact', technicianContact);

      // Redirect logic based on role and permissions
      let redirectPath = "/dashboard";

      if (userRole === 'admin') {
        redirectPath = "/dashboard";
      } else if (userRole === 'tech' || userRole === 'technician') {
        redirectPath = "/dashboard/tracker";
      } else {
        // Find the first matching route for the user's permissions
        const permissionRoutes = {
          "dashboard": "/dashboard",
          "new complaint": "/dashboard/new-complaint",
          "assign complaint": "/dashboard/assign-complaint",
          "tracker": "/dashboard/tracker",
          "verification": "/dashboard/verification",
          "document verification": "/dashboard/document-verification",
          "assign-vendor": "/dashboard/assign-vendor",
          "vendor-tracker": "/dashboard/vendor-tracker"
        };

        // Priority redirect to tracker if available
        let foundPath = false;
        for (const permission of userPermission) {
          const key = String(permission || "").toLowerCase().trim();
          if (key === "tracker" || key === "all") {
            redirectPath = "/dashboard/tracker";
            foundPath = true;
            break;
          }
        }

        if (!foundPath) {
          for (const permission of userPermission) {
            const key = String(permission || "").toLowerCase().trim();
            if (permissionRoutes[key]) {
              redirectPath = permissionRoutes[key];
              break;
            }
          }
        }
      }

      console.log("Redirecting to:", redirectPath);

      setTimeout(() => {
        setIsLoading(false);
        window.location.href = redirectPath;
      }, 1000);

    } catch (error) {
      console.error("Login detail error:", error);
      setError("Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };



  // Clear any existing login data on component mount
  useEffect(() => {
    clearAuth();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">

          {/* Row 1 */}
          <div className="flex items-center justify-center gap-6">

            <img
              src="/Logo.PNG"
              alt="logo"
              className="w-28 h-28 object-contain"
            />

            <h1 className="text-4xl font-bold text-gray-800 leading-tight text-left">
              Complaints Tracker
            </h1>

          </div>

          {/* Row 2 */}
          <p className="text-gray-600 mt-4">
            Login to manage and track complaints
          </p>

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

      <div className="relative">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-11 w-full rounded-md border border-gray-300 px-3 pr-10 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your password"
        />

        {/* Eye Icon */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
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