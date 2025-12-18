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

export default function TestWidgetPage() {
  const scriptLoaded = useRef(false);
  const widgetInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (scriptLoaded.current && widgetInitialized.current) return;

    // Check if widget is already available
    if (window.SharonContactWidget && !widgetInitialized.current) {
      // Check if container already has shadow root
      const container = document.querySelector("#widget-container");
      if (container && (container as any).shadowRoot) {
        // Already initialized, skip
        widgetInitialized.current = true;
        return;
      }

      window.SharonContactWidget.init({
        selector: "#widget-container",
        formtitle: false,
        formframe: false,
      });
      widgetInitialized.current = true;
      return;
    }

    // Load the script without data attributes (to prevent auto-init)
    if (!scriptLoaded.current) {
      const script = document.createElement("script");
      script.src = "/contact-widget.js";
      script.onload = () => {
        scriptLoaded.current = true;
        // Wait a tick for the script to fully initialize
        setTimeout(() => {
          if (window.SharonContactWidget && !widgetInitialized.current) {
            const container = document.querySelector("#widget-container");
            if (container && !(container as any).shadowRoot) {
              window.SharonContactWidget.init({
                selector: "#widget-container",
                formtitle: false,
                formframe: false,
              });
              widgetInitialized.current = true;
            }
          }
        }, 100);
      };
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup: remove script on unmount
      const existingScript = document.querySelector('script[src="/contact-widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      scriptLoaded.current = false;
      widgetInitialized.current = false;
    };
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
