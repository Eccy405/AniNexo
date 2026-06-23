import React from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", hover = true }) => {
  const hoverClass = hover ? styles.hover : "";
  return (
    <div className={`${styles.card} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
