"use client";

import { useEffect } from "react";

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

export default function WidgetTestPage() {
  useEffect(() => {
    const initWidgets = () => {
      if (typeof window === "undefined" || !window.SharonContactWidget) return;

      try {
        window.SharonContactWidget.init({
          selector: "#widget-1",
          formtitle: false,
          formframe: false,
        });
        window.SharonContactWidget.init({
          selector: "#widget-2",
          formtitle: true,
          formframe: false,
        });
        window.SharonContactWidget.init({
          selector: "#widget-3",
          formtitle: false,
          formframe: true,
        });
        window.SharonContactWidget.init({
          selector: "#widget-4",
          formtitle: false,
          formframe: false,
        });
        window.SharonContactWidget.init({
          selector: "#widget-5",
          formtitle: false,
          formframe: false,
        });
      } catch (e) {
        console.error("Widget init error:", e);
      }
    };

    const loadScript = () => {
      if (document.querySelector('script[src="/contact-widget.js"]')) {
        if (window.SharonContactWidget) {
          initWidgets();
        } else {
          const check = setInterval(() => {
            if (window.SharonContactWidget) {
              clearInterval(check);
              initWidgets();
            }
          }, 50);
          setTimeout(() => clearInterval(check), 5000);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "/contact-widget.js";
      script.onload = () => {
        const check = setInterval(() => {
          if (window.SharonContactWidget) {
            clearInterval(check);
            initWidgets();
          }
        }, 50);
        setTimeout(() => clearInterval(check), 5000);
      };
      document.body.appendChild(script);
    };

    loadScript();
  }, []);

  return (
    <>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          padding: "40px",
          maxWidth: "1200px",
          margin: "0 auto",
          background: "#f5f5f5",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "40px",
            color: "#333",
          }}
        >
          Contact Widget Test Page
        </h1>

        {/* Test 1: No title, no frame */}
        <div
          style={{
            background: "white",
            padding: "30px",
            marginBottom: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#555",
              borderBottom: "2px solid #00A165",
              paddingBottom: "10px",
            }}
          >
            Test 1: No Title, No Frame
          </h2>
          <div
            style={{
              color: "#666",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            This is the configuration you requested: formtitle=false, formframe=false
          </div>
          <div style={{ marginTop: "20px" }}>
            <div id="widget-1"></div>
          </div>
        </div>

        {/* Test 2: With title, no frame */}
        <div
          style={{
            background: "white",
            padding: "30px",
            marginBottom: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#555",
              borderBottom: "2px solid #00A165",
              paddingBottom: "10px",
            }}
          >
            Test 2: With Title, No Frame
          </h2>
          <div
            style={{
              color: "#666",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            formtitle=true, formframe=false
          </div>
          <div style={{ marginTop: "20px" }}>
            <div id="widget-2"></div>
          </div>
        </div>

        {/* Test 3: No title, with frame */}
        <div
          style={{
            background: "white",
            padding: "30px",
            marginBottom: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#555",
              borderBottom: "2px solid #00A165",
              paddingBottom: "10px",
            }}
          >
            Test 3: No Title, With Frame
          </h2>
          <div
            style={{
              color: "#666",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            formtitle=false, formframe=true
          </div>
          <div style={{ marginTop: "20px" }}>
            <div id="widget-3"></div>
          </div>
        </div>

        {/* Test 4: Using JavaScript API */}
        <div
          style={{
            background: "white",
            padding: "30px",
            marginBottom: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#555",
              borderBottom: "2px solid #00A165",
              paddingBottom: "10px",
            }}
          >
            Test 4: Using JavaScript API (No Title, No Frame)
          </h2>
          <div
            style={{
              color: "#666",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            Using SharonContactWidget.init() method
          </div>
          <div style={{ marginTop: "20px" }}>
            <div id="widget-4"></div>
          </div>
        </div>

        {/* Test 5: Using URL parameters */}
        <div
          style={{
            background: "white",
            padding: "30px",
            marginBottom: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#555",
              borderBottom: "2px solid #00A165",
              paddingBottom: "10px",
            }}
          >
            Test 5: Using URL Parameters (No Title, No Frame)
          </h2>
          <div
            style={{
              color: "#666",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            Using query string parameters: ?formtitle=false&formframe=false
          </div>
          <div style={{ marginTop: "20px" }}>
            <div id="widget-5"></div>
          </div>
        </div>
      </div>
    </>
  );
}
