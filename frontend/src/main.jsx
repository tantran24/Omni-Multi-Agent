import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Suppress ONNX runtime warnings that might appear in the console
// This helps with the voice activity detection library which uses ONNX under the hood
const suppressOnnxWarnings = () => {
  const originalConsoleWarn = console.warn;
  console.warn = function (...args) {
    // Filter out ONNX runtime warnings
    const suppressPatterns = [
      "ONNX Runtime",
      "ort-wasm",
      "backend-wasm.js",
      "webgl backend",
      "Missing required GPU feature:",
    ];

    if (args && args.length > 0 && typeof args[0] === "string") {
      for (const pattern of suppressPatterns) {
        if (args[0].includes(pattern)) {
          return; // Don't log this warning
        }
      }
    }
    originalConsoleWarn.apply(console, args);
  };
};

// Apply the suppression before the app renders
suppressOnnxWarnings();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
