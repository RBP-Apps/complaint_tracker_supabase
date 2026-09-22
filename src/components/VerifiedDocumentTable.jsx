"use client"

import { useState, useEffect } from "react"
import supabase from "../utils/supabase"

function VerifiedDocumentsTable() {
  const [verifiedDocuments, setVerifiedDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && dateValue.includes('/') && dateValue.includes(',')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    } else {
      return String(dateValue);
    }

    if (isNaN(date.getTime())) {
      return String(dateValue);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to fetch data from Supabase
  useEffect(() => {
    const fetchVerifiedDocuments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: sbError } = await supabase
          .from("FMS")
          .select("*")
          .order("id", { ascending: false });

        if (sbError) throw sbError;

        const documentsData = (data || [])
          .filter((row) => {
            const hasDoc = (row.document1 && row.document1.trim() !== "") ||
                           (row.document2 && row.document2.trim() !== "") ||
                           row.verification_date;
            return row.complaint_id && hasDoc;
          })
          .map((row, index) => ({
            rowIndex: index + 1,
            id: row.complaint_id,
            date: formatDateString(row.complaint_date || row.timestamp),
            name: row.company_name || row.beneficiary_name || "",
            phone: row.contact_number || "",
            email: row.email || "",
            address: [row.village, row.block, row.district].filter(Boolean).join(", ") || row.address || "",
            document1: row.document1 || "",
            document2: row.document2 || "",
            additionalDocuments: row.additional_documents || "",
            verificationDate: formatDateString(row.verification_date),
          }));

        setVerifiedDocuments(documentsData);
      } catch (err) {
        console.error("Error fetching verified documents from Supabase:", err);
        setError(err.message);
        setVerifiedDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifiedDocuments();
  }, []);

  // Filter documents based on search term
  const filteredDocuments = verifiedDocuments.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading verified documents...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl font-bold">Verified Documents</h1>

        <div className="relative">
          <input
            type="search"
            placeholder="Search documents..."
            className="pl-8 w-[200px] md:w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[500px] -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredDocuments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No verified documents found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Complaint ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Head
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Document 1
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Document 2
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Additional Documents
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Verification Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{doc.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">{doc.document1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.document2}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.additionalDocuments}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.document1 ? (
                        <a
                          href={doc.document1}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Document 1
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.document2 ? (
                        <a
                          href={doc.document2}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Document 2
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.additionalDocuments ? (
                        <a
                          href={doc.additionalDocuments}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Additional Docs
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.verificationDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifiedDocumentsTable