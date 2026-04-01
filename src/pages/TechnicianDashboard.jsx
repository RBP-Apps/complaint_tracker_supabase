import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
const Dashboard = () => {
  const [userData, setUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState('');
  const [userPermissions, setUserPermissions] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec';


  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedPermissions = localStorage.getItem('userPermissions');
    const storedRole = localStorage.getItem('userRole'); // NEW - Role fetch kar rahe hain

    if (!storedUsername) {
      window.location.href = '/login';
      return;
    }

    setCurrentUser(storedUsername);
    setUserPermissions(storedPermissions || '');

    // Role based access check
    const userRole = storedRole ? storedRole.toLowerCase() : '';

    const hasTrackerAccess = userRole === 'admin' ||
      userRole === 'technician' ||
      (storedPermissions && storedPermissions.toLowerCase().includes('tracker'));

    if (hasTrackerAccess) {
      setHasAccess(true);
    } else {
      alert('Access Denied: You do not have permission to view this page');
      window.location.href = '/dashboard';
      return;
    }
  }, []);

  useEffect(() => {
    if (currentUser && hasAccess) {
      fetchData();
    }
  }, [currentUser, hasAccess]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const sheetUrl = "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS";
      const response = await fetch(sheetUrl);
      const text = await response.text();

      const jsonData = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
      const rows = jsonData.table.rows;
      const headers = jsonData.table.cols.map(col => col.label || '');

      // DEBUG: Pehli row ka pura data dekho
      console.log('=== DEBUGGING COLUMNS ===');

      console.log('=== END DEBUG ===');

      const dataRows = rows.slice(1);

      const processedData = dataRows
        .map((row, index) => {
          const cells = row.c || [];


          if (index < 5) { // First 5 rows check karo
            console.log(`=== ROW ${index} DATE DEBUG ===`);
            console.log('Cell 33 raw object:', cells[33]);
            console.log('Cell 33 value (.v):', cells[33]?.v);
            console.log('Cell 33 formatted (.f):', cells[33]?.f);
            console.log('Type of value:', typeof cells[33]?.v);
            console.log('============================');
          }

          // Sabhi important columns log karo
          const rowData = {
            id: index,
            technicianName: cells[27]?.v || '',
            technicianContact: cells[28]?.v || '',
            assigneeName: cells[29]?.v || '',
            assigneeWhatsApp: cells[30]?.v || '',
            location2: cells[31]?.v || '',
            complaintDetails: cells[32]?.v || '',
            expectedCompletionDate: cells[33]?.f || cells[33]?.v || '',
            notesForTechnician: cells[34]?.v || '',

            // YEH COLUMNS DHYAN SE DEKHO - console me kaunsa index me data hai
            columnAJ: cells[35]?.v || null,
            columnAK: cells[36]?.v || null,
            column37: cells[37]?.v || null,
            column38: cells[38]?.v || null,
            column39: cells[39]?.v || null,
            column40: cells[40]?.v || null,
          };

          // First 2 rows ka data console me print karo
          if (index < 2) {
            console.log(`Row ${index} data:`, rowData);
          }

          return rowData;
        })
        .filter(row => {
          const userRole = localStorage.getItem('userRole');
          const technicianName = (row.technicianName || '').toString().trim().toLowerCase();

          if (!technicianName) {
            return false;
          }

          if (userRole && userRole.toLowerCase() === 'admin') {
            return true;
          }

          const currentUserTrimmed = currentUser.toString().trim().toLowerCase();

          // Exact match ya partial match dono check karenge
          // Example: "raju" technicianName me hai to "techRaju" ya "raju" dono match ho jayega
          return technicianName === currentUserTrimmed ||
            technicianName.includes(currentUserTrimmed) ||
            currentUserTrimmed.includes(technicianName);
        });

      console.log('Total filtered data:', processedData.length);
      console.log('Sample processed data:', processedData.slice(0, 2));

      setUserData(processedData);
      setFilteredData(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Please try again.');
      setLoading(false);
    }
  };
  const getCardData = () => {
    const totalRequests = userData.length;

    // Complete: Column AJ NOT NULL AND Column AK NOT NULL
    const completeRequests = userData.filter(row => {
      const columnAJ = row.columnAJ !== null && row.columnAJ !== undefined && row.columnAJ !== '';
      const columnAK = row.columnAK !== null && row.columnAK !== undefined && row.columnAK !== '';
      return columnAJ && columnAK;
    }).length;

    // Pending: Column AJ NOT NULL AND Column AK NULL
    const pendingRequests = userData.filter(row => {
      const columnAJ = row.columnAJ !== null && row.columnAJ !== undefined && row.columnAJ !== '';
      const columnAK = row.columnAK !== null && row.columnAK !== undefined && row.columnAK !== '';
      return columnAJ && !columnAK;
    }).length;

    return {
      total: totalRequests,
      complete: completeRequests,
      pending: pendingRequests
    };
  };

  useEffect(() => {
    let filtered = userData;

    if (statusFilter === 'pending') {
      // Column AJ NOT NULL AND Column AK NULL
      filtered = userData.filter(row => {
        const columnAJ = row.columnAJ !== null && row.columnAJ !== undefined && row.columnAJ !== '';
        const columnAK = row.columnAK !== null && row.columnAK !== undefined && row.columnAK !== '';
        return columnAJ && !columnAK;
      });
    } else if (statusFilter === 'complete') {
      // Column AJ NOT NULL AND Column AK NOT NULL
      filtered = userData.filter(row => {
        const columnAJ = row.columnAJ !== null && row.columnAJ !== undefined && row.columnAJ !== '';
        const columnAK = row.columnAK !== null && row.columnAK !== undefined && row.columnAK !== '';
        return columnAJ && columnAK;
      });
    }

    setFilteredData(filtered);
  }, [statusFilter, userData]);

  const getStatus = (row) => {
    const columnAJ = row.columnAJ !== null && row.columnAJ !== undefined && row.columnAJ !== '';
    const columnAK = row.columnAK !== null && row.columnAK !== undefined && row.columnAK !== '';

    // Column AJ not null AND Column AK not null = Complete
    if (columnAJ && columnAK) {
      return 'Complete';
    }

    // Column AJ not null AND Column AK null = Pending
    if (columnAJ && !columnAK) {
      return 'Pending';
    }

    // Dono null = Not Started
    return 'Not Started';
  };



  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view this page.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }



  const cardData = getCardData();




  const formatDate = (dateValue) => {
    if (!dateValue) return '-';

    try {
      // If it's already in dd/mm/yyyy format, convert to dd/mm/yy
      if (typeof dateValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
        const parts = dateValue.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].slice(-2); // Last 2 digits of year
        return `${day}/${month}/${year}`;
      }

      // If it's in Date(2025,9,14) format (as string)
      if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
        const match = dateValue.match(/Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/);
        if (match) {
          const year = match[1].slice(-2);
          const month = (parseInt(match[2]) + 1).toString().padStart(2, '0'); // Month is 0-indexed
          const day = match[3].padStart(2, '0');
          return `${day}/${month}/${year}`;
        }
      }

      // Return original if can't parse
      return dateValue.toString();

    } catch (error) {
      return dateValue ? dateValue.toString() : '-';
    }
  };






  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Technician Dashboard - <span className="text-blue-600">{currentUser}</span>
              </h1>
              <p className="mt-2 text-gray-600">
                Access Level: <span className="font-medium">{userPermissions || 'Standard User'}</span>
              </p>
            </div>

          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          ) : (
            <>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Requests</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{cardData.total}</p>
                      <p className="text-xs text-gray-500 mt-1">Assigned to {currentUser}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Complete</h3>
                      <p className="text-3xl font-bold text-green-600 mt-1">{cardData.complete}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {cardData.total > 0 ? Math.round((cardData.complete / cardData.total) * 100) : 0}% completion rate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</h3>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{cardData.pending}</p>
                      <p className="text-xs text-gray-500 mt-1">Need attention</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
                    Assigned Requests ({filteredData.length})
                  </h2>
                  <div className="flex items-center space-x-3">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                      Filter by Status:
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm font-medium text-gray-700"
                    >
                      <option value="all">All Status ({userData.length})</option>
                      <option value="pending">Pending Only ({cardData.pending})</option>
                      <option value="complete">Complete Only ({cardData.complete})</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Technician Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Technician Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignee Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignee WhatsApp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Complaint Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.length > 0 ? (
                        filteredData.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {row.technicianName || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row.technicianContact || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row.assigneeName || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row.assigneeWhatsApp || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {row.location2 || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                              <div className="truncate" title={row.complaintDetails}>
                                {row.complaintDetails || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(row.expectedCompletionDate)}
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                              <div className="truncate" title={row.notesForTechnician}>
                                {row.notesForTechnician || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatus(row) === 'Complete'
                                ? 'bg-green-100 text-green-800'
                                : getStatus(row) === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                {getStatus(row)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                            No requests found.
                          </td>
                        </tr>
                      )
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;