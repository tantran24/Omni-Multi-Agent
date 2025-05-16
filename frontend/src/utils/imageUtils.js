/**
 * Utility functions for handling images in the chat interface
 */

/**
 * Normalizes an image URL to ensure it has the correct format
 * @param {string} imageUrl - The original image URL or path
 * @param {string} serverUrl - The base server URL (default: http://localhost:8000)
 * @returns {string} - The normalized image URL
 */
export const normalizeImageUrl = (
  imageUrl,
  serverUrl = "http://localhost:8000"
) => {
  if (!imageUrl) return null;

  // If it's already a full URL, return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Handle relative paths
  if (imageUrl.startsWith("/")) {
    return `${serverUrl}${imageUrl}`;
  } else {
    return `${serverUrl}/${imageUrl}`;
  }
};

/**
 * Determines if the provided URL is an image
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL appears to be an image
 */
export const isImageUrl = (url) => {
  if (!url) return false;

  const imageExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
  ];
  const lowercasedUrl = url.toLowerCase();

  return imageExtensions.some((ext) => lowercasedUrl.endsWith(ext));
};

/**
 * Determines if the provided URL is a PDF
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL appears to be a PDF
 */
export const isPdfUrl = (url) => {
  if (!url) return false;

  return (
    url.toLowerCase().endsWith(".pdf") ||
    url.toLowerCase().includes("application/pdf")
  );
};

/**
 * Preloads an image to check if it exists and can be loaded
 * @param {string} imageUrl - The image URL to preload
 * @returns {Promise<boolean>} - Resolves to true if the image loaded successfully
 */
export const preloadImage = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};
