"use client"

import { useState } from "react"

function DocumentVerificationForm({ documentId, onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documents, setDocuments] = useState([
    { id: 1, name: "Document 1", file: null, description: "" },
    { id: 2, name: "Document 2", file: null, description: "" },
  ])
  const [additionalDocuments, setAdditionalDocuments] = useState([])
  const [nextId, setNextId] = useState(3)

  const handleDocumentChange = (id, file) => {
    setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, file } : doc)))
  }

  const handleDocumentDescriptionChange = (id, description) => {
    setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, description } : doc)))
  }

  const handleAdditionalDocumentChange = (id, file) => {
    setAdditionalDocuments(additionalDocuments.map((doc) => (doc.id === id ? { ...doc, file } : doc)))
  }

  const handleAdditionalDocumentDescriptionChange = (id, description) => {
    setAdditionalDocuments(additionalDocuments.map((doc) => (doc.id === id ? { ...doc, description } : doc)))
  }

  const addDocument = () => {
    setAdditionalDocuments([
      ...additionalDocuments,
      { id: nextId, name: `Additional Document ${nextId - 2}`, file: null, description: "" },
    ])
    setNextId(nextId + 1)
  }

  const removeAdditionalDocument = (id) => {
    setAdditionalDocuments(additionalDocuments.filter((doc) => doc.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare document data with files and descriptions
      const documentData = {
        document1: documents[0].description || documents[0].name,
        document1File: documents[0].file,
        document2: documents[1].description || documents[1].name,
        document2File: documents[1].file,
        additionalDocuments: additionalDocuments
          .filter((doc) => doc.file)
          .map((doc) => doc.description || doc.name)
          .join(", "),
        additionalDocumentsFiles: additionalDocuments
          .filter((doc) => doc.file)
          .map((doc) => doc.file),
      }

      // Submit the document verification
      await onSubmit(documentId, documentData)

      // Close modal
      onClose()
    } catch (error) {
      console.error("Error submitting document verification:", error)
      alert("Failed to verify documents. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Required Documents */}
      {documents.map((doc) => (
        <div key={doc.id} className="space-y-2">
          <label htmlFor={`document-${doc.id}`} className="block text-sm font-medium">
            {doc.name} <span className="text-red-500">*</span>
          </label>
          <input
            id={`document-${doc.id}`}
            type="file"
            className="w-full border border-gray-300 rounded-md py-2 px-3 mb-2"
            onChange={(e) => handleDocumentChange(doc.id, e.target.files[0])}
            required
          />
          {/* <input
            type="text"
            placeholder={`Description for ${doc.name}`}
            className="w-full border border-gray-300 rounded-md py-2 px-3"
            value={doc.description}
            onChange={(e) => handleDocumentDescriptionChange(doc.id, e.target.value)}
          /> */}
        </div>
      ))}

      {/* Additional Documents */}
      {additionalDocuments.map((doc) => (
        <div key={doc.id} className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor={`document-${doc.id}`} className="block text-sm font-medium">
              {doc.name}
            </label>
            <button
              type="button"
              onClick={() => removeAdditionalDocument(doc.id)}
              className="text-red-500 hover:text-red-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <input
            id={`document-${doc.id}`}
            type="file"
            className="w-full border border-gray-300 rounded-md py-2 px-3 mb-2"
            onChange={(e) => handleAdditionalDocumentChange(doc.id, e.target.files[0])}
          />
          {/* <input
            type="text"
            placeholder={`Description for ${doc.name}`}
            className="w-full border border-gray-300 rounded-md py-2 px-3"
            value={doc.description}
            onChange={(e) => handleAdditionalDocumentDescriptionChange(doc.id, e.target.value)}
          /> */}
        </div>
      ))}

      {/* Add Document Button */}
      <div>
        <button
          type="button"
          onClick={addDocument}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Document
        </button>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Documents"
          )}
        </button>
      </div>
    </form>
  )
}

export default DocumentVerificationForm