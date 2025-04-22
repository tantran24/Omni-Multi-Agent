/**
 * Formats text output from the LLM for better display
 * - Handles line breaks
 * - Formats math expressions
 *
 * @param {string} text - The text to format
 * @returns {string} Formatted text
 */
export const formatModelOutput = (text) => {
  if (!text) return "";

  let formatted = text.replace(/\n/g, "  \n");
  formatted = formatted.replace(/\$\$(.*?)\$\$/g, "\n$$\n$1\n$$\n");
  formatted = formatted.replace(/\$(.*?)\$/g, "$\n$1\n$");

  return formatted.trim();
};

export default formatModelOutput;
