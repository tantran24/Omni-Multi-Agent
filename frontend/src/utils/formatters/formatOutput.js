/**
 *
 * @param {string} text - The text to format
 * @returns {string} Formatted text
 */
export const formatModelOutput = (text) => {
  if (!text) return "";

  // First handle math expressions
  let formatted = text;
  formatted = formatted.replace(/\$\$(.*?)\$\$/g, "\n$$\n$1\n$$\n");
  formatted = formatted.replace(/\$(.*?)\$/g, "$\n$1\n$");

  // Ensure proper line breaks for paragraphs without disrupting lists
  // Only add double spaces at the end of lines that aren't part of lists
  formatted = formatted.replace(/([^\*\-\d])\n/g, "$1  \n");

  // Ensure lists have proper spacing
  formatted = formatted.replace(/^(\s*[\*\-]\s)/gm, "$1");

  // Ensure numbered lists work properly
  formatted = formatted.replace(/^(\s*\d+\.\s)/gm, "$1");

  // Remove excess line breaks around paragraphs and lists
  formatted = formatted.replace(/\n\n\n+/g, "\n\n"); // Normalize multiple line breaks to just two
  formatted = formatted.replace(/^\n+/, ""); // Remove leading line breaks
  formatted = formatted.replace(/\n+$/, ""); // Remove trailing line breaks

  // Fix excess spacing around lists
  formatted = formatted.replace(/\n\n([\*\-]\s)/g, "\n$1"); // Remove extra line before bullet lists
  formatted = formatted.replace(/\n\n(\d+\.\s)/g, "\n$1"); // Remove extra line before numbered lists
  formatted = formatted.replace(/([\*\-]\s.*)\n\n(?![\*\-])/g, "$1\n"); // Remove extra line after bullet lists
  formatted = formatted.replace(/(\d+\.\s.*)\n\n(?!\d+\.)/g, "$1\n"); // Remove extra line after numbered lists

  return formatted.trim();
};

export default formatModelOutput;
