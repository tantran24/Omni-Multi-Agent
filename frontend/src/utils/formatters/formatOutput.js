/**
 * Formats text output from the LLM for better display.
 *
 * @param {string} text - The text to format
 * @returns {string} Formatted text
 */
export const formatModelOutput = (text) => {
  if (!text) return text;

  let formatted = text;

  // Remove excessive line breaks (more than 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // Fix common markdown formatting issues
  formatted = formatted
    // Fix spacing after list markers for proper markdown rendering
    .replace(/^(\s*[-*+])\s*(?=\S)/gm, "$1 ")
    // Fix numbered lists that might have no space after number
    .replace(/^(\s*\d+\.)\s*(?=\S)/gm, "$1 ")
    // Ensure proper code block formatting
    .replace(/```([a-zA-Z0-9]*)\n/g, "```$1\n")
    // Fix extra whitespace in tables
    .replace(/\|\s+/g, "| ")
    .replace(/\s+\|/g, " |")
    // Remove any potential JSX-like attributes that might cause React errors
    .replace(/<style jsx.*?>/g, "<style>")
    .replace(/\s+jsx=["'].*?["']/g, "")
    // Fix any potential HTML nesting issues for divs in paragraphs
    .replace(/<div([^>]*)>(.*?)<\/div>/g, (match, attributes, content) => {
      // Use span with block display instead of div to avoid nesting issues
      if (content.trim().length > 0) {
        return `<span${attributes} class="block">${content}</span>`;
      }
      return match;
    })
    // Also handle potential nesting issues with other block elements
    .replace(
      /<(figure|section|article|aside|nav|header|footer)([^>]*)>(.*?)<\/\1>/g,
      (match, tag, attributes, content) => {
        // For block elements that might be nested in paragraphs, use span with appropriate class
        if (content.trim().length > 0) {
          return `<span${attributes} class="block ${tag}-container">${content}</span>`;
        }
        return match;
      }
    );

  return formatted;
};

export default formatModelOutput;
