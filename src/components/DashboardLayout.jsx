"use client"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  PlusCircle,
  Share2,
  Activity,
  ClipboardList,
  CheckCircle2,
  FileText,
  FileEdit,
  FileCheck,
  History,
  Database,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  Wrench,
  User as UserIcon,
  Sparkles
} from "lucide-react";
import { getUserPermissions, getUserRole, hasPageAccess, clearAuth } from "../utils/auth";

function DashboardLayout({ children }) {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState([])
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("") 
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Get user permissions using utilities
  useEffect(() => {
    setUserPermissions(getUserPermissions())
    setUserRole(getUserRole())
    setUsername(localStorage.getItem("username") || "")
  }, [])

  // Check if user has permission to access a specific route
  const hasPermission = (permissionKey) => {
    return hasPageAccess(permissionKey);
  }

  // All possible nav items with 100% UNIQUE icons
  const allNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      permissionKey: "dashboard",
    },
    {
      name: "New Complaint",
      href: "/dashboard/new-complaint",
      icon: PlusCircle,
      permissionKey: "new complaint",
    },
    {
      name: "Assign To Vendor",
      href: "/dashboard/assign-vendor",
      icon: Share2,
      permissionKey: "assign-vendor",
    },
    {
      name: "Vendor Tracker",
      href: "/dashboard/vendor-tracker",
      icon: Activity,
      permissionKey: "vendor-tracker",
    },
    {
      name: "Complaint Tracker",
      href: "/dashboard/tracker",
      icon: ClipboardList,
      permissionKey: "tracker",
    },
    {
      name: "Approved",
      href: "/dashboard/approved",
      icon: CheckCircle2,
      permissionKey: "approved",
    },
    {
      name: "Letter Management",
      icon: FileText,
      permissionKey: "approved",
      children: [
        {
          name: "Draft Letter",
          href: "/dashboard/draft-letter",
          icon: FileEdit,
        },
        {
          name: "Assign to Vendor Letter",
          href: "/dashboard/assign-vendor-letter",
          icon: FileCheck,
        },
      ],
    },
    {
      name: "Tracker History",
      href: "/dashboard/tracker-history",
      icon: History,
      permissionKey: "tracker-history",
    },
    {
      name: "Master Data",
      href: "/dashboard/master-page",
      icon: Database,
      permissionKey: "master-page",
    },
    {
      name: "User Management",
      href: "/dashboard/user-add",
      icon: Users,
      permissionKey: "user-add",
    },
  ]

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter((item) => {
    return hasPermission(item.permissionKey);
  })

  // Find active page title for header
  const getActivePageTitle = () => {
    for (const item of allNavItems) {
      if (item.href === location.pathname) return item.name;
      if (item.children) {
        const child = item.children.find(c => c.href === location.pathname);
        if (child) return child.name;
      }
    }
    if (location.pathname.includes("/admin-letter")) return "Admin Letter";
    return "Complaints Tracker";
  }

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/"
  }

  const getRoleBadge = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Shield size={10} /> Admin
        </span>
      );
    }
    if (["tech", "technician"].includes(r)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Wrench size={10} /> Tech
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
        <UserIcon size={10} /> User
      </span>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-[#0b1120]/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-35 shadow-sm overflow-hidden">
            <img
              src="/RBP-Logo.PNG"
              alt="RBP Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              Complaints Tracker
            </h1>
          
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
          Main Navigation
        </div>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          const isChildActive =
            item.children &&
            item.children.some((child) =>
              location.pathname.startsWith(child.href)
            );
          const isDropdownOpen = openMenu === index || isChildActive;

          if (item.children) {
            return (
              <div key={item.name} className="space-y-1">
                {/* Parent Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === index ? null : index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isChildActive
                      ? "bg-slate-800/80 text-blue-400 border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={18}
                      className={isChildActive ? "text-blue-400" : "text-slate-400"}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isDropdownOpen ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>

                {/* Submenu Items */}
                {isDropdownOpen && (
                  <div className="pl-6 pr-1 space-y-1 border-l-2 border-slate-800 ml-4 py-1 animate-in fade-in duration-150">
                    {item.children.map((child) => {
                      const isChild = location.pathname === child.href;
                      const ChildIcon = child.icon || FileText;

                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                            isChild
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                          }`}
                        >
                          <ChildIcon
                            size={15}
                            className={isChild ? "text-white" : "text-slate-400"}
                          />
                          <span className="truncate">{child.name}</span>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? "text-white" : "text-slate-400"}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0b1120]/40">
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {username ? username.substring(0, 2).toUpperCase() : "AU"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {username || "User"}
              </p>
              <div className="mt-0.5">
                {getRoleBadge(userRole)}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all duration-150 cursor-pointer shadow-xs"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans antialiased">
      {/* Mobile Drawer */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      {!isMobile && (
        <aside className="hidden md:block md:w-64 fixed inset-y-0 left-0 z-30 shadow-xl">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 shadow-xs flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800 leading-tight">
                {getActivePageTitle()}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Complaint Tracking & Service Operations Portal
              </p>
            </div>
          </div>

          {/* Right Header User Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                {username ? username.substring(0, 2).toUpperCase() : "AU"}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                {username || "User"}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-16">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-3.5 px-4 md:px-8 text-center text-xs text-slate-500">
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span>© {new Date().getFullYear()} Complaints Tracker. All rights reserved.</span>
            <span className="text-slate-300">•</span>
            <span>
              Powered By{" "}
              <a
                href="https://www.botivate.in/"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
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
