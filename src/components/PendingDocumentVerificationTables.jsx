"use client"

import { useState, useEffect } from "react"
import DocumentVerificationForm from "./DocumentVerificationForm"
import supabase from "../utils/supabase"

function PendingDocumentVerificationTable() {
  const [pendingDocuments, setPendingDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")

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
    const fetchPendingDocuments = async () => {
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
            const hasComplaint = Boolean(row.complaint_id);
            const notVerified = !row.document1 && !row.document2 && !row.verification_date;
            return hasComplaint && notVerified;
          })
          .map((row, index) => ({
            rowIndex: index + 1,
            id: row.complaint_id,
            date: formatDateString(row.complaint_date || row.timestamp),
            name: row.beneficiary_name || row.technician_name || "",
            phone: row.contact_number || row.technician_contact || "",
            email: row.email || "",
            address: [row.village, row.block, row.district].filter(Boolean).join(", ") || row.address || "",
          }));

        setPendingDocuments(documentsData);
      } catch (err) {
        console.error("Error fetching pending documents from Supabase:", err);
        setError(err.message);
        setPendingDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingDocuments();
  }, []);

  // Filter documents based on search term
  const filteredDocuments = pendingDocuments.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to upload file to Supabase Storage
  const uploadFileToStorage = async (file, fileType) => {
    if (!file) return null;

    try {
      setUploadStatus(`Uploading ${fileType}...`);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${Date.now()}-${sanitizedName}`;

      let { error: uploadErr } = await supabase.storage
        .from("vendor_tracker")
        .upload(fileName, file, { upsert: true });

      if (uploadErr) {
        const fallbackRes = await supabase.storage
          .from("complaint_documents")
          .upload(fileName, file, { upsert: true });
        if (fallbackRes.error) throw uploadErr;
        const { data } = supabase.storage
          .from("complaint_documents")
          .getPublicUrl(fileName);
        return data.publicUrl;
      }

      const { data } = supabase.storage
        .from("vendor_tracker")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error(`Error uploading ${fileType}:`, err);
      setUploadStatus(`Error uploading ${fileType}: ${err.message}`);
      return null;
    }
  };

  // Handle document verification form submission
  const handleVerifyDocument = async (documentId, verificationData) => {
    try {
      const documentToVerify = pendingDocuments.find((doc) => doc.id === documentId);
      if (!documentToVerify) {
        throw new Error("Document not found");
      }

      setUploadStatus("Processing document uploads...");

      let document1Url = "";
      let document2Url = "";
      let additionalDocsUrls = [];

      if (verificationData.document1File) {
        document1Url = await uploadFileToStorage(verificationData.document1File, "Document 1");
      }

      if (verificationData.document2File) {
        document2Url = await uploadFileToStorage(verificationData.document2File, "Document 2");
      }

      if (verificationData.additionalDocumentsFiles && verificationData.additionalDocumentsFiles.length > 0) {
        for (let i = 0; i < verificationData.additionalDocumentsFiles.length; i++) {
          const file = verificationData.additionalDocumentsFiles[i];
          const url = await uploadFileToStorage(file, `Additional Document ${i + 1}`);
          if (url) additionalDocsUrls.push(url);
        }
      }

      setUploadStatus("Updating document verification data in Supabase...");

      const updatePayload = {
        document1: document1Url || "",
        document2: document2Url || "",
        additional_documents: additionalDocsUrls.join(","),
        verification_date: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from("FMS")
        .update(updatePayload)
        .eq("complaint_id", documentId);

      if (updateErr) {
        console.warn("Update with document columns failed, retrying with fallback:", updateErr);
        const fallbackPayload = {
          notes_for_technician: `Doc1: ${document1Url} | Doc2: ${document2Url}`,
        };
        await supabase.from("FMS").update(fallbackPayload).eq("complaint_id", documentId);
      }

      // Update local state
      setPendingDocuments(pendingDocuments.filter((doc) => doc.id !== documentId));
      setIsDialogOpen(false);
      setSelectedDocument(null);
      setUploadStatus("");

      alert(`Documents for ${documentId} verified and saved successfully!`);
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

      <div className="overflow-x-auto overflow-y-auto max-h-[500px] -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {filteredDocuments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No pending document verification found</p>
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