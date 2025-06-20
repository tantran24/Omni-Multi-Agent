import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Copy, Check, MessageSquare, User, Volume2 } from "lucide-react";
import { formatModelOutput } from "../../utils/formatters/formatOutput";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import PDFAnalyzer from "../ui/PDFAnalyzer";
import { isImageUrl, isPdfUrl } from "../../utils/imageUtils";
// Import the external CSS file for markdown styling
import "./MarkdownStyles.css";
import MarkdownTypewriter from "./MarkdownTypewriter";

// The MessageBubble component for the chat interface

const MessageBubble = ({
  message,
  darkMode,
  showTimestamp,
  onImageClick,
  onSpeakClick,
  onPdfAnalysis,
}) => {
  const { text, isUser, image, isError, timestamp, fileType, fileName } =
    message;
  const [copied, setCopied] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(isUser);
  const [imageStatus, setImageStatus] = useState(image ? "loading" : "none");
  const imageRef = useRef(null);

  // Track image loading with fade-in effect
  useEffect(() => {
    if (image && imageStatus === "loading" && imageRef.current) {
      const img = imageRef.current;
      img.style.opacity = "0";
      img.onload = () => {
        setImageStatus("loaded");
        setTimeout(() => {
          img.style.opacity = "1";
        }, 50);
      };
      img.onerror = () => {
        setImageStatus("error");
        img.onerror = null;
        img.src = "/images/fallback-image.png";
      };
    }
  }, [image, imageStatus]);

  // Clean up markdown content to avoid double image rendering
  const cleanMarkdown = (content) => {
    if (!content) return "";

    let cleaned = content;

    if (image) {
      // Remove any markdown image syntax that matches our image URL
      const escapedImageUrl = image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      cleaned = cleaned.replace(
        new RegExp(`!\\[.*?\\]\\(${escapedImageUrl}\\)( *\\))?`, "g"),
        ""
      );

      // Also remove any plain URL references to the image
      cleaned = cleaned.replace(new RegExp(`${escapedImageUrl}`, "g"), "");
    }

    // Trim trailing whitespace at the end of the content
    cleaned = cleaned.trim();

    return cleaned;
  };

  const formattedTimestamp = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakText = () => {
    if (onSpeakClick) {
      onSpeakClick();
    } else if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImageClick = (imageUrl) => {
    if (onImageClick) {
      onImageClick(imageUrl);
    }
  };

  const markdownComponents = {
    img: ({ node, src, alt, ...props }) => {
      // Skip rendering if this is our direct image attachment
      if (image && (src === image || src.includes(image))) {
        return null;
      }

      const isPdf = isPdfUrl(src);
      if (isPdf) {
        // Return a div for PDF - this is not inside a paragraph, so it's fine
        return (
          <div className="mt-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-md hover:bg-[var(--accent)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M9 15v-2h6v2"></path>
                <path d="M12 13v5"></path>
              </svg>
              <span>{alt || "View PDF Document"}</span>
            </a>
          </div>
        );
      } // For images, use React fragment instead of div to avoid invalid nesting in <p> tags
      return (
        <>
          <img
            src={src}
            alt={alt || "Generated content"}
            className="chat-image rounded-lg max-w-full mt-2 cursor-pointer hover:opacity-95 transition-all duration-300 hover:scale-[1.01] shadow-md"
            onClick={() => handleImageClick(src)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/fallback-image.png";
            }}
            {...props}
          />
          {alt && (
            <span className="block text-xs text-center text-[var(--muted-foreground)] mt-1">
              {alt}
            </span>
          )}
        </>
      );
    },
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-6 mb-3 mt-2" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal pl-6 mb-3 mt-2" {...props} />
    ),
    li: ({ node, ...props }) => <li className="my-1" {...props} />,
    p: ({ node, ...props }) => (
      <p className="mb-3 leading-relaxed" {...props} />
    ),
    h1: ({ node, ...props }) => (
      <h1 className="text-xl font-bold mt-5 mb-3" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-lg font-bold mt-4 mb-2" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-md font-bold mt-4 mb-2" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const codeRef = useRef(null);

      const handleCopyCode = () => {
        if (codeRef.current) {
          const code = codeRef.current.textContent;
          navigator.clipboard.writeText(code);

          // Show visual feedback
          const button = codeRef.current.parentNode.querySelector("button");
          if (button) {
            const originalHTML = button.innerHTML;
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              button.innerHTML = originalHTML;
            }, 2000);
          }
        }
      };

      return !inline ? (
        <div className="relative group">
          {language && (
            <div className="absolute top-0 right-0 text-xs font-medium bg-gray-700 text-gray-200 px-2 py-1 rounded-bl-md rounded-tr-md z-10">
              {language}
            </div>
          )}
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md my-3 overflow-auto font-mono text-sm shadow-md">
            <code ref={codeRef} {...props}>
              {children}
            </code>
          </pre>
          <button
            onClick={handleCopyCode}
            className="absolute top-2 right-14 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            aria-label="Copy code"
            title="Copy code"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1-2 2v1"></path>
            </svg>
          </button>
        </div>
      ) : (
        <code
          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-3 text-gray-700 dark:text-gray-300 italic"
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-3">
        <table
          className="min-w-full border border-gray-300 dark:border-gray-700"
          {...props}
        />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className="border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-100 dark:bg-gray-800"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        className="border border-gray-300 dark:border-gray-700 px-3 py-2"
        {...props}
      />
    ),
  };
  return (
    <div
      className={`flex flex-col w-full ${isUser ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-2 mb-1 px-2">
        <div
          className={`flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]`}
        >
          {isUser ? (
            <>
              <User size={12} className="text-blue-500" />
              <span className="font-medium">You</span>
            </>
          ) : (
            <>
              <MessageSquare size={12} className="text-[var(--foreground)]" />
              <span className="font-medium">Omni AI</span>
            </>
          )}
          {showTimestamp && formattedTimestamp && (
            <span className="opacity-70 ml-1">{formattedTimestamp}</span>
          )}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)" }}
        className={`
          relative group max-w-[80%] md:max-w-[65%] w-fit
          rounded-xl shadow-message transition-all duration-300
          ${
            isUser
              ? "bg-white dark:bg-[var(--muted)] text-[var(--foreground)] dark:text-[var(--foreground)] rounded-br-sm border border-[var(--border)]"
              : isError
              ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              : "bg-[var(--bot-message)] text-[var(--foreground)] rounded-bl-sm border border-[var(--border)]"
          }
        `}
      >
        {" "}
        <div className="p-3.5 overflow-hidden break-words text-sm">
          {isUser || typewriterComplete ? (
            <div className="markdown-message prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={markdownComponents}
                skipHtml={true}
              >
                {formatModelOutput
                  ? formatModelOutput(cleanMarkdown(text))
                  : cleanMarkdown(text)}
              </ReactMarkdown>
            </div>
          ) : (
            <MarkdownTypewriter
              text={cleanMarkdown(text)}
              onComplete={() => setTypewriterComplete(true)}
              markdownComponents={markdownComponents}
              speed={20}
            />
          )}{" "}
          {fileType === "pdf" && fileName && (
            <div className="mt-3 flex justify-center w-full">
              <div className="flex items-center gap-2 p-2.5 border border-[var(--border)] rounded-lg bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M9 15v-2h6v2"></path>
                  <path d="M12 13v5"></path>
                </svg>
                <span className="font-medium">
                  {fileName || "PDF Document"}
                </span>
              </div>
            </div>
          )}
          {image && !text.includes(image) && (
            <div className="mt-2">
              {" "}
              {isPdfUrl(image) ? (
                <div className="flex flex-col gap-2 w-full">
                  <a
                    href={image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] w-full justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M9 15v-2h6v2"></path>
                      <path d="M12 13v5"></path>
                    </svg>
                    <span className="font-medium">View PDF Document</span>
                  </a>
                  <PDFAnalyzer
                    pdfUrl={image}
                    onAnalysisComplete={(pdfContent) => {
                      if (onPdfAnalysis) {
                        onPdfAnalysis(pdfContent);
                      } else if (onSpeakClick) {
                        onSpeakClick(
                          `I've analyzed this PDF document. Here's what I found:\n\n${pdfContent}`
                        );
                      }
                    }}
                  />{" "}
                </div>
              ) : (
                isImageUrl(image) && (
                  // Changed from div to figure element which is semantically correct for images
                  // This also ensures proper HTML structure when used in paragraph tags
                  <figure className="relative rounded-lg overflow-hidden shadow-md m-0 p-0">
                    <img
                      ref={imageRef}
                      key={`img-${image}`}
                      src={image}
                      alt="Generated content"
                      className="chat-image rounded-lg max-w-full cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                      style={{ transition: "opacity 0.3s ease-in-out" }}
                      onClick={() => handleImageClick(image)}
                      loading="lazy"
                    />
                    {imageStatus === "loading" && (
                      <div
                        aria-live="polite"
                        className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/10 backdrop-blur-[2px] rounded-lg"
                      >
                        <div
                          className="animate-spin h-8 w-8 border-3 border-current border-t-transparent rounded-full text-[var(--foreground)]"
                          role="status"
                        ></div>
                        <span className="sr-only">Loading image...</span>
                      </div>
                    )}
                  </figure>
                )
              )}
            </div>
          )}
        </div>{" "}
        {!isUser && typewriterComplete && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity message-actions flex gap-1 bg-[var(--background)]/95 backdrop-blur-sm p-1 rounded-md shadow-sm border border-[var(--border)]">
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-md hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors relative group/tooltip"
              aria-label="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="absolute -bottom-8 right-0 bg-black/80 text-white text-xs rounded px-2 py-1 opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {copied ? "Copied!" : "Copy text"}
              </span>
            </button>
            <button
              onClick={speakText}
              className="p-1.5 rounded-md hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors relative group/tooltip"
              aria-label="Speak message"
            >
              <Volume2 size={14} />
              <span className="absolute -bottom-8 right-0 bg-black/80 text-white text-xs rounded px-2 py-1 opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Speak text
              </span>
            </button>{" "}
          </div>
        )}
      </motion.div>
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string.isRequired,
    isUser: PropTypes.bool.isRequired,
    image: PropTypes.string,
    isError: PropTypes.bool,
    timestamp: PropTypes.string,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
  }).isRequired,
  darkMode: PropTypes.bool,
  showTimestamp: PropTypes.bool,
  onImageClick: PropTypes.func,
  onSpeakClick: PropTypes.func,
  onPdfAnalysis: PropTypes.func,
};

export default MessageBubble;
