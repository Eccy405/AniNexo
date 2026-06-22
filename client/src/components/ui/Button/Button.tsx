import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, disabled, className = '', ...props }, ref) => {
    const variantClass = styles[variant];
    const sizeClass = styles[size];
    const loadingClass = isLoading ? styles.loading : '';
    const disabledClass = disabled ? styles.disabled : '';

    return (
      <button
        ref={ref}
        className={`${styles.button} ${variantClass} ${sizeClass} ${loadingClass} ${disabledClass} ${className}`}
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
