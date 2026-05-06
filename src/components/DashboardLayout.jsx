

"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Clipboard, Home, CheckCircle, Clock, LogOut, MapPin, Menu, FileText, UserCheck, DollarSign, BarChart, Tool, Edit2 } from "react-feather";

function DashboardLayout({ children }) {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState([])
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("") // New state for user role
  const [openMenu, setOpenMenu] = useState(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Get user permissions from localStorage
  useEffect(() => {
    const storedPermissions = localStorage.getItem("userPermissions")
    const storedUsername = localStorage.getItem("username")
    const storedRole = localStorage.getItem("userRole")

    // Parse permissions - handling both "all" and comma-separated values
    if (storedPermissions) {
      if (storedPermissions.toLowerCase() === "all") {
        setUserPermissions(["all"])
      } else {
        setUserPermissions(storedPermissions.split(",").map((item) => item.trim().toLowerCase()))
      }
    }

    if (storedUsername) {
      setUsername(storedUsername)
    }

    if (storedRole) {
      setUserRole(storedRole)
    }
  }, [])

  // Check if user has permission to access a specific route
  const hasPermission = (routeName) => {
    if (!userPermissions.length) return false
    if (userPermissions.includes("all")) return true

    return userPermissions.some((permission) => routeName.toLowerCase().includes(permission.toLowerCase()))
  }

  // All possible nav items
  const allNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      permissionKey: "dashboard",
    },
    {
      name: "New Complaint",
      href: "/dashboard/new-complaint",
      icon: FileText,
      permissionKey: "new complaint",
    },
    {
      name: "Assign To Vendor",
      href: "/dashboard/assign-vendor",
      icon: FileText,
      permissionKey: "assign-vendor",
    },
    {
      name: "Vendor Tracker",
      href: "/dashboard/vendor-tracker",
      icon: FileText,
      permissionKey: "vendor-tracker",
    },
    {
      name: "Tracker",
      href: "/dashboard/tracker",
      icon: FileText,
      permissionKey: "tracker",
    },
    {
      name: "Approved",
      href: "/dashboard/approved",
      icon: CheckCircle,
      badgeColor: "bg-blue-500 hover:bg-blue-600",
      permissionKey: "approved",
    },
    {
      name: "Letter",
      icon: Edit2,
      permissionKey: "approved",
      children: [
        {
          name: "Draft Letter",
          href: "/dashboard/draft-letter",
          badgeColor: "bg-green-500 hover:bg-green-600",
        },
        {
          name: "Assign to Vendor Letter",
          href: "/dashboard/assign-vendor-letter",
          badgeColor: "bg-blue-500 hover:bg-blue-600",
        },
      ],
    },
    {
      name: "Tracker History",
      href: "/dashboard/tracker-history",
      icon: Clock,
      permissionKey: "all", // Restricted to admin (who usually have 'all' permission) or specifically added
    },
    {
      name: "Master Data",
      href: "/dashboard/master-page",
      icon: Clock,
      permissionKey: "all", // Restricted to admin (who usually have 'all' permission) or specifically added
    },
    {
      name: "Users",
      href: "/dashboard/user-add",
      icon: Clock,
      permissionKey: "all", // Restricted to admin (who usually have 'all' permission) or specifically added
    },
  ]


  // Filter nav items based on user permissions (same for all users including tech)
  const navItems = allNavItems.filter((item) => {
    if (item.name === "Tracker History") {
      return userRole && userRole.toLowerCase() === 'admin';
    }
    return hasPermission(item.permissionKey);
  })

  const handleLogout = () => {
    localStorage.removeItem("userPermissions")
    localStorage.removeItem("username")
    localStorage.removeItem("userRole")
    window.location.href = "/"
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="flex h-16 items-center border-b border-gray-700 px-4">
        <div className="bg-gray-700 p-1 rounded-full mr-3 flex items-center justify-center">
          <img
            src="/Logo.PNG"
            alt="RBP logo"
            className=" object-contain "
          />
        </div>
        <h1 className="text-xl font-bold">Complaints Tracker</h1>
      </div>

      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 border-2 border-gray-700 rounded-full overflow-hidden flex items-center justify-center bg-gray-600 text-white">
            <span>{username ? username.substring(0, 2).toUpperCase() : "AU"}</span>
          </div>
          <div>
            <p className="font-medium">{username || "User"}</p>
            <p className="text-xs text-gray-400">
              {userRole || "User"}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-5 px-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;

            // ✅ check if any child is active
            const isChildActive =
              item.children &&
              item.children.some((child) =>
                location.pathname.startsWith(child.href)
              );

            if (item.children) {
              return (
                <div key={item.name}>
                  {/* Parent */}
                  <div
                    onClick={() => setOpenMenu(openMenu === index ? null : index)}
                    className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium cursor-pointer ${isChildActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>

                  {/* ✅ IMPORTANT CHANGE HERE */}
                  {(openMenu === index || isChildActive) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChild = location.pathname === child.href;

                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            className={`block rounded-md px-3 py-2 text-sm ${isChild
                                ? "bg-gray-700 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                              }`}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium ${isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full border border-gray-700 text-white hover:bg-gray-700 hover:text-white py-2 px-4 rounded-md flex items-center justify-center"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      {isMobile && (
        <>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white border border-gray-200 shadow-sm"
          >
            <Menu />
          </button>

          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
              <div className="relative w-[280px] max-w-[80vw] bg-gray-800">
                <SidebarContent />
              </div>
            </div>
          )}
        </>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="hidden md:block md:w-64 fixed inset-y-0 left-0 z-40">
          <SidebarContent />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Top navbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden w-8"></div>
          <div className="md:hidden flex items-center">
            <Clipboard className="h-5 w-5 mr-2" />
            <h1 className="text-lg font-bold">Complaints Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 border border-gray-300">
              {username ? username.substring(0, 2).toUpperCase() : "AU"}
            </div>
          </div>
        </header>

        <main className="pb-16">{children}</main>

        <footer className="bg-gray-200 text-center py-4 text-sm text-gray-600 fixed bottom-0 left-0 right-0 md:left-64 z-30">
          <div className="flex justify-center items-center">
            <span>© {new Date().getFullYear()} Complaints Tracker. All rights reserved.</span>
            <span className="mx-2">|</span>
            <span>
              Powered By -{" "}
              <a
                href="https://www.botivate.in/"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Botivate
              </a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout

