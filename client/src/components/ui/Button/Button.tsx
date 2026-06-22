import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, children, disabled, className = '', ...props }, ref) => {
    const variantClass = styles[variant];
    const sizeClass = styles[size];
    const loadingClass = isLoading ? styles.loading : '';
    const disabledClass = disabled ? styles.disabled : '';
    const fullWidthClass = fullWidth ? styles.fullWidth : '';

    return (
      <button
        ref={ref}
        className={`${styles.button} ${variantClass} ${sizeClass} ${loadingClass} ${disabledClass} ${fullWidthClass} ${className}`.trim()}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
