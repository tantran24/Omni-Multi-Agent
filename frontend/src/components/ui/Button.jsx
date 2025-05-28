import React from "react";
import PropTypes from "prop-types";

/**
 * Modern Button component with various styles and variants
 */
export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = "default",
      size = "default",
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "primary":
          return "bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]/90";
        case "outline":
          return "bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]";
        case "ghost":
          return "bg-transparent hover:bg-[var(--accent)] text-[var(--foreground)]";
        case "destructive":
          return "bg-red-500 text-white hover:bg-red-600";
        default:
          return "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "text-xs px-2.5 py-1.5 rounded-md";
        case "lg":
          return "text-base px-6 py-3 rounded-lg";
        case "icon":
          return "h-9 w-9 p-0 rounded-md";
        default:
          return "text-sm px-4 py-2 rounded-md";
      }
    };

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-medium transition-colors 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] 
          disabled:opacity-50 disabled:pointer-events-none
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

Button.defaultProps = {
  variant: "default",
  size: "default",
  className: "",
  disabled: false,
};

/**
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} [children] - Button content
 * @property {string} [className] - Additional CSS classes
 * @property {"default"|"primary"|"outline"|"ghost"|"destructive"} [variant="default"] - Button variant
 * @property {"default"|"sm"|"lg"|"icon"} [size="default"] - Button size
 * @property {boolean} [disabled=false] - Whether the button is disabled
 * @property {Function} [onClick] - Click handler
 */

/**
 * IconButton component for actions with icons
 */
export const IconButton = React.forwardRef(
  (
    {
      icon,
      className,
      variant = "default",
      size = "default",
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        className={className}
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";

IconButton.defaultProps = {
  variant: "default",
  size: "default",
  className: "",
  disabled: false,
};

/**
 * @typedef {Object} IconButtonProps
 * @property {React.ReactNode} icon - The icon to display
 * @property {string} [className] - Additional CSS classes
 * @property {"default"|"primary"|"outline"|"ghost"|"destructive"} [variant="default"] - Button variant
 * @property {"default"|"sm"|"lg"} [size="default"] - Button size
 * @property {boolean} [disabled=false] - Whether the button is disabled
 * @property {Function} [onClick] - Click handler
 */
