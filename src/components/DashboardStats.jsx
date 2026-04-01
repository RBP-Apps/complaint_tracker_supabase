"use client"


import { useState, useEffect } from "react"
import { Clock, CheckCircle, AlertTriangle, Check, ArrowUp, ArrowDown, Shield } from 'lucide-react'
import supabase from "../utils/supabase";



function DashboardStats() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)


  useEffect(() => {
    const loggedInUser = localStorage.getItem('username')
    const loggedInRole = localStorage.getItem('userRole')

    console.log('DashboardStats - Retrieved from localStorage:', { loggedInUser, loggedInRole })

    if (loggedInUser) {
      setUser(loggedInUser)
    }

    if (loggedInRole) {
      setUserRole(loggedInRole)
    }
  }, [])


useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true)

      const { data: rows, error } = await supabase
        .from("FMS")
        .select("*")

      if (error) throw error

      console.log("Supabase Data:", rows)

      setData(rows)

    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  fetchData()
}, [])

  // Role-based filtering function
const getFilteredDataByRole = () => {
  if (!data) return [];

  console.log('DashboardStats - Filtering with user:', user, 'role:', userRole)

  // Admin/User → all data
  if (userRole && (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'user')) {
    return data;
  }

  // Tech → filter by technician_name
  if (userRole && userRole.toLowerCase() === 'tech' && user) {
    const filtered = data.filter((row) => {
      const technicianName = row.technician_name || "";
      return technicianName === user;
    });
    return filtered;
  }

  if (userRole && userRole.toLowerCase() === 'tech' && !user) {
    return [];
  }

  return data;
}

  // Get filtered data based on role
  const filteredData = getFilteredDataByRole()


  // Calculate stats from filtered data
  const totalComplaints = filteredData ? filteredData.length : 0


  // For pending complaints, we need to find the correct column for "submitted date" 
  // Since AJ doesn't exist, let's use a different logic
  // Check if row has data (any meaningful data in key columns)
  const pendingComplaints = filteredData
  ? filteredData.filter((row) => {
      const status = row.status;

      const hasData = row.complaint_id;

      const isPending =
        hasData &&
        (!status || status === "" || status === "Reject");

      return isPending;
    }).length
  : 0


  // For completed complaints - Changed to count "APPROVED-CLOSE" from column Z
 const completedComplaints = filteredData
  ? filteredData.filter((row) => {
      const status = row.status;

      const hasData = row.complaint_id;

      const isCompleted =
        hasData && status === "APPROVED-CLOSE";

      return isCompleted;
    }).length
  : 0


  // Insurance count - Count non-null values from column R (index 17)
const insuranceCount = filteredData
  ? filteredData.filter((row) => {
      const insurance = row.insurance_type;

      const hasInsurance =
        insurance !== null &&
        insurance !== undefined &&
        insurance !== "";

      return hasInsurance;
    }).length
  : 0


  console.log('Final stats:', { totalComplaints, pendingComplaints, completedComplaints, insuranceCount })


  const stats = [
    {
      title: "Total Complaints",
      value: isLoading ? "-" : totalComplaints,
      change: "+12%",
      trend: "up",
      icon: Clock,
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Pending Complaints",
      value: isLoading ? "-" : pendingComplaints,
      change: "-5%",
      trend: "down",
      icon: AlertTriangle,
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Completed Complaints",
      value: isLoading ? "-" : completedComplaints,
      change: "+18%",
      trend: "up",
      icon: CheckCircle,
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Insurance",
      value: isLoading ? "-" : insuranceCount,
      change: "+8%",
      trend: "up",
      icon: Shield,
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
  ]


  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index} className="rounded-lg border-0 shadow-lg overflow-hidden bg-white">
          <div className={`${stat.color} rounded-t-lg p-4 text-white`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{stat.title}</h3>
              <div className="bg-white/20 p-2 rounded-full">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className={`p-6 ${stat.lightColor}`}>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">{isLoading ? <span className="animate-pulse">...</span> : stat.value}</p>
              <div className={`flex items-center ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {stat.trend === "up" ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Compared to last month</p>
          </div>
        </div>
      ))}
    </div>
  )
}


export default DashboardStats
