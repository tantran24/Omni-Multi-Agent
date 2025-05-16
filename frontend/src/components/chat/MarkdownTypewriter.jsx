import React, { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { formatModelOutput } from "../../utils/formatters/formatOutput";

/**
 * A modern typewriter effect component that incrementally reveals
 * rendered markdown content with smart chunking and natural timing.
 */
const MarkdownTypewriter = ({
  text,
  onComplete,
  markdownComponents,
  speed = 1,
  initialDelay = 0,
}) => {
  const [visibleLength, setVisibleLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const lastChunkRef = useRef({ type: "text", length: 0 });
  const fullText = useMemo(() => {
    // Remove trailing parenthesis if it's standalone at the end
    const processed = formatModelOutput ? formatModelOutput(text) : text;
    return processed.replace(/\s*\)$/g, "");
  }, [text]);

  // Enhanced content analysis for smart chunking
  const analyzeNextChunk = (currentPos) => {
    const remainingText = fullText.substring(currentPos);
    const patterns = {
      codeBlock: /^```[\s\S]*?```/,
      inlineCode: /^`[^`]+`/,
      link: /^\[([^\]]+)\]\([^)]+\)/,
      image: /^!\[([^\]]+)\]\([^)]+\)/,
      formatting: /^[*#_~-]+/,
      punctuation: /^[.,!?;:]/,
      whitespace: /^[\s\n]+/,
      url: /^https?:\/\/\S+/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = remainingText.match(pattern);
      if (match) {
        return {
          type,
          text: match[0],
          length: match[0].length,
          speed: getTypeSpeed(type),
        };
      }
    } // Process larger chunks of text at once for faster display
    const textChunk = remainingText.slice(
      0,
      Math.min(20, remainingText.length)
    );
    return {
      type: "text",
      text: textChunk,
      length: textChunk.length,
      speed: getTypeSpeed("text"),
    };
  };

  // Get appropriate typing speed for different content types
  const getTypeSpeed = (type) => {
    const speedMap = {
      codeBlock: 0.01, // Nearly instant for code blocks
      inlineCode: 0.01, // Nearly instant for inline code
      link: 0.01, // Nearly instant for links
      image: 0.01, // Nearly instant for image markdown
      formatting: 0.01, // Nearly instant for formatting
      punctuation: 0.01, // Nearly instant for punctuation
      whitespace: 0.01, // Nearly instant for whitespace
      url: 0.01, // Nearly instant for URLs
      text: 0.01, // Nearly instant for normal text
    };
    return speed * (speedMap[type] || 1);
  };

  useEffect(() => {
    if (!shouldAnimate) return;

    let isActive = true; // Track if effect is still active
    let timeoutIds = new Set(); // Track all timeout IDs for cleanup

    // Reset state with each new text update
    setVisibleLength(0);
    setIsComplete(false);
    lastChunkRef.current = { type: "text", length: 0 };

    const initialTimer = setTimeout(() => {
      let currentLength = 0;

      const processNextChunk = () => {
        if (!isActive) return; // Don't process if effect is inactive

        if (currentLength >= fullText.length) {
          setIsComplete(true);
          if (onComplete) onComplete();
          return;
        }

        const chunk = analyzeNextChunk(currentLength);
        const newLength = currentLength + chunk.length;

        // Update text content smoothly
        setVisibleLength(newLength);
        currentLength = newLength;
        lastChunkRef.current = chunk; // Process chunks almost instantly
        const baseDelay = speed;
        const nextDelay = Math.min(chunk.speed * baseDelay, 5); // Cap maximum delay at 5ms

        const timeoutId = setTimeout(processNextChunk, nextDelay);
        timeoutIds.add(timeoutId);
      };

      // Begin the animation chain
      processNextChunk();
    }, initialDelay);
    timeoutIds.add(initialTimer);

    return () => {
      isActive = false;
      // Cleanup all timeouts
      timeoutIds.forEach((id) => clearTimeout(id));
      lastChunkRef.current = { type: "text", length: 0 };
    };
  }, [fullText, speed, initialDelay, onComplete, shouldAnimate]);

  // Stop animation if user interacts with the container (scroll, click)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = () => {
      if (!isComplete) {
        setShouldAnimate(false);
        setVisibleLength(fullText.length);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    };

    container.addEventListener("click", handleInteraction);
    container.addEventListener("wheel", handleInteraction);

    return () => {
      container.removeEventListener("click", handleInteraction);
      container.removeEventListener("wheel", handleInteraction);
    };
  }, [isComplete, fullText, onComplete]);

  // Prepare text content and enhanced components
  const visibleText = fullText.substring(0, visibleLength);

  // Enhanced markdown components with smooth transitions
  const enhancedComponents = useMemo(
    () => ({
      ...markdownComponents,
      code: ({ node, inline, className, children, ...props }) => {
        const Component = markdownComponents?.code || "code";
        return (
          <Component
            {...props}
            className={`${
              className || ""
            } animate-fade-in transition-all duration-300 typing-content`}
          >
            {children}
          </Component>
        );
      },
      pre: ({ node, children, ...props }) => {
        const Component = markdownComponents?.pre || "pre";
        return (
          <Component
            {...props}
            className={`${
              props.className || ""
            } animate-fade-in transition-all duration-300 typing-content`}
          >
            {children}
          </Component>
        );
      },
      p: ({ node, children, ...props }) => {
        return (
          <p {...props} className="typing-content transition-all duration-300">
            {children}
          </p>
        );
      },
    }),
    [markdownComponents]
  );

  // Update cursor position based on rendered content
  useEffect(() => {
    if (!containerRef.current || isComplete) return;

    const updateCursorPosition = () => {
      const container = containerRef.current;
      if (!container) return;

      // Find the last text node or element
      const elements = container.querySelectorAll(".typing-content");
      const lastElement = elements[elements.length - 1];

      if (lastElement) {
        const rect = lastElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Get last text node
        const textNodes = Array.from(lastElement.childNodes).filter(
          (node) => node.nodeType === Node.TEXT_NODE
        );
        const lastTextNode = textNodes[textNodes.length - 1];

        if (lastTextNode) {
          const range = document.createRange();
          range.setStart(lastTextNode, lastTextNode.length);
          range.setEnd(lastTextNode, lastTextNode.length);
          const textRect = range.getBoundingClientRect();

          setCursorPosition({
            x: textRect.right - containerRect.left,
            y: textRect.top - containerRect.top,
          });
        } else {
          setCursorPosition({
            x: rect.right - containerRect.left,
            y: rect.top - containerRect.top,
          });
        }
      }
    };

    // Create observers for layout changes
    const resizeObserver = new ResizeObserver(updateCursorPosition);
    const mutationObserver = new MutationObserver(updateCursorPosition);

    // Observe container for changes
    resizeObserver.observe(containerRef.current);
    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial position update
    updateCursorPosition();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [visibleLength, isComplete]);

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="markdown-message prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight, rehypeKatex]}
          components={enhancedComponents}
          skipHtml={true}
        >
          {visibleText || " "}
        </ReactMarkdown>
      </div>
      {!isComplete && (
        <div
          className="cursor-container"
          style={{
            position: "absolute",
            transform: `translate3d(${cursorPosition.x}px, ${cursorPosition.y}px, 0)`,
            transition: "transform 0.15s ease-out",
            willChange: "transform",
          }}
        >
          <span className="typing-cursor">▌</span>
        </div>
      )}
    </div>
  );
};

const MarkdownTypewriterComponent = MarkdownTypewriter;

MarkdownTypewriterComponent.propTypes = {
  text: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  markdownComponents: PropTypes.object,
  speed: PropTypes.number,
  initialDelay: PropTypes.number,
};

export default MarkdownTypewriterComponent;
