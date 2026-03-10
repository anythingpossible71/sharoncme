"use client";
import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HebrewDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  dir?: "rtl" | "ltr";
}

const HebrewDateInput = forwardRef<HTMLInputElement, HebrewDateInputProps>(
  ({ className, dir = "rtl", ...props }, ref) => {
    return (
      <Input
        type="date"
        className={cn(
          "h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik] cursor-pointer",
          dir === "rtl" && "text-right",
          dir === "ltr" && "text-left",
          className
        )}
        dir={dir}
        ref={ref}
        {...props}
        onClick={(e) => {
          // Make the entire input clickable to open the date picker
          // Only call showPicker if it's a direct user interaction
          try {
            if (e.currentTarget.showPicker && e.isTrusted) {
              e.currentTarget.showPicker();
            }
          } catch (error) {
            // Fallback: just focus the input, which will show the native picker
            e.currentTarget.focus();
          }
        }}
        onFocus={(e) => {
          // Don't auto-open on focus to avoid the user gesture error
          // Let the user click to open the picker
        }}
        style={{
          // Hebrew calendar localization
          ...props.style,
        }}
      />
    );
  }
);

HebrewDateInput.displayName = "HebrewDateInput";

export { HebrewDateInput };

