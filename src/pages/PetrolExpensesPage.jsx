"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Plus,
  X,
  Calendar,
  User,
  Navigation,
  FileText,
  Loader,
  Search,
} from "react-feather";

function PetrolExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]); // For filtered results
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [formData, setFormData] = useState({
    date: "",
    technicianName: "",
    openingKm: "",
    closingKm: "",
    totalKm: 0,
    fromLocation: "", // Add this
    toLocation: "", // Add this
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState([]); // Changed from static array to state
  const [isTechniciansLoading, setIsTechniciansLoading] = useState(false); // Loading state for technicians
  const [username, setUsername] = useState("");

  // Derive technician display name from username when it starts with "Tech"
  const techDisplayName = (username || "").toLowerCase().startsWith("tech")
    ? (username || "").substring(4).trim()
    : "";

  // Google Apps Script Web App URL - Replace with your actual deployed script URL
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec";

  // Function to format date string to dd/mm/yyyy
  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    // Handle ISO string format (2025-05-22T07:38:28.052Z)
    if (typeof dateValue === "string" && dateValue.includes("T")) {
      date = new Date(dateValue);
    }
    // Handle date format (2025-05-21)
    else if (typeof dateValue === "string" && dateValue.includes("-")) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets format like "5/22/2025, 2:32:51 PM"
    else if (
      typeof dateValue === "string" &&
      dateValue.includes("/") &&
      dateValue.includes(",")
    ) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets Date constructor format like "Date(2025,4,21)" or "Date(2025,4,22,14,32,51)"
    else if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
      // Extract the date parts from "Date(2025,4,21)" or "Date(2025,4,22,14,32,51)" format
      const match = dateValue.match(
        /Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/
      );
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]); // Month is 0-indexed in this format
        const day = parseInt(match[3]);
        // Optional time components
        const hours = match[4] ? parseInt(match[4]) : 0;
        const minutes = match[5] ? parseInt(match[5]) : 0;
        const seconds = match[6] ? parseInt(match[6]) : 0;
        date = new Date(year, month, day, hours, minutes, seconds);
      } else {
        return dateValue;
      }
    }
    // Handle if it's already a Date object
    else if (typeof dateValue === "object" && dateValue.getDate) {
      date = dateValue;
    } else {
      return dateValue; // Return as is if not a recognizable date format
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateValue; // Return original value if invalid date
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to fetch technicians from Master sheet column F
  const fetchTechnicians = async () => {
    setIsTechniciansLoading(true);

    try {
      // Fetch the Master sheet using Google Sheets API directly
      const sheetUrl =
        "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=Master";
      const response = await fetch(sheetUrl);
      const text = await response.text();

      // Extract the JSON part from the response
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonData = text.substring(jsonStart, jsonEnd);

      const data = JSON.parse(jsonData);

      // Process the technicians data from column F
      if (data && data.table && data.table.rows) {
        const techniciansData = [];

        // Process all rows and extract column F (index 5)
        data.table.rows.slice(1).forEach((row) => {
          if (row.c && row.c[5] && row.c[5].v) {
            // Column F is index 5 (0-based)
            const technicianName = row.c[5].v.toString().trim();
            // Only add non-empty, unique technician names
            if (technicianName && !techniciansData.includes(technicianName)) {
              techniciansData.push(technicianName);
            }
          }
        });

        // Sort technicians alphabetically
        setTechnicians(techniciansData.sort());
      } else {
        setTechnicians([]);
      }
    } catch (err) {
      console.error("Error fetching technicians:", err);
      // Fallback to empty array if fetch fails
      setTechnicians([]);
    } finally {
      setIsTechniciansLoading(false);
    }
  };

  // Load expenses from Google Sheets on component mount
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the Petrol Expenses sheet using Google Sheets API directly
        const sheetUrl =
          "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=Petrol%20Expenses";
        const response = await fetch(sheetUrl);
        const text = await response.text();

        // Extract the JSON part from the response
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonData = text.substring(jsonStart, jsonEnd);

        const data = JSON.parse(jsonData);

        // Process the expenses data
        if (data && data.table && data.table.rows) {
          const expensesData = [];

          // Skip the header row and process the data rows
          data.table.rows.slice(0).forEach((row, index) => {
            if (row.c && row.c[1]) {
              // Check if row has data (at least date column)
              // Format timestamp (Column A) - ISO format to dd/mm/yyyy
              let timestampValue = row.c[0] ? row.c[0].v : "";

              // Format expense date (Column B) - date format to dd/mm/yyyy
              let expenseDateValue = row.c[1] ? row.c[1].v : "";
              expenseDateValue = formatDateString(expenseDateValue);

              const expense = {
                id: index + 1,
                createdAt: timestampValue,
                date: expenseDateValue,
                technicianName: row.c[2] ? row.c[2].v : "",
                fromLocation: row.c[3] ? row.c[3].v : "", // Add this
                toLocation: row.c[4] ? row.c[4].v : "", // Add this
                openingKm: row.c[5] ? parseFloat(row.c[5].v) || 0 : 0,
                closingKm: row.c[6] ? parseFloat(row.c[6].v) || 0 : 0,
                totalKm: row.c[7] ? parseFloat(row.c[7].v) || 0 : 0,
              };

              expensesData.push(expense);
            }
          });

          // Reverse to show newest first
          setExpenses(expensesData.reverse());
          setFilteredExpenses(expensesData); // Initialize filtered expenses
        } else {
          setExpenses([]);
          setFilteredExpenses([]);
        }
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setError(err.message);
        setExpenses([]);
        setFilteredExpenses([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch both expenses and technicians
    fetchExpenses();
    fetchTechnicians();
  }, []);

  // Read username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  // Prefill technician name for Tech* users
  useEffect(() => {
    if (techDisplayName) {
      setFormData((prev) => ({
        ...prev,
        technicianName: techDisplayName,
      }));
    }
  }, [techDisplayName]);

  // Filter expenses based on Tech user and search query
  useEffect(() => {
    let base = expenses;
    if (techDisplayName) {
      const nameQuery = techDisplayName.toLowerCase();
      base = base.filter((e) => (e.technicianName || "").toLowerCase().includes(nameQuery));
    }

    if (!searchQuery.trim()) {
      setFilteredExpenses(base);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = base.filter((expense) => {
        return (
          expense.date.toLowerCase().includes(query) ||
          (expense.technicianName || "").toLowerCase().includes(query) ||
          expense.openingKm.toString().includes(query) ||
          expense.closingKm.toString().includes(query) ||
          expense.totalKm.toString().includes(query) ||
          formatDateString(expense.createdAt).toLowerCase().includes(query)
        );
      });
      setFilteredExpenses(filtered);
    }
  }, [searchQuery, expenses, techDisplayName]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Calculate total km when opening or closing km changes
  useEffect(() => {
    const opening = Number.parseFloat(formData.openingKm) || 0;
    const closing = Number.parseFloat(formData.closingKm) || 0;
    const total = closing - opening;
    setFormData((prev) => ({
      ...prev,
      totalKm: total > 0 ? total : 0,
    }));
  }, [formData.openingKm, formData.closingKm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !formData.date ||
      !formData.technicianName ||
      !formData.fromLocation ||
      !formData.toLocation ||
      !formData.openingKm ||
      !formData.closingKm
    ) {
      alert("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (
      Number.parseFloat(formData.closingKm) <=
      Number.parseFloat(formData.openingKm)
    ) {
      alert("Closing KM must be greater than Opening KM");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare expense data - include fromLocation and toLocation
      const expenseData = {
        date: formData.date,
        technicianName: formData.technicianName,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        openingKm: formData.openingKm,
        closingKm: formData.closingKm,
        totalKm: formData.totalKm,
      };

      // Create row data for Google Sheets
      const timestamp = new Date().toISOString();
      const rowData = [
        timestamp,
        expenseData.date,
        expenseData.technicianName,
        expenseData.fromLocation,
        expenseData.toLocation,
        expenseData.openingKm,
        expenseData.closingKm,
        expenseData.totalKm,
      ];

      // Submit to Google Sheets
      const submitFormData = new FormData();
      submitFormData.append("action", "insert");
      submitFormData.append("sheetName", "Petrol Expenses");
      submitFormData.append("rowData", JSON.stringify(rowData));

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: submitFormData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to add expense");
      }

      // Add the new expense to local state - include locations
      const newExpense = {
        id: Date.now(),
        ...expenseData,
        createdAt: timestamp,
      };

      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses);

      // Reset form and close
      setFormData({
        date: "",
        technicianName: "",
        fromLocation: "",
        toLocation: "",
        openingKm: "",
        closingKm: "",
        totalKm: 0,
      });
      setShowForm(false);
      alert("Expense added successfully!");
    } catch (err) {
      console.error("Error submitting expense:", err);
      alert("Failed to add expense: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      date: "",
      technicianName: "",
      fromLocation: "", // Add this
      toLocation: "", // Add this
      openingKm: "",
      closingKm: "",
      totalKm: 0,
    });
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between items-start mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Petrol Expenses{techDisplayName ? ` - ${techDisplayName}` : ""}
            </h1>
            <p className="text-gray-600">
              Track and manage petrol expenses for technicians
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex gap-2 items-center px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg transition-colors sm:mt-0 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Expenses
          </button>
        </div>

        {/* Add Expense Form Modal */}
        {showForm && (
          <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Petrol Expense
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Date */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Calendar className="inline mr-1 w-4 h-4" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Technician Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <User className="inline mr-1 w-4 h-4" />
                    Technician Name *
                  </label>
                  <select
                    name="technicianName"
                    value={techDisplayName ? techDisplayName : formData.technicianName}
                    onChange={handleInputChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isTechniciansLoading || !!techDisplayName}
                  >
                    <option value="">
                      {isTechniciansLoading
                        ? "Loading technicians..."
                        : "Select Technician"}
                    </option>
                    {techDisplayName && !technicians.includes(techDisplayName) && (
                      <option value={techDisplayName}>{techDisplayName}</option>
                    )}
                    {technicians.map((tech, index) => (
                      <option key={index} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                  {isTechniciansLoading && (
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Loader className="mr-1 w-3 h-3 animate-spin" />
                      Loading technicians from Master sheet...
                    </div>
                  )}
                </div>

                {/* From Location */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Navigation className="inline mr-1 w-4 h-4" />
                    From Location *
                  </label>
                  <input
                    type="text"
                    name="fromLocation"
                    value={formData.fromLocation}
                    onChange={handleInputChange}
                    placeholder="Enter starting location"
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* To Location */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Navigation className="inline mr-1 w-4 h-4" />
                    To Location *
                  </label>
                  <input
                    type="text"
                    name="toLocation"
                    value={formData.toLocation}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Opening KM */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Navigation className="inline mr-1 w-4 h-4" />
                    Opening KM *
                  </label>
                  <input
                    type="number"
                    name="openingKm"
                    value={formData.openingKm}
                    onChange={handleInputChange}
                    placeholder="Enter opening kilometers"
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.1"
                  />
                </div>

                {/* Closing KM */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Navigation className="inline mr-1 w-4 h-4" />
                    Closing KM *
                  </label>
                  <input
                    type="number"
                    name="closingKm"
                    value={formData.closingKm}
                    onChange={handleInputChange}
                    placeholder="Enter closing kilometers"
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.1"
                  />
                </div>

                {/* Total KM (Auto-calculated) */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Total KM
                  </label>
                  <input
                    type="number"
                    value={formData.totalKm}
                    className="px-3 py-2 w-full bg-gray-50 rounded-md border border-gray-300 cursor-not-allowed"
                    disabled
                    step="0.1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Automatically calculated (Closing KM - Opening KM)
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex flex-1 justify-center items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="mr-2 w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Expense"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {expenses.length > 0 && !isLoading && (
          <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-4">
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Entries
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {expenses.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Navigation className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Distance
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {expenses
                      .reduce((sum, expense) => sum + expense.totalKm, 0)
                      .toFixed(1)}{" "}
                    km
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Technicians
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      new Set(expenses.map((expense) => expense.technicianName))
                        .size
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Search className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Filtered Results
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredExpenses.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <Loader className="mx-auto mb-4 w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading expenses...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 mb-6 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Expenses History Table */}
        {!isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Expenses History
                </h2>

                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by date, technician, km values..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="py-2 pr-10 pl-10 w-full text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="flex absolute inset-y-0 right-0 items-center pr-3"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results Info */}
              {searchQuery && (
                <div className="mt-3 text-sm text-gray-600">
                  {filteredExpenses.length === 0 ? (
                    <span className="text-red-600">
                      No results found for "{searchQuery}"
                    </span>
                  ) : (
                    <span>
                      Showing {filteredExpenses.length} of {expenses.length}{" "}
                      entries
                      {filteredExpenses.length !== expenses.length && (
                        <span className="ml-2 text-blue-600">
                          (filtered by "{searchQuery}")
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            {expenses.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No expenses recorded
                </h3>
                <p className="mb-4 text-gray-500">
                  Start by adding your first petrol expense entry.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex gap-2 items-center px-4 py-2 mx-auto text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add First Expense
                </button>
              </div>
            ) : filteredExpenses.length === 0 && searchQuery ? (
              <div className="p-8 text-center">
                <Search className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No results found
                </h3>
                <p className="mb-4 text-gray-500">
                  No expenses match your search for "{searchQuery}"
                </p>
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Technician
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        From
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        To
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Opening KM
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Closing KM
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Total KM
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {expense.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex justify-center items-center mr-3 w-8 h-8 bg-blue-100 rounded-full">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {expense.technicianName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {expense.fromLocation}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {expense.toLocation}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {Number.parseFloat(expense.openingKm).toFixed(1)} km
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {Number.parseFloat(expense.closingKm).toFixed(1)} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {expense.totalKm.toFixed(1)} km
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDateString(expense.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PetrolExpensesPage;
