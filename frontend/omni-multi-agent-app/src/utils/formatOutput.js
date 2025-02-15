export const formatModelOutput = (text) => {
  if (!text) return "";

  // Preserve line breaks
  let formatted = text.replace(/\n/g, "  \n");

  // Ensure math formulas are properly wrapped
  formatted = formatted.replace(/\$\$(.*?)\$\$/g, "\n$$\n$1\n$$\n");
  formatted = formatted.replace(/\$(.*?)\$/g, "$\n$1\n$");

  return formatted.trim();
};
