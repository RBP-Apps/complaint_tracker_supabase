// "use client"

// import { useState, useEffect } from "react"
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
//   LineChart,
//   Line,
// } from "recharts"

// function DashboardCharts() {
//   const [data, setData] = useState(null)
//   const [isMounted, setIsMounted] = useState(false)
//   const [windowWidth, setWindowWidth] = useState(0)
//   const [activeTab, setActiveTab] = useState("monthly")
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const [user, setUser] = useState(null)
//   const [userRole, setUserRole] = useState(null)

//   useEffect(() => {
//     setIsMounted(true)
//     setWindowWidth(window.innerWidth)

//     const handleResize = () => {
//       setWindowWidth(window.innerWidth)
//     }

//     window.addEventListener("resize", handleResize)
//     return () => {
//       window.removeEventListener("resize", handleResize)
//     }
//   }, [])

//   useEffect(() => {
//     const loggedInUser = localStorage.getItem('username')
//     const loggedInRole = localStorage.getItem('userRole')

//     console.log('DashboardCharts - Retrieved from localStorage:', { loggedInUser, loggedInRole })

//     if (loggedInUser) {
//       setUser(loggedInUser)
//     }

//     if (loggedInRole) {
//       setUserRole(loggedInRole)
//     }
//   }, [])

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true)
//         const sheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS"
//         const response = await fetch(sheetUrl)

//         if (!response.ok) {
//           throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`)
//         }

//         const text = await response.text()

//         const jsonStart = text.indexOf('{')
//         const jsonEnd = text.lastIndexOf('}') + 1

//         if (jsonStart === -1 || jsonEnd === 0) {
//           throw new Error("Invalid response format from Google Sheets")
//         }

//         const jsonData = text.substring(jsonStart, jsonEnd)
//         const parsedData = JSON.parse(jsonData)

//         if (parsedData && parsedData.table && parsedData.table.rows) {
//           // Skip the header rows (first 2 rows) - data starts from row 3
//           setData(parsedData.table.rows.slice(2))
//         } else {
//           throw new Error("No data found in the sheet")
//         }
//       } catch (err) {
//         console.error("Error fetching data:", err)
//         setError(err.message)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchData()
//   }, [])

//   // Role-based filtering function
//   const getFilteredDataByRole = () => {
//     if (!data) return [];

//     console.log('DashboardCharts - Filtering with user:', user, 'role:', userRole)

//     // If no role is set, show all data
//     if (!userRole) {
//       console.log('DashboardCharts - No role set, showing all data')
//       return data;
//     }

//     // If admin, show all data
//     if (userRole.toLowerCase() === 'admin') {
//       console.log('DashboardCharts - Admin user, showing all data')
//       return data;
//     }

//     // If user role and has username, filter by technician name
//     if (user) {
//       console.log('DashboardCharts - User role, filtering by technician name:', user)
//       const filtered = data.filter((row) => {
//         // Column AB is technician name, in data array it's at row.c[19]
//         const technicianName = row.c[19]?.v || "";
//         const match = technicianName === user;
//         return match;
//       });
//       console.log('DashboardCharts - Filtered data count:', filtered.length)
//       return filtered;
//     }

//     // If user role but no username, show empty
//     console.log('DashboardCharts - User role but no username, showing empty')
//     return [];
//   }

//   // Process data for charts using filtered data
//   const processComplaintsByProduct = () => {
//     const filteredData = getFilteredDataByRole();

//     if (!filteredData || filteredData.length === 0) return []

//     const productCounts = {}
//     const colors = ["#2563eb", "#4b83f0", "#7aa5f8", "#a3c2fa", "#cce0fd"]

//     // Count complaints by product (column N, index 13)
//     filteredData.forEach((row) => {
//       if (row.c && row.c[13] && row.c[13].v) {
//         const product = row.c[13].v
//         productCounts[product] = (productCounts[product] || 0) + 1
//       }
//     })

//     // Convert to array format for chart
//     return Object.entries(productCounts)
//       .map(([name, value], index) => ({
//         name,
//         value,
//         color: colors[index % colors.length],
//       }))
//       .sort((a, b) => b.value - a.value)
//       .slice(0, 5) // Top 5 products
//   }

//   const processComplaintsByMonth = () => {
//     const filteredData = getFilteredDataByRole();

//     if (!filteredData || filteredData.length === 0) return []

//     // Initialize all months with zeros
//     const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
//     const monthCounts = Object.fromEntries(
//       allMonths.map(month => [month, { completed: 0, pending: 0 }])
//     )

//     filteredData.forEach((row, rowIndex) => {
//       if (row.c && row.c[49] && row.c[49].v) { // Column AX (index 49) for date
//         try {
//           const dateValue = row.c[49].v
//           let date

//           // Handle Date(2025,5,3) format from Google Sheets
//           if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
//             const match = dateValue.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/)
//             if (match) {
//               const year = parseInt(match[1])
//               const month = parseInt(match[2]) // Month is 0-indexed in this format
//               const day = parseInt(match[3])
//               date = new Date(year, month, day)
//             }
//           }
//           // Handle other date formats
//           else if (typeof dateValue === 'string') {
//             date = new Date(dateValue)
//           }
//           else if (dateValue instanceof Date) {
//             date = new Date(dateValue)
//           }

//           // Check if date is valid
//           if (!date || isNaN(date.getTime())) {
//             return
//           }

//           const monthName = date.toLocaleString('default', { month: 'short' })

//           // Check completion status - look for any non-empty value in columns 50-56 (AY-BE)
//           let isCompleted = false
//           for (let i = 50; i <= 51; i++) {
//             if (row.c[i] && row.c[i].v && row.c[i].v !== '') {
//               isCompleted = true
//               break
//             }
//           }

//           if (isCompleted) {
//             monthCounts[monthName].completed++
//           } else {
//             monthCounts[monthName].pending++
//           }
//         } catch (e) {
//           console.error(`Error processing row ${rowIndex}:`, e)
//         }
//       }
//     })

//     // Return data for all months
//     return allMonths.map(month => ({
//       name: month,
//       completed: monthCounts[month].completed,
//       pending: monthCounts[month].pending
//     }))
//   }

//   // Calculate resolution time data (mock data for now)
//   const resolutionTime = [
//     { name: "Week 1", time: 5 },
//     { name: "Week 2", time: 4 },
//     { name: "Week 3", time: 3.5 },
//     { name: "Week 4", time: 3 },
//     { name: "Week 5", time: 2.5 },
//     { name: "Week 6", time: 2 },
//   ]

//   const complaintsByProduct = processComplaintsByProduct()
//   const complaintsByMonth = processComplaintsByMonth()

//   // Determine chart height based on screen size
//   const getChartHeight = () => {
//     if (windowWidth < 640) return 200
//     if (windowWidth < 1024) return 250
//     return 300
//   }

//   if (!isMounted) {
//     return <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
//   }

//   if (isLoading) {
//     return (
//       <div className="grid gap-4 md:grid-cols-2">
//         <div className="rounded-lg border-0 shadow-lg bg-white h-80 flex items-center justify-center">
//           <div className="text-gray-400">Loading chart data...</div>
//         </div>
//         <div className="rounded-lg border-0 shadow-lg bg-white h-80 flex items-center justify-center">
//           <div className="text-gray-400">Loading chart data...</div>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="rounded-lg border-0 shadow-lg bg-white p-6">
//         <div className="text-red-500">Error loading chart data: {error}</div>
//       </div>
//     )
//   }

//   return (
//     <div className="grid gap-4 md:grid-cols-2">
//       <div className="rounded-lg border-0 shadow-lg bg-white">
//         <div className="pb-2 p-6">
//           <h3 className="text-lg font-medium">Complaints by Product</h3>
//           {userRole && (
//             <p className="text-xs text-gray-500 mt-1">
//               Showing data for: {userRole.toLowerCase() === 'admin' ? 'All Users' : user || 'Current User'}
//             </p>
//           )}
//         </div>
//         <div className="pt-0 px-6 pb-6">
//           <div style={{ height: getChartHeight() }}>
//             {complaintsByProduct.length === 0 ? (
//               <div className="flex items-center justify-center h-full text-gray-500">
//                 No product data available
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={complaintsByProduct}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     outerRadius={windowWidth < 640 ? 60 : 80}
//                     fill="#8884d8"
//                     dataKey="value"
//                     label={({ name, percent }) =>
//                       windowWidth < 400 ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`
//                     }
//                   >
//                     {complaintsByProduct.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                   <Legend
//                     layout={windowWidth < 640 ? "horizontal" : "vertical"}
//                     verticalAlign={windowWidth < 640 ? "bottom" : "middle"}
//                     align={windowWidth < 640 ? "center" : "right"}
//                   />
//                 </PieChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="rounded-lg border-0 shadow-lg bg-white">
//         <div className="pb-2 p-6">
//           <h3 className="text-lg font-medium">Complaints Overview</h3>
//           {userRole && (
//             <p className="text-xs text-gray-500 mt-1">
//               Showing data for: {userRole.toLowerCase() === 'admin' ? 'All Users' : user || 'Current User'}
//             </p>
//           )}
//         </div>
//         <div className="pt-0 px-6 pb-6">
//           <div className="mb-4">
//             <div className="grid w-full grid-cols-2 rounded-lg overflow-hidden">
//               <button
//                 className={`py-2 px-4 text-sm font-medium ${activeTab === "monthly" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
//                 onClick={() => setActiveTab("monthly")}
//               >
//                 Monthly
//               </button>
//               <button
//                 className={`py-2 px-4 text-sm font-medium ${activeTab === "resolution" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
//                 onClick={() => setActiveTab("resolution")}
//               >
//                 Resolution Time
//               </button>
//             </div>
//           </div>

//           {activeTab === "monthly" && (
//             <div style={{ height: getChartHeight() }}>
//               {complaintsByMonth.every(m => m.completed === 0 && m.pending === 0) ? (
//                 <div className="flex items-center justify-center h-full text-gray-500">
//                   No monthly data available
//                 </div>
//               ) : (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={complaintsByMonth} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Legend />
//                     <Bar dataKey="completed" fill="#2563eb" name="Completed" />
//                     <Bar dataKey="pending" fill="#93c5fd" name="Pending" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               )}
//             </div>
//           )}

//           {activeTab === "resolution" && (
//             <div style={{ height: getChartHeight() }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={resolutionTime} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis
//                     label={{ value: "Days", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
//                   />
//                   <Tooltip />
//                   <Legend />
//                   <Line type="monotone" dataKey="time" stroke="#2563eb" name="Avg. Resolution Time (Days)" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default DashboardCharts