"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/admin-ui/button";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  showOpenButton?: boolean;
  onOpenUrl?: (url: string) => void;
  maxLength?: number;
  className?: string;
  originalValue?: string;
  onSave?: () => void;
  isSaveDisabled?: boolean;
}

export default function UrlInput({
  value,
  onChange,
  prefix = "https://",
  suffix = ".crunchycone.dev",
  placeholder = "myproject",
  label,
  error,
  disabled = false,
  showOpenButton: _showOpenButton = true,
  onOpenUrl: _onOpenUrl,
  maxLength = 50,
  className = "",
  originalValue = "",
  onSave,
  isSaveDisabled = false,
}: UrlInputProps) {
  const [isTaken, _setIsTaken] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const truncatedValue = inputValue.substring(0, maxLength);
    onChange(truncatedValue);
  };

  const hasError = Boolean(error || isTaken);
  const isAvailable = !hasError && value.trim() !== "";
  const hasChanged = value !== originalValue;
  const showSaveButton = isFocused && onSave && value.trim() !== "";
  const saveButtonDisabled = isSaveDisabled || hasError || !hasChanged;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <span className="text-base font-medium">{label}</span>}

      <div className="flex items-center space-x-3 min-w-0">
        <div className={`flex ${showSaveButton ? "flex-1" : "w-full"} min-w-0`}>
          {/* Prefix - only render if not empty */}
          {prefix && (
            <div className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm rounded-l-md flex-shrink-0">
              {prefix}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`flex-1 px-3 py-2 border focus:outline-none min-w-0 ${
              prefix ? "border-r-0 border-l-0 rounded-none" : "border-r-0 rounded-l-md"
            } border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
              disabled ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50" : ""
            }`}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? "url-input-error" : undefined}
          />

          {/* Suffix */}
          <div className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm rounded-r-md flex-shrink-0 whitespace-nowrap">
            {suffix}
          </div>
        </div>

        {/* Button Container - Only show when focused */}
        {showSaveButton && (
          <div className="flex-shrink-0 w-[120px] flex justify-end">
            <Button onClick={onSave} disabled={saveButtonDisabled} size="sm" className="w-full">
              Save changes
            </Button>
          </div>
        )}
      </div>

      {/* Availability Message - shown when focused */}
      {isFocused && value.trim() !== "" && (
        <p
          className={`text-sm ${
            isAvailable ? "text-green-600 dark:text-green-400" : "text-destructive"
          }`}
        >
          {isAvailable ? `${value}${suffix} is available` : `${value}${suffix} is already taken`}
        </p>
      )}
    </div>
  );
}
