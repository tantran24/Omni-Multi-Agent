import axios from "axios";

const API_URL = "http://localhost:8000/api";

/**
 * Reads the content of a PDF file from the server
 * @param {string} pdfPath - The path to the PDF file on the server
 * @returns {Promise<string>} - The text content of the PDF
 */
export const readPDF = async (pdfPath) => {
  try {
    console.log(`Attempting to read PDF at path: ${pdfPath}`);

    // Ensure the path starts with /uploaded_files if it doesn't already
    const normalizedPath = pdfPath.startsWith("/uploaded_files")
      ? pdfPath
      : pdfPath.startsWith("/")
      ? `/uploaded_files${pdfPath}`
      : `/uploaded_files/${pdfPath}`;

    const response = await axios.get(`${API_URL}/pdf/read-pdf`, {
      params: { pdf_path: normalizedPath },
    });

    if (response.data && response.data.text) {
      console.log(
        `PDF analysis complete: ${response.data.text.substring(0, 100)}...`
      );
      return response.data.text;
    }

    return "No text content could be extracted from this PDF.";
  } catch (error) {
    console.error("Error reading PDF:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to read PDF content"
    );
  }
};

export default readPDF;
