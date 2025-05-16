// VAD Configuration for Omni Multi-Agent
// This file configures the Voice Activity Detection system with optimized settings for the frontend

import { useEffect } from "react";

/**
 * Configures the Voice Activity Detection (VAD) system for Omni Multi-Agent
 * 1. Sets up the ONNX runtime with appropriate settings
 * 2. Suppresses unnecessary warnings
 * 3. Ensures proper initialization
 */
export const configureVAD = () => {
  // If window is undefined, we're in SSR
  if (typeof window === "undefined") return;

  // Configure ONNX Runtime Web settings in global scope
  if (!window.onnxRuntimeSettings) {
    window.onnxRuntimeSettings = {
      // Use WebGL when available for better performance
      executionProviders: ["webgl"],
      // Reduce overall logging level
      logLevel: "warning",
      // Set to true to enable WebAssembly optimizations
      enableWasmMemoryOptimization: true,
    };
  }
};

/**
 * React hook to initialize VAD configuration
 */
export const useVADConfiguration = () => {
  useEffect(() => {
    configureVAD();

    // Apply CSS to hide any ONNX warnings that might get injected into the DOM
    const style = document.createElement("style");
    style.textContent = `
      .ort-warning, [data-onnx-warning], div[class*="ort-"], div[id*="ort-"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Clean up if needed
      if (style && document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
};

export default useVADConfiguration;
