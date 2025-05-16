import React from "react";
import PropTypes from "prop-types";

const EmptyState = ({ onPromptClick }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-16 h-16 rounded-full bg-[var(--foreground)] flex items-center justify-center mb-6">
      <span className="font-semibold text-xl transition-colors duration-200 text-[var(--background)]">
        O
      </span>
    </div>
    <h2 className="text-2xl font-bold mb-2">Omni Multi-Agent</h2>
    <p className="text-[var(--muted-foreground)] max-w-md mb-6">
      An intelligent assistant that can understand text and images, generate
      content, and help with various tasks.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      {[
        "Tell me about artificial intelligence",
        "Write a creative story about space exploration",
        "Describe the difference between machine learning and deep learning",
        "Help me brainstorm ideas for a science project",
      ].map((suggestion, index) => (
        <button
          key={index}
          className="text-left p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors text-sm"
          onClick={() => onPromptClick(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

EmptyState.propTypes = {
  onPromptClick: PropTypes.func,
};

export default EmptyState;
