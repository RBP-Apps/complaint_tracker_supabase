


"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import supabase from "../utils/supabase";
import DashboardLayout from "../components/DashboardLayout";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Edit mode
  const [editUserId, setEditUserId] = useState(null);
  const [editData, setEditData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    contact_no: "",
    alternate_contact_no: "",
    tech_working_district: "",
    page_access: [],
  });

  // Add user modal
  const [open, setOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [editPageOpen, setEditPageOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
    contact_no: "",
    alternate_contact_no: "",
    tech_working_district: "",
    page: "",
  });

  // Password visibility for table rows
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const ALL_PAGES = [
    "dashboard",
    "new complaint",
    "assign-vendor",
    "vendor-tracker",
    "tracker",
    "approved",
    "draft-letter",
    "tracker-history",
    "master-page",
    "user-add",
  ];

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Login")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data?.map((u) => ({
        ...u,
        page_access: u.page_access || [],
        created_at_formatted: u.created_at
          ? new Date(u.created_at).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
      })) || [];

      setUsers(formatted);
      setFilteredUsers(formatted);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to fetch users", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.contact_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (u) => u.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditData({
      username: user.username,
      email: user.email || "",
      password: "",
      role: user.role,
      contact_no: user.contact_no || "",
      alternate_contact_no: user.alternate_contact_no || "",
      tech_working_district: user.tech_working_district || "",
      page_access: user.page_access || [],
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePageAccessChange = (page) => {
    setEditData((prev) => {
      let updated;
      if (page === "all") {
        updated = prev.page_access.includes("all") ? [] : ["all"];
      } else {
        if (prev.page_access.includes("all")) {
          updated = [page];
        } else {
          updated = prev.page_access.includes(page)
            ? prev.page_access.filter((p) => p !== page)
            : [...prev.page_access, page];
        }
      }
      return { ...prev, page_access: updated };
    });
  };

  const handleUpdate = async (id) => {
    try {
      const updatePayload = {
        username: editData.username,
        email: editData.email,
        role: editData.role.toLowerCase(),
        contact_no: editData.contact_no,
        alternate_contact_no: editData.alternate_contact_no,
        tech_working_district: editData.tech_working_district,
        page_access: editData.page_access,
      };

      if (editData.password && editData.password.trim() !== "") {
        updatePayload.password = editData.password;
      }

      const { error } = await supabase
        .from("Login")
        .update(updatePayload)
        .eq("id", id);

      if (error) throw error;

      setMessage({ text: "User updated successfully", type: "success" });
      setEditUserId(null);
      setEditPageOpen(false);
      fetchUsers();

      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to update user", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone."))
      return;

    try {
      const { error } = await supabase.from("Login").delete().eq("id", id);
      if (error) throw error;

      setMessage({ text: "User deleted successfully", type: "success" });
      fetchUsers();

      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to delete user", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role.toLowerCase(),
        contact_no: formData.contact_no,
        alternate_contact_no: formData.alternate_contact_no,
        tech_working_district: formData.tech_working_district,
        page_access:
          formData.page === "all"
            ? ["all"]
            : formData.page.split(",").filter(Boolean),
      };

      const { error } = await supabase.from("Login").insert([payload]);
      if (error) throw error;

      setMessage({ text: "User created successfully", type: "success" });
      setOpen(false);
      fetchUsers();

      setFormData({
        username: "",
        email: "",
        password: "",
        role: "USER",
        contact_no: "",
        alternate_contact_no: "",
        tech_working_district: "",
        page: "",
      });

      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };


  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "user":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage system users, roles, and permissions
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <FaUser className="text-sm" />
            Add New User
          </button>
        </div>

        {/* Message Toast */}
        {message.text && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
              message.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username, email or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Click the 'Add New User' button to get started"}
            </p>
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && filteredUsers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hidden xl:block">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Password</th>
                    <th className="p-3 text-left">Contact No</th>
                    <th className="p-3 text-left">Alt Contact</th>
                    <th className="p-3 text-left">District</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Page Access</th>
                    <th className="p-3 text-left">Created At</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {/* Username */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <input
                            name="username"
                            value={editData.username}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="font-medium text-gray-800">
                            {u.username}
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <input
                            name="email"
                            value={editData.email}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-600">{u.email}</span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <input
                            name="password"
                            type="text"
                            value={editData.password}
                            onChange={handleEditChange}
                            placeholder="Leave blank to keep current"
                            className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {visiblePasswords[u.id] ? u.password : "••••••••"}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              {visiblePasswords[u.id] ? (
                                <FaEyeSlash size={14} />
                              ) : (
                                <FaEye size={14} />
                              )}
                            </button>
                          </div>
                        )}
                       </td>

                      {/* Contact No */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <input
                            name="contact_no"
                            value={editData.contact_no}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {u.contact_no || "-"}
                          </span>
                        )}
                       </td>

                      {/* Alternate Contact */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <input
                            name="alternate_contact_no"
                            value={editData.alternate_contact_no}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {u.alternate_contact_no || "-"}
                          </span>
                        )}
                       </td>

                      {/* District */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <input
                            name="tech_working_district"
                            value={editData.tech_working_district}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {u.tech_working_district || "-"}
                          </span>
                        )}
                       </td>

                      {/* Role */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <select
                            name="role"
                            value={editData.role}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(
                              u.role
                            )}`}
                          >
                            {u.role?.toUpperCase()}
                          </span>
                        )}
                       </td>

                      {/* Page Access */}
                      <td className="p-3">
                        {editUserId === u.id ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setEditPageOpen(!editPageOpen)}
                              className="w-full border border-gray-300 rounded-lg px-2 py-1 text-left text-sm hover:bg-gray-50"
                            >
                              {editData.page_access.length > 0
                                ? editData.page_access.includes("all")
                                  ? "ALL PAGES"
                                  : `${editData.page_access.length} selected`
                                : "Select pages"}
                            </button>
                            {editPageOpen && (
                              <div className="absolute z-20 mt-1 w-64 bg-white border rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                                <label className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-2 pb-1 border-b">
                                  <input
                                    type="checkbox"
                                    checked={editData.page_access.includes(
                                      "all"
                                    )}
                                    onChange={() =>
                                      handlePageAccessChange("all")
                                    }
                                  />
                                  All Pages
                                </label>
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                  {ALL_PAGES.map((page) => (
                                    <label
                                      key={page}
                                      className="flex items-center gap-2 text-xs py-1"
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={editData.page_access.includes(
                                          "all"
                                        )}
                                        checked={editData.page_access.includes(
                                          page
                                        )}
                                        onChange={() =>
                                          handlePageAccessChange(page)
                                        }
                                      />
                                      {page}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.page_access?.includes("all") ? (
                              <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                                ALL PAGES
                              </span>
                            ) : (
                              u.page_access?.slice(0, 2).map((p, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {p}
                                </span>
                              ))
                            )}
                            {u.page_access?.length > 2 &&
                              !u.page_access.includes("all") && (
                                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  +{u.page_access.length - 2}
                                </span>
                              )}
                          </div>
                        )}
                       </td>

                      {/* Created At */}
                      <td className="p-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt size={12} />
                          {u.created_at_formatted}
                        </div>
                       </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        {editUserId === u.id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleUpdate(u.id)}
                              className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1 text-sm"
                            >
                              <FaSave /> Save
                            </button>
                            <button
                              onClick={() => {
                                setEditUserId(null);
                                setEditPageOpen(false);
                              }}
                              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm"
                            >
                              <FaTimes /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => handleEdit(u)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <FaEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <FaTrash size={18} />
                            </button>
                          </div>
                        )}
                       </td>
                     </tr>
                  ))}
                </tbody>
             </table>
            </div>
          </div>
        )}

        {/* Mobile/Tablet Card View */}
        {!loading && filteredUsers.length > 0 && (
          <div className="xl:hidden space-y-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl shadow-lg p-4 space-y-3 transition-all hover:shadow-xl"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editUserId === u.id ? (
                      <input
                        name="username"
                        value={editData.username}
                        onChange={handleEditChange}
                        placeholder="Username"
                        className="w-full border rounded-lg px-3 py-2 text-sm font-semibold mb-2"
                      />
                    ) : (
                      <h3 className="font-bold text-gray-800 text-lg">
                        {u.username}
                      </h3>
                    )}
                    {editUserId === u.id ? (
                      <input
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        placeholder="Email"
                        className="w-full border rounded-lg px-3 py-2 text-sm text-gray-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <FaEnvelope size={12} /> {u.email}
                      </p>
                    )}
                  </div>
                  {editUserId !== u.id && (
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(u)} className="text-blue-600">
                        <FaEdit size={18} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-600">
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Password</span>
                  {editUserId === u.id ? (
                    <input
                      name="password"
                      value={editData.password}
                      onChange={handleEditChange}
                      placeholder="New password (optional)"
                      className="border rounded-lg px-2 py-1 text-sm w-40"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {visiblePasswords[u.id] ? u.password : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(u.id)}
                        className="text-gray-500"
                      >
                        {visiblePasswords[u.id] ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact Numbers */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Contact No</span>
                  {editUserId === u.id ? (
                    <input
                      name="contact_no"
                      value={editData.contact_no}
                      onChange={handleEditChange}
                      className="border rounded-lg px-2 py-1 text-sm w-40"
                    />
                  ) : (
                    <span className="text-sm">{u.contact_no || "-"}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Alt Contact</span>
                  {editUserId === u.id ? (
                    <input
                      name="alternate_contact_no"
                      value={editData.alternate_contact_no}
                      onChange={handleEditChange}
                      className="border rounded-lg px-2 py-1 text-sm w-40"
                    />
                  ) : (
                    <span className="text-sm">{u.alternate_contact_no || "-"}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">District</span>
                  {editUserId === u.id ? (
                    <input
                      name="tech_working_district"
                      value={editData.tech_working_district}
                      onChange={handleEditChange}
                      className="border rounded-lg px-2 py-1 text-sm w-40"
                    />
                  ) : (
                    <span className="text-sm">{u.tech_working_district || "-"}</span>
                  )}
                </div>

                {/* Role */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Role</span>
                  {editUserId === u.id ? (
                    <select
                      name="role"
                      value={editData.role}
                      onChange={handleEditChange}
                      className="border rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(
                        u.role
                      )}`}
                    >
                      {u.role?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Page Access */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Page Access</span>
                  {editUserId === u.id ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEditPageOpen(!editPageOpen)}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        {editData.page_access.length > 0
                          ? editData.page_access.includes("all")
                            ? "ALL PAGES"
                            : `${editData.page_access.length} selected`
                          : "Select"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {u.page_access?.includes("all") ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                          ALL PAGES
                        </span>
                      ) : (
                        u.page_access?.slice(0, 2).map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                          >
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <span>Created</span>
                  <span>{u.created_at_formatted}</span>
                </div>

                {/* Edit Actions for Mobile */}
                {editUserId === u.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleUpdate(u.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                    >
                      <FaSave /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditUserId(null);
                        setEditPageOpen(false);
                      }}
                      className="flex-1 bg-gray-200 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Page Access Modal for Mobile Edit */}
        {editPageOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-4">
              <h3 className="font-semibold text-lg mb-3">Select Page Access</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <label className="flex items-center gap-2 font-semibold text-green-600 pb-2 border-b">
                  <input
                    type="checkbox"
                    checked={editData.page_access.includes("all")}
                    onChange={() => handlePageAccessChange("all")}
                  />
                  All Pages
                </label>
                {ALL_PAGES.map((page) => (
                  <label key={page} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={editData.page_access.includes("all")}
                      checked={editData.page_access.includes(page)}
                      onChange={() => handlePageAccessChange(page)}
                    />
                    {page}
                  </label>
                ))}
              </div>
              <button
                onClick={() => setEditPageOpen(false)}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
                <h2 className="text-xl font-bold text-center text-white">
                  Add New User
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              >
                <input
                  name="username"
                  placeholder="Username *"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />

                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <input
                  name="contact_no"
                  placeholder="Contact Number"
                  value={formData.contact_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <input
                  name="alternate_contact_no"
                  placeholder="Alternate Contact"
                  value={formData.alternate_contact_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <input
                  name="tech_working_district"
                  placeholder="Working District"
                  value={formData.tech_working_district}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <div className="relative">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Page Access
                  </p>
                  <button
                    type="button"
                    onClick={() => setPageOpen(!pageOpen)}
                    className="w-full border rounded-lg px-3 py-2 text-left flex justify-between items-center hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">
                      {formData.page
                        ? formData.page === "all"
                          ? "ALL PAGES"
                          : `${formData.page.split(",").length} pages selected`
                        : "Select pages"}
                    </span>
                    <span className="text-gray-400">▾</span>
                  </button>

                  {pageOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg p-3 space-y-2 max-h-52 overflow-y-auto">
                      <label className="flex items-center gap-2 font-medium text-green-600">
                        <input
                          type="checkbox"
                          checked={formData.page === "all"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              page: e.target.checked ? "all" : "",
                            })
                          }
                        />
                        All Pages
                      </label>
                      <hr />
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_PAGES.map((page) => (
                          <label
                            key={page}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              disabled={formData.page === "all"}
                              checked={formData.page.split(",").includes(page)}
                              onChange={(e) => {
                                const selected = formData.page
                                  ? formData.page.split(",")
                                  : [];
                                const updated = e.target.checked
                                  ? [...selected, page]
                                  : selected.filter((p) => p !== page);
                                setFormData({
                                  ...formData,
                                  page: updated.join(","),
                                });
                              }}
                            />
                            {page}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>

              <div className="px-6 py-4 border-t flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? "Saving..." : "Save User"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}