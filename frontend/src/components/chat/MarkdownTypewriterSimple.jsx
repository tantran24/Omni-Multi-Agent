import React, { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { formatModelOutput } from "../../utils/formatters/formatOutput";

/**
 * A simple and reliable typewriter effect that reveals markdown content
 * using CSS masks instead of character-by-character parsing
 */
const MarkdownTypewriter = ({
  text,
  onComplete,
  markdownComponents,
  speed = 1,
  initialDelay = 0,
}) => {
  const [currentText, setCurrentText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const containerRef = useRef(null);

  const fullText = useMemo(() => {
    const processed = formatModelOutput ? formatModelOutput(text) : text;
    return processed.replace(/\s*\)$/g, "");
  }, [text]);

  // Simple character-by-character reveal
  useEffect(() => {
    if (!shouldAnimate) return;

    let isActive = true;
    setCurrentText("");
    setIsComplete(false);

    const startAnimation = () => {
      let currentIndex = 0;
      const totalLength = fullText.length;

      const revealNext = () => {
        if (!isActive) return;

        if (currentIndex >= totalLength) {
          setIsComplete(true);
          if (onComplete) onComplete();
          return;
        }

        // Reveal more characters at once for faster typing
        const chunkSize = Math.max(1, Math.floor(totalLength / 100));
        const nextIndex = Math.min(currentIndex + chunkSize, totalLength);
        setCurrentText(fullText.substring(0, nextIndex));
        currentIndex = nextIndex;

        const delay = speed * 20; // Adjust timing
        setTimeout(revealNext, delay);
      };

      setTimeout(revealNext, initialDelay);
    };

    startAnimation();

    return () => {
      isActive = false;
    };
  }, [fullText, speed, initialDelay, onComplete, shouldAnimate]);

  // Stop animation on user interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = () => {
      if (!isComplete) {
        setShouldAnimate(false);
        setCurrentText(fullText);
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

  // Enhanced markdown components
  const enhancedComponents = useMemo(
    () => ({
      ...markdownComponents,
      code: ({ node, inline, className, children, ...props }) => {
        const Component = markdownComponents?.code || "code";
        return (
          <Component
            {...props}
            className={`${className || ""} transition-opacity duration-300`}
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
            } transition-opacity duration-300`}
          >
            {children}
          </Component>
        );
      },
      p: ({ node, children, ...props }) => {
        return (
          <p {...props} className="transition-opacity duration-300">
            {children}
          </p>
        );
      },
    }),
    [markdownComponents]
  );

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="markdown-message prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight, rehypeKatex]}
          components={enhancedComponents}
          skipHtml={true}
        >
          {currentText || " "}
        </ReactMarkdown>
      </div>
      {!isComplete && (
        <span className="typing-cursor inline-block ml-1 animate-pulse">▌</span>
      )}
    </div>
  );
};

MarkdownTypewriter.propTypes = {
  text: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  markdownComponents: PropTypes.object,
  speed: PropTypes.number,
  initialDelay: PropTypes.number,
};

export default MarkdownTypewriter;
