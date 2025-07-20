"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Filter } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  searchMode?: "$q" | "$autocomplete";
  isLoading?: boolean;
  onSearch?: (query: string, mode?: "$q" | "$autocomplete") => void;
  onClear?: () => void;
  onSearchModeChange?: (mode: "$q" | "$autocomplete") => void;
}

export function SearchInput({ 
  placeholder = "Search activities...", 
  className = "",
  value = "",
  searchMode = "$q",
  isLoading = false,
  onSearch,
  onClear,
  onSearchModeChange
}: SearchInputProps) {
  const [query, setQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showSearchMode, setShowSearchMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounce search with proper cleanup
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        onSearch?.(query, searchMode);
      } else {
        onClear?.();
      }
    }, 300);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchMode, onSearch, onClear]);

  const handleClear = () => {
    setQuery("");
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSearchModeChange = (mode: "$q" | "$autocomplete") => {
    setShowSearchMode(false);
    onSearchModeChange?.(mode);
    if (query.trim()) {
      onSearch?.(query, mode);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 bg-zinc-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        
        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-12 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {/* Search Mode Toggle */}
        <button
          onClick={() => setShowSearchMode(!showSearchMode)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Loading Indicator - Fixed position */}
      {isLoading && query.trim() && (
        <div className="absolute inset-y-0 right-8 flex items-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Search Mode Dropdown */}
      {showSearchMode && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <button
              onClick={() => handleSearchModeChange("$q")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                searchMode === "$q"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span className="text-sm font-medium">Exact Match ($q)</span>
            </button>
            <button
              onClick={() => handleSearchModeChange("$autocomplete")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                searchMode === "$autocomplete"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span className="text-sm font-medium">Autocomplete ($autocomplete)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 