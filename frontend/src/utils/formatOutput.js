export const formatModelOutput = (text) => {
  if (!text) return "";

  let formatted = text.replace(/\n/g, "  \n");
  formatted = formatted.replace(/\$\$(.*?)\$\$/g, "\n$$\n$1\n$$\n");
  formatted = formatted.replace(/\$(.*?)\$/g, "$\n$1\n$");

  return formatted.trim();
};
