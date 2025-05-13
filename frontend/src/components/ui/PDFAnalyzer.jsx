import React, { useState } from "react";
import { readPDF } from "../../utils/readPDF";
import { normalizeImageUrl } from "../../utils/imageUtils";

const PDFAnalyzer = ({ pdfUrl, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);

  const analyzePDF = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisStatus("Starting PDF analysis...");

    try {
      // Normalize PDF URL if needed
      const normalizedUrl = normalizeImageUrl(pdfUrl);

      // Extract the relative path from the full URL
      const pdfPath = normalizedUrl.includes("http://localhost:8000")
        ? normalizedUrl.replace("http://localhost:8000", "")
        : normalizedUrl;

      console.log(`Analyzing PDF: ${pdfPath}`);
      setAnalysisStatus("Reading PDF content...");

      // Read the PDF content
      const pdfContent = await readPDF(pdfPath);

      // Call the completion handler with the content
      if (onAnalysisComplete) {
        setAnalysisStatus("Analysis complete! Sending results to AI...");
        onAnalysisComplete(pdfContent);
      }
    } catch (err) {
      console.error("Error analyzing PDF:", err);
      setError(err.message || "Failed to analyze PDF");
      setAnalysisStatus("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  // Render different button states based on analysis status
  const renderButtonContent = () => {
    if (isAnalyzing) {
      return (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
          <span>Analyzing PDF...</span>
        </>
      );
    }

    if (analysisStatus && analysisStatus.includes("complete")) {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 text-green-600 dark:text-green-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>PDF Analyzed</span>
        </>
      );
    }

    return (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1 text-purple-500"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <span>Analyze PDF Content</span>
      </>
    );
  };
  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={analyzePDF}
        disabled={isAnalyzing}
        className={`flex items-center justify-center gap-2 p-2.5 border rounded-lg transition-all duration-200 w-full font-medium text-sm
          ${
            isAnalyzing
              ? "bg-[var(--accent)]/40 border-[var(--accent)] cursor-wait"
              : analysisStatus && analysisStatus.includes("complete")
              ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40"
              : "border-[var(--border)] hover:bg-[var(--accent)] bg-[var(--accent)]/10 hover:scale-[1.01] active:scale-[0.99]"
          }`}
      >
        {renderButtonContent()}
      </button>
      {analysisStatus && !isAnalyzing && (
        <div className="text-xs text-[var(--muted-foreground)] mt-1 font-medium px-1.5">
          {analysisStatus}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-500 mt-1 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-800">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default PDFAnalyzer;
