import React from "react";
import PropTypes from "prop-types";

/**
 * Avatar component with multiple variants and sizes
 */
export const Avatar = ({
  src,
  name,
  size = "md",
  className = "",
  fallbackColor = "claude-purple",
}) => {
  const [imageError, setImageError] = React.useState(!src);

  const getInitials = (name) => {
    if (!name) return "U";

    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={`
      relative rounded-full flex items-center justify-center overflow-hidden
      ${sizeClasses[size] || sizeClasses.md}
      ${fallbackColor ? `bg-${fallbackColor}` : "bg-claude-purple"}
      ${className}
    `}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name || "User avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium text-white">{getInitials(name)}</span>
      )}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  className: PropTypes.string,
  fallbackColor: PropTypes.string,
};

export default Avatar;
