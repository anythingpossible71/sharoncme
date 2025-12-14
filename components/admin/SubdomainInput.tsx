"use client";

import { useState, useEffect } from "react";
import UrlInput from "./UrlInput";

interface SubdomainInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showOpenButton?: boolean;
  onOpenUrl?: (url: string) => void;
  takenDomains?: string[];
  className?: string;
  originalValue?: string;
  onSave?: () => void;
}

export default function SubdomainInput({
  value,
  onChange,
  label = "Website address",
  placeholder = "myproject",
  disabled = false,
  showOpenButton = true,
  onOpenUrl,
  takenDomains = ["myapp", "avi", "app"],
  className = "",
  originalValue = "",
  onSave,
}: SubdomainInputProps) {
  const [isTaken, setIsTaken] = useState(false);

  // Validate subdomain against taken domains
  useEffect(() => {
    const isValid = !takenDomains.includes(value.toLowerCase());
    setIsTaken(!isValid && value.trim() !== "");
  }, [value, takenDomains]);

  // Default open URL behavior
  const defaultOpenUrl = (url: string) => {
    // Add https:// prefix when opening URL since we removed it from display
    const fullUrl = url.startsWith("https://") ? url : `https://${url}`;
    window.open(fullUrl, "_blank");
  };

  const error = isTaken ? "Website address already taken" : "";

  return (
    <UrlInput
      value={value}
      onChange={onChange}
      prefix=""
      suffix=".crunchycone.dev"
      label={label}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      showOpenButton={showOpenButton}
      onOpenUrl={onOpenUrl || defaultOpenUrl}
      maxLength={50}
      className={className}
      originalValue={originalValue}
      onSave={onSave}
      isSaveDisabled={isTaken}
    />
  );
}
