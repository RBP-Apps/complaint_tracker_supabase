"use client"

import { useState, useEffect } from "react"
import DocumentVerificationForm from "./DocumentVerificationForm"

function PendingDocumentVerificationTable() {
  const [pendingDocuments, setPendingDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")

  // Google Drive folder ID for file uploads
  const DRIVE_FOLDER_ID = "1XqVaevdcDk5xPqdC6qY8mPOsGwdPsGme"
  // Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwnIMOzsFbniWnPFhl3lzE-2W0l6lD23keuz57-ldS_umSXIJqpEK-qxLE6eM0s7drqrQ/exec"


  const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    let date;

    // Handle ISO string format (2025-05-22T07:38:28.052Z)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    }
    // Handle date format (2025-05-21)
    else if (typeof dateValue === 'string' && dateValue.includes('-')) {
      date = new Date(dateValue);
    }
    // Handle Google Sheets Date constructor format like "Date(2025,4,21)"
    else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      // Extract the date parts from "Date(2025,4,21)" format
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]); // Month is 0-indexed in this format
        const day = parseInt(match[3]);
        date = new Date(year, month, day);
      } else {
        return dateValue;
      }
    }
    // Handle if it's already a Date object
    else if (typeof dateValue === 'object' && dateValue.getDate) {
      date = dateValue;
    }
    else {
      return dateValue; // Return as is if not a recognizable date format
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateValue; // Return original value if invalid date
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to fetch data from Google Sheets
  useEffect(() => {
    const fetchPendingDocuments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the entire sheet using Google Sheets API directly
        const sheetUrl =
          "https://docs.google.com/spreadsheets/d/1A9kxc6P8UkQ-pY8R8DQHpW9OIGhxeszUoTou1yKpNvU/gviz/tq?tqx=out:json&sheet=FMS"
        const response = await fetch(sheetUrl)
        const text = await response.text()

        // Extract the JSON part from the response
        const jsonStart = text.indexOf("{")
        const jsonEnd = text.lastIndexOf("}") + 1
        const jsonData = text.substring(jsonStart, jsonEnd)

        const data = JSON.parse(jsonData)

        // Process the pending document verification data
        if (data && data.table && data.table.rows) {
          const documentsData = []

          // Skip the header row and process the data rows
          data.table.rows.slice(3).forEach((row, index) => {
            if (row.c) {
              // Check if column AO (index 41) is not null and column AP (index 42) is null
              // This is just an example condition - you may need to adjust based on your sheet structure
              const needsDocumentVerification = row.c[49] && row.c[49].v !== null && row.c[49].v !== ""
              const isDocumentVerified = !row.c[50] || row.c[50].v === null || row.c[50].v === ""

              // Only include rows that need document verification
              if (needsDocumentVerification && isDocumentVerified) {
                const document = {
                  rowIndex: index + 6, // Actual row index in the sheet
                  id: row.c[1]?.v || `COMP-${index + 1}`, // Column B - Complaint No.
                  date: formatDateString(row.c[2]?.v) || "", // Column C - Date
                  name: row.c[3]?.v || "", // Column D - Name
                  phone: row.c[6]?.v || "", // Column G - Phone (fixed index from 46 to 6)
                  email: formatDateString(row.c[47]?.v) || "", // Column AV - Email
                  address: row.c[48]?.v || "", // Column AW - Address
                };

                documentsData.push(document);
              }
            }
          });

          setPendingDocuments(documentsData);
        }
      } catch (err) {
        console.error("Error fetching pending documents data:", err)
        setError(err.message)
        // On error, set to empty array
        setPendingDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingDocuments()
  }, [])

  // Filter documents based on search term
  const filteredDocuments = pendingDocuments.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Function to upload file to Google Drive
  const uploadFileToDrive = async (file, fileType) => {
    if (!file) return null;

    try {
      setUploadStatus(`Uploading ${fileType}...`);

      // Convert file to base64
      const reader = new FileReader();
      const fileBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create form data
      const formData = new FormData();
      formData.append('action', 'uploadFile');
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type);
      formData.append('folderId', DRIVE_FOLDER_ID);
      formData.append('data', fileBase64);

      // Send the request
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData
      });

      // Parse the response
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload file');
      }

      // Return the direct file URL
      return `https://drive.google.com/uc?id=${result.fileId}`;

    } catch (err) {
      console.error(`Error uploading ${fileType}:`, err);
      setUploadStatus(`Error uploading ${fileType}: ${err.message}`);
      return null;
    }
  };

  // Handle document verification form submission
  // Find the handleVerifyDocument function and update the row data preparation section
  // Here's the modified version of that section:

  // Handle document verification form submission
  // Submit each additional document individually

  // Submit each additional document to a different column

  const handleVerifyDocument = async (documentId, verificationData) => {
    try {
      // Get the document to verify
      const documentToVerify = pendingDocuments.find((doc) => doc.id === documentId)
      if (!documentToVerify) {
        throw new Error("Document not found")
      }

      // Upload files if they exist
      setUploadStatus("Processing document uploads...");

      let document1Url = "";
      let document2Url = "";
      let additionalDocsUrls = [];

      // Upload document 1 if exists
      if (verificationData.document1File) {
        document1Url = await uploadFileToDrive(verificationData.document1File, "Document 1");
        console.log("Document 1 uploaded, URL:", document1Url);
      }

      // Upload document 2 if exists
      if (verificationData.document2File) {
        document2Url = await uploadFileToDrive(verificationData.document2File, "Document 2");
        console.log("Document 2 uploaded, URL:", document2Url);
      }

      // Upload additional documents if exist
      if (verificationData.additionalDocumentsFiles && verificationData.additionalDocumentsFiles.length > 0) {
        for (let i = 0; i < verificationData.additionalDocumentsFiles.length; i++) {
          const file = verificationData.additionalDocumentsFiles[i];
          const url = await uploadFileToDrive(file, `Additional Document ${i + 1}`);
          if (url) additionalDocsUrls.push(url);
        }
        console.log("Additional documents uploaded, URLs:", additionalDocsUrls);
      }

      // Get the actual row index in the sheet
      const rowIndex = documentToVerify.rowIndex;

      setUploadStatus("Updating document verification data...");

      // Create an array with all columns, filled with empty strings
      // Make sure it's large enough to accommodate all additional documents (100 columns)
      const rowDataArray = new Array(100).fill("");

      // Fill the columns for verification status and first two documents
      // rowDataArray[46] = "Verified"; // Column AP - Verification Status
      rowDataArray[50] = new Date().toLocaleString('en-US')
      rowDataArray[52] = document1Url || ""; // Document 1 (Column AQ)
      rowDataArray[53] = document2Url || ""; // Document 2 (Column AR)

      // Now, put each additional document in its own column
      // Start with column AS (index 49) and continue to subsequent columns
      for (let i = 0; i < additionalDocsUrls.length; i++) {
        // Index 49 is column AS, 50 is AT, 51 is AU, etc.
        rowDataArray[54 + i] = additionalDocsUrls[i];
      }

      // Prepare form data for the update
      const formData = new FormData();
      formData.append("sheetName", "FMS");
      formData.append("action", "update");
      formData.append("rowIndex", rowIndex.toString());

      // Add the JSON string of row data to the form
      formData.append("rowData", JSON.stringify(rowDataArray));

      console.log("Submitting all documents for row:", rowIndex);
      console.log("Row data:", rowDataArray);

      // Post the update
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update sheet");
      }

      // Update the local state to remove this document from the list
      setPendingDocuments(pendingDocuments.filter((doc) => doc.id !== documentId));

      // Close the dialog
      setIsDialogOpen(false);
      setSelectedDocument(null);

      return true;
    } catch (err) {
      console.error("Error verifying document:", err);
      setUploadStatus(`Error: ${err.message}`);
      throw err;
    } finally {
      setUploadStatus("");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pending document verification...</div>
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
        <h1 className="text-xl font-bold">Pending Document Verification</h1>

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

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredDocuments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No pending document verification found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
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
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Verification Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Verification Password
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{doc.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:from-purple-500 hover:to-pink-600 border-0 py-1 px-3 rounded-md"
                        onClick={() => {
                          setSelectedDocument(doc.id)
                          setIsDialogOpen(true)
                        }}
                      >
                        Verify Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Document Verification Modal Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsDialogOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Verify Documents: {selectedDocument}
                    </h3>
                    <div className="mt-4 max-h-[60vh] overflow-auto">
                      {uploadStatus && (
                        <div className="flex items-center text-blue-600 mb-4">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{uploadStatus}</span>
                        </div>
                      )}
                      <DocumentVerificationForm
                        documentId={selectedDocument}
                        onClose={() => setIsDialogOpen(false)}
                        onSubmit={handleVerifyDocument}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingDocumentVerificationTable