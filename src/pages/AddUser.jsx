"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  Lock,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Layers,
  Wrench,
  User as UserIcon,
} from "lucide-react";
import supabase from "../utils/supabase";
import DashboardLayout from "../components/DashboardLayout";

// Available system modules/pages
const MODULE_PAGES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "new complaint", label: "New Complaint" },
  { key: "assign-vendor", label: "Assign Vendor" },
  { key: "vendor-tracker", label: "Vendor Tracker" },
  { key: "tracker", label: "Complaint Tracker" },
  { key: "approved", label: "Approved" },
  { key: "draft-letter", label: "Draft Letter" },
  { key: "assign-vendor-letter", label: "Vendor Letter" },
  { key: "tracker-history", label: "Tracker History" },
  { key: "master-page", label: "Master Data" },
  { key: "user-add", label: "User Management" },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [pageAccessFilter, setPageAccessFilter] = useState("all");

  // Passwords visibility toggle in table
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    contact_no: "",
    alternate_contact_no: "",
    tech_working_district: "",
    page_access: [],
  });

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    contact_no: "",
    alternate_contact_no: "",
    tech_working_district: "",
    page_access: [],
  });

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Login")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((u) => ({
        ...u,
        page_access: Array.isArray(u.page_access)
          ? u.page_access
          : typeof u.page_access === "string"
          ? u.page_access.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        created_at_formatted: u.created_at
          ? new Date(u.created_at).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
      }));

      setUsers(formatted);
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Failed to fetch users. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Unique Districts list for dropdown filter
  const uniqueDistricts = useMemo(() => {
    const districts = users
      .map((u) => u.tech_working_district?.trim())
      .filter((d) => d && d !== "-" && d !== "N/A");
    return Array.from(new Set(districts)).sort();
  }, [users]);

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Global Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = u.username?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchContact =
          u.contact_no?.toLowerCase().includes(query) ||
          u.alternate_contact_no?.toLowerCase().includes(query);
        const matchDistrict = u.tech_working_district
          ?.toLowerCase()
          .includes(query);

        if (!matchName && !matchEmail && !matchContact && !matchDistrict) {
          return false;
        }
      }

      // Role Filter
      if (roleFilter !== "all") {
        if (u.role?.toLowerCase() !== roleFilter.toLowerCase()) {
          return false;
        }
      }

      // District Filter
      if (districtFilter !== "all") {
        if (
          u.tech_working_district?.trim().toLowerCase() !==
          districtFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // Page Access Filter
      if (pageAccessFilter !== "all") {
        const pages = u.page_access || [];
        const hasAllAccess = pages.includes("all");
        const hasSpecific = pages.some(
          (p) => p.toLowerCase() === pageAccessFilter.toLowerCase()
        );
        if (!hasAllAccess && !hasSpecific) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, districtFilter, pageAccessFilter]);

  // Overview Stats
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(
      (u) => u.role?.toLowerCase() === "admin"
    ).length;
    const techs = users.filter((u) =>
      ["tech", "technician"].includes(u.role?.toLowerCase())
    ).length;
    const standardUsers = total - admins - techs;
    return { total, admins, techs, standardUsers };
  }, [users]);

  // Toast Notification helper
  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 3500);
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setDistrictFilter("all");
    setPageAccessFilter("all");
  };

  const isFiltered =
    searchTerm !== "" ||
    roleFilter !== "all" ||
    districtFilter !== "all" ||
    pageAccessFilter !== "all";

  // Password visibility in table
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // ------------------ ADD USER HANDLERS ------------------
  const handleOpenAddModal = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "user",
      contact_no: "",
      alternate_contact_no: "",
      tech_working_district: "",
      page_access: [],
    });
    setShowAddPassword(false);
    setIsAddModalOpen(true);
  };

  const handleAddPageToggle = (pageKey) => {
    setFormData((prev) => {
      if (pageKey === "all") {
        const isAllSelected = prev.page_access.includes("all");
        return {
          ...prev,
          page_access: isAllSelected ? [] : ["all"],
        };
      } else {
        let current = prev.page_access.includes("all")
          ? MODULE_PAGES.map((p) => p.key)
          : [...prev.page_access];

        if (current.includes(pageKey)) {
          current = current.filter((k) => k !== pageKey && k !== "all");
        } else {
          current.push(pageKey);
        }
        return { ...prev, page_access: current };
      }
    });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToast("Username, email, and password are required!", "error");
      return;
    }

    setAddLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: (formData.role || "user").toLowerCase(),
        contact_no: formData.contact_no.trim(),
        alternate_contact_no: formData.alternate_contact_no.trim(),
        tech_working_district: formData.tech_working_district.trim(),
        page_access: formData.page_access.length > 0 ? formData.page_access : ["dashboard"],
      };

      const { error } = await supabase.from("Login").insert([payload]);
      if (error) throw error;

      showToast("User account created successfully!", "success");
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      showToast(err.message || "Failed to create user", "error");
    } finally {
      setAddLoading(false);
    }
  };

  // ------------------ EDIT USER MODAL HANDLERS ------------------
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditingUserId(user.id);
    setEditFormData({
      username: String(user.username || ""),
      email: String(user.email || ""),
      password: "", // blank indicates keep current password
      role: String(user.role || "user").toLowerCase(),
      contact_no: String(user.contact_no ?? ""),
      alternate_contact_no: String(user.alternate_contact_no ?? ""),
      tech_working_district: String(user.tech_working_district || ""),
      page_access: Array.isArray(user.page_access) ? [...user.page_access] : [],
    });
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  const handleEditPageToggle = (pageKey) => {
    setEditFormData((prev) => {
      if (pageKey === "all") {
        const isAllSelected = prev.page_access.includes("all");
        return {
          ...prev,
          page_access: isAllSelected ? [] : ["all"],
        };
      } else {
        let current = prev.page_access.includes("all")
          ? MODULE_PAGES.map((p) => p.key)
          : [...prev.page_access];

        if (current.includes(pageKey)) {
          current = current.filter((k) => k !== pageKey && k !== "all");
        } else {
          current.push(pageKey);
        }
        return { ...prev, page_access: current };
      }
    });
  };

  const handleUpdateUserSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const cleanUsername = String(editFormData.username || "").trim();
    if (!cleanUsername) {
      showToast("Username is required!", "error");
      return;
    }

    setEditLoading(true);
    try {
      const updatePayload = {
        username: cleanUsername,
        email: String(editFormData.email || "").trim(),
        role: String(editFormData.role || "user").toLowerCase(),
        contact_no: String(editFormData.contact_no ?? "").trim(),
        alternate_contact_no: String(editFormData.alternate_contact_no ?? "").trim(),
        tech_working_district: String(editFormData.tech_working_district || "").trim(),
        page_access: editFormData.page_access,
      };

      // Only update password if a new one was provided
      if (editFormData.password && String(editFormData.password).trim() !== "") {
        updatePayload.password = String(editFormData.password).trim();
      }

      console.log("Submitting user update payload:", updatePayload);

      // Construct update query: use id if available, otherwise match by original username
      let updateQuery;
      if (editingUserId !== undefined && editingUserId !== null) {
        updateQuery = supabase.from("Login").update(updatePayload).eq("id", editingUserId);
      } else if (editingUser?.username) {
        updateQuery = supabase.from("Login").update(updatePayload).eq("username", editingUser.username);
      } else {
        updateQuery = supabase.from("Login").update(updatePayload).eq("username", cleanUsername);
      }

      let { error } = await updateQuery;

      // Fallback 1: If database schema expects page_access as comma-separated text string
      if (error && error.message && (error.message.includes("page_access") || error.message.includes("array") || error.message.includes("text[]"))) {
        console.warn("Retrying update with page_access as comma-separated string...", error);
        updatePayload.page_access = (editFormData.page_access || []).join(",");
        
        let retryQuery;
        if (editingUserId !== undefined && editingUserId !== null) {
          retryQuery = supabase.from("Login").update(updatePayload).eq("id", editingUserId);
        } else {
          retryQuery = supabase.from("Login").update(updatePayload).eq("username", editingUser?.username || cleanUsername);
        }
        const retryRes = await retryQuery;
        error = retryRes.error;
      }

      // Fallback 2: If id matching failed, try matching by username
      if (error && editingUser?.username) {
        console.warn("Retrying update using username matching...", error);
        const retryRes = await supabase.from("Login").update(updatePayload).eq("username", editingUser.username);
        error = retryRes.error;
      }

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      showToast("User updated successfully!", "success");
      setIsEditModalOpen(false);
      setEditingUserId(null);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      showToast(err.message || "Failed to update user", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // ------------------ DELETE USER HANDLER ------------------
  const handleDeleteUser = async (id, username) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("Login").delete().eq("id", id);
      if (error) throw error;

      showToast(`User "${username}" deleted successfully!`, "success");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  // Helper for Role styling
  const getRoleBadge = (role) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck size={13} className="text-purple-600" />
            ADMIN
          </span>
        );
      case "tech":
      case "technician":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Wrench size={13} className="text-amber-600" />
            TECH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <UserIcon size={13} className="text-blue-600" />
            USER
          </span>
        );
    }
  };

  // Initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Toast Notification */}
        {message.text && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 ${
              message.type === "success"
                ? "bg-emerald-600 text-white shadow-emerald-200"
                : "bg-rose-600 text-white shadow-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  User Management
                </h1>
              
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Add New User</span>
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Users
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.total}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Administrators
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.admins}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck size={22} />
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Field Techs
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.techs}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench size={22} />
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Districts Covered
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {uniqueDistricts.length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <MapPin size={22} />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, contact, or district..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="tech">Tech</option>
              </select>
            </div>

            {/* District Filter */}
            <div className="flex items-center gap-2">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
              >
                <option value="all">All Districts</option>
                {uniqueDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Access Filter */}
            <div className="flex items-center gap-2">
              <select
                value={pageAccessFilter}
                onChange={(e) => setPageAccessFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
              >
                <option value="all">All Permissions</option>
                {MODULE_PAGES.map((page) => (
                  <option key={page.key} value={page.key}>
                    Access: {page.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors whitespace-nowrap cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              Showing <span className="font-semibold text-slate-700">{filteredUsers.length}</span> of{" "}
              <span className="font-semibold text-slate-700">{users.length}</span> registered users
            </div>
            {isFiltered && (
              <span className="inline-flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                <Filter size={11} /> Filters active
              </span>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Loading users data...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No users match your criteria</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              {isFiltered
                ? "No users match your active filters. Try adjusting your search term or reset all filters."
                : "No users exist in the system yet. Click 'Add New User' to create the first account."}
            </p>
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw size={14} /> Clear Active Filters
              </button>
            )}
          </div>
        )}

        {/* Desktop Table View (Actions Column is 1st Column) */}
        {!loading && filteredUsers.length > 0 && (
          <div className="hidden xl:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {/* ACTION COLUMN IS FIRST */}
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4 text-center w-28">Actions</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">User</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">Role</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">District</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">Contact</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">Alt Contact</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">Page Permissions</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">Password</th>
                    <th className="sticky top-0 bg-slate-50 py-3.5 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredUsers.map((u) => {
                    const isPasswordVisible = !!visiblePasswords[u.id];
                    const pages = u.page_access || [];
                    const hasAllPages = pages.includes("all");

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-blue-50/40 transition-colors duration-100"
                      >
                        {/* 1. ACTIONS COLUMN (FIRST) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200/60"
                              title="Edit User"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200/60"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>

                        {/* 2. USER INFO */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              {getInitials(u.username)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {u.username}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail size={11} />
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. ROLE */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getRoleBadge(u.role)}
                        </td>

                        {/* 4. DISTRICT */}
                        <td className="py-3.5 px-4">
                          {u.tech_working_district ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                              <MapPin size={12} className="text-slate-500" />
                              {u.tech_working_district}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        {/* 5. CONTACT */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {u.contact_no ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-mono">
                              <Phone size={11} className="text-slate-400" />
                              {u.contact_no}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        {/* 6. ALT CONTACT */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {u.alternate_contact_no ? (
                            <span className="text-xs text-slate-500 font-mono">
                              {u.alternate_contact_no}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        {/* 7. PAGE PERMISSIONS */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {hasAllPages ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <ShieldCheck size={11} /> All Modules
                              </span>
                            ) : pages.length > 0 ? (
                              <>
                                {pages.slice(0, 2).map((pageKey) => (
                                  <span
                                    key={pageKey}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs"
                                  >
                                    {MODULE_PAGES.find((p) => p.key === pageKey)?.label || pageKey}
                                  </span>
                                ))}
                                {pages.length > 2 && (
                                  <span
                                    className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[11px] font-semibold cursor-help"
                                    title={pages.join(", ")}
                                  >
                                    +{pages.length - 2} more
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No pages</span>
                            )}
                          </div>
                        </td>

                        {/* 8. PASSWORD */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                              {isPasswordVisible ? u.password : "••••••••"}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                              title={isPasswordVisible ? "Hide password" : "Show password"}
                            >
                              {isPasswordVisible ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 9. CREATED AT */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            {u.created_at_formatted}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile / Tablet Cards View */}
        {!loading && filteredUsers.length > 0 && (
          <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((u) => {
              const isPasswordVisible = !!visiblePasswords[u.id];
              const pages = u.page_access || [];
              const hasAllPages = pages.includes("all");

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Top: User and Actions */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {getInitials(u.username)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">
                          {u.username}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getRoleBadge(u.role)}
                        </div>
                      </div>
                    </div>

                    {/* Actions on Mobile (Prominently at Top) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer border border-blue-200/60"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-200/60"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Email</span>
                      <span className="text-slate-700 font-medium truncate block mt-0.5">
                        {u.email}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">District</span>
                      <span className="text-slate-700 font-medium block mt-0.5">
                        {u.tech_working_district || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Contact No.</span>
                      <span className="text-slate-700 font-mono block mt-0.5">
                        {u.contact_no || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Alt Contact</span>
                      <span className="text-slate-700 font-mono block mt-0.5">
                        {u.alternate_contact_no || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Password & Permissions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {isPasswordVisible ? u.password : "••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block mb-1">
                        Page Permissions:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hasAllPages ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <ShieldCheck size={11} /> All Modules
                          </span>
                        ) : pages.length > 0 ? (
                          pages.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]"
                            >
                              {MODULE_PAGES.find((mp) => mp.key === p)?.label || p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Created: {u.created_at_formatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== EDIT USER MODAL ===================== */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Edit User Account</h3>
                    <p className="text-xs text-blue-100">
                      Update credentials, roles, and accessible modules
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={handleUpdateUserSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {/* Section 1: Basic Information */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserIcon size={14} className="text-blue-600" />
                    Account Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.username}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            username: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            email: e.target.value,
                          })
                        }
                        placeholder="e.g. user@company.com"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Role
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
                      >
                        <option value="user">User (Standard)</option>
                        <option value="admin">Administrator</option>
                        <option value="tech">Field Technician</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reset Password
                      </label>
                      <div className="relative">
                        <input
                          type={showEditPassword ? "text" : "password"}
                          value={editFormData.password}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Leave blank to keep existing"
                          className="w-full pl-3.5 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Location */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Phone size={14} className="text-blue-600" />
                    Contact & Location
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Contact No.
                      </label>
                      <input
                        type="text"
                        value={editFormData.contact_no}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            contact_no: e.target.value,
                          })
                        }
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alternate Contact No.
                      </label>
                      <input
                        type="text"
                        value={editFormData.alternate_contact_no}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            alternate_contact_no: e.target.value,
                          })
                        }
                        placeholder="e.g. 9123456780"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Working District
                      </label>
                      <input
                        type="text"
                        value={editFormData.tech_working_district}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            tech_working_district: e.target.value,
                          })
                        }
                        placeholder="e.g. Raipur, Bilaspur..."
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Page Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      Assigned Page Access
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleEditPageToggle("all")}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${
                        editFormData.page_access.includes("all")
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {editFormData.page_access.includes("all")
                        ? "✓ Full Access (All Pages)"
                        : "Grant All Pages"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {MODULE_PAGES.map((page) => {
                      const isChecked =
                        editFormData.page_access.includes("all") ||
                        editFormData.page_access.includes(page.key);

                      return (
                        <label
                          key={page.key}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                            isChecked
                              ? "bg-blue-50/80 border-blue-200 text-blue-900 font-semibold"
                              : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100/70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleEditPageToggle(page.key)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span className="truncate">{page.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateUserSubmit}
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ADD USER MODAL ===================== */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Create New User</h3>
                    <p className="text-xs text-blue-100">
                      Provision a new user account with credentials and permissions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={handleAddUserSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {/* Basic Information */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserIcon size={14} className="text-blue-600" />
                    Account Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        placeholder="e.g. rahul_sharma"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="e.g. rahul@company.com"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showAddPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          placeholder="Enter strong password"
                          className="w-full pl-3.5 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAddPassword(!showAddPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          {showAddPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
                      >
                        <option value="user">User (Standard)</option>
                        <option value="admin">Administrator</option>
                        <option value="tech">Field Technician</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Phone size={14} className="text-blue-600" />
                    Contact & Location
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Contact No.
                      </label>
                      <input
                        type="text"
                        value={formData.contact_no}
                        onChange={(e) =>
                          setFormData({ ...formData, contact_no: e.target.value })
                        }
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alternate Contact No.
                      </label>
                      <input
                        type="text"
                        value={formData.alternate_contact_no}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alternate_contact_no: e.target.value,
                          })
                        }
                        placeholder="e.g. 9123456780"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Working District
                      </label>
                      <input
                        type="text"
                        value={formData.tech_working_district}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tech_working_district: e.target.value,
                          })
                        }
                        placeholder="e.g. Raipur, Durg..."
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Page Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      Grant Page Access
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleAddPageToggle("all")}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${
                        formData.page_access.includes("all")
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {formData.page_access.includes("all")
                        ? "✓ All Pages Selected"
                        : "Select All Pages"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {MODULE_PAGES.map((page) => {
                      const isChecked =
                        formData.page_access.includes("all") ||
                        formData.page_access.includes(page.key);

                      return (
                        <label
                          key={page.key}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                            isChecked
                              ? "bg-blue-50/80 border-blue-200 text-blue-900 font-semibold"
                              : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100/70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleAddPageToggle(page.key)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span className="truncate">{page.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddUserSubmit}
                  disabled={addLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {addLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}