"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Search, ChevronDown, X, Check } from "lucide-react"

/**
 * Reusable Searchable Select Component
 * Allows users to search within dropdown options
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select option...",
  disabled = false,
  className = "",
  allOptionLabel = null, // e.g. "All Districts"
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Normalize options to { label, value }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          label: String(opt.label ?? opt.name ?? opt.value ?? ""),
          value: String(opt.value ?? opt.id ?? opt.label ?? ""),
        }
      }
      return {
        label: String(opt),
        value: String(opt),
      }
    }).filter((opt) => opt.value !== "")
  }, [options])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("")
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions
    const q = searchQuery.toLowerCase().trim()
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    )
  }, [normalizedOptions, searchQuery])

  // Find selected label
  const selectedOption = normalizedOptions.find((opt) => opt.value === String(value))
  const displayLabel = selectedOption ? selectedOption.label : value

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev)
        }}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-md text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 ${
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : "cursor-pointer"
        } ${displayLabel ? "text-gray-900 font-medium" : "text-gray-400"}`}
      >
        <span className="truncate flex-1">
          {displayLabel || placeholder}
        </span>

        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange("")
                }
              }}
              className="p-0.5 hover:text-red-500 rounded hover:bg-gray-100 transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-xs sm:text-sm max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-150 left-0">
          {/* Search Input Box */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false)
                  }
                }}
                className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48 py-1">
            {/* Optional "All" item if provided */}
            {allOptionLabel && !searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between ${
                  !value ? "bg-blue-50 font-semibold text-blue-600" : "text-gray-600"
                }`}
              >
                <span>{allOptionLabel}</span>
                {!value && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(value) === String(opt.value)
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between text-xs sm:text-sm ${
                      isSelected
                        ? "bg-blue-50 font-semibold text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
