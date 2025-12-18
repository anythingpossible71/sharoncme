"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    SharonContactWidget?: {
      init: (config: {
        selector?: string;
        formtitle?: boolean;
        formframe?: boolean;
        apiBaseUrl?: string;
        redirectUrl?: string;
      }) => void;
    };
  }
}

// Global flag to prevent multiple initializations across re-renders
let globalWidgetInitialized = false;

export default function TestWidgetPage() {
  const initAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initAttempted.current || globalWidgetInitialized) return;
    initAttempted.current = true;

    const container = document.querySelector("#widget-container");
    if (!container) return;

    // Check if widget is already initialized (has shadow root)
    if ((container as any).shadowRoot) {
      globalWidgetInitialized = true;
      return;
    }

    // Clear any existing content in container
    container.innerHTML = "";

    // Remove any existing widgets that might have been auto-initialized to the body
    // Look for divs with shadow roots that are direct children of body
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach((child) => {
      if (child.tagName === "DIV" && (child as any).shadowRoot && child.id !== "widget-container") {
        child.remove();
      }
    });

    const initializeWidget = () => {
      if (globalWidgetInitialized) return;

      const checkContainer = document.querySelector("#widget-container");
      if (!checkContainer) return;

      // If already has shadow root, mark as initialized and return
      if ((checkContainer as any).shadowRoot) {
        globalWidgetInitialized = true;
        return;
      }

      // Double-check: count how many widgets exist
      const allContainers = document.querySelectorAll("#widget-container");
      if (allContainers.length > 1) {
        // Multiple containers found, something is wrong
        console.warn("Multiple widget containers found");
      }

      if (window.SharonContactWidget) {
        try {
          window.SharonContactWidget.init({
            selector: "#widget-container",
            formtitle: false,
            formframe: false,
          });
          // Verify it was created
          setTimeout(() => {
            const verifyContainer = document.querySelector("#widget-container");
            if (verifyContainer && (verifyContainer as any).shadowRoot) {
              globalWidgetInitialized = true;
            }
          }, 100);
        } catch (error) {
          // If error is about shadow root already existing, that's okay - widget is already initialized
          if (error instanceof Error && error.message.includes("shadow tree")) {
            globalWidgetInitialized = true;
          } else {
            console.error("Failed to initialize widget:", error);
            initAttempted.current = false; // Allow retry on error
          }
        }
      }
    };

    // Check if widget is already available
    if (window.SharonContactWidget) {
      initializeWidget();
      return;
    }

    // Load the script with data-selector to prevent auto-init to body
    // The script will auto-init, but with our selector, it will target our container
    const existingScript = document.querySelector('script[src="/contact-widget.js"]');
    if (existingScript) {
      // Script already exists, wait a bit then initialize
      setTimeout(initializeWidget, 200);
      return;
    }

    const script = document.createElement("script");
    script.src = "/contact-widget.js";
    // Add data-selector so auto-init targets our container
    script.setAttribute("data-selector", "#widget-container");
    script.setAttribute("data-formtitle", "false");
    script.setAttribute("data-formframe", "false");

    // Store a flag before script loads to track if we should skip manual init
    let autoInitSucceeded = false;

    script.onload = () => {
      // The script will auto-init with our selector
      // Wait a bit then check if it was initialized
      setTimeout(() => {
        const checkContainer = document.querySelector("#widget-container");
        if (checkContainer && (checkContainer as any).shadowRoot) {
          // Auto-init worked, mark as initialized
          autoInitSucceeded = true;
          globalWidgetInitialized = true;
        } else {
          // Auto-init didn't work (maybe container wasn't ready), initialize manually
          // But only if not already initialized
          if (!globalWidgetInitialized && !autoInitSucceeded) {
            initializeWidget();
          }
        }
      }, 300);
    };
    script.onerror = () => {
      initAttempted.current = false; // Allow retry on error
      globalWidgetInitialized = false;
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ color: "#333", marginBottom: "20px" }}>Contact Form Widget Test</h1>

        <div
          style={{
            background: "#e3f2fd",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
            borderLeft: "4px solid #2196f3",
          }}
        >
          <strong>Test Configuration:</strong>
          <ul>
            <li>Title: Hidden (formtitle=false)</li>
            <li>Frame: Hidden (formframe=false)</li>
            <li>Embedded in container: #widget-container</li>
          </ul>
        </div>

        <div id="widget-container"></div>
      </div>
    </div>
  );
}
