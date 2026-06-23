import React from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  href?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "",
  href,
  ...props 
}) => {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.md;
  
  const combinedClass = `${styles.button} ${variantClass} ${sizeClass} ${className}`;
  
  if (href) {
    return (
      <a href={href} className={combinedClass}>
        {children}
      </a>
    );
  }
  
  return (
    <button className={combinedClass} {...props}>
      {children}
    </button>
  );
};
