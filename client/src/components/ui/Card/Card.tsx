import React, { ReactNode, forwardRef } from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  role?: string;
  ariaLabel?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', role = 'region', ariaLabel, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${styles.card} ${className}`}
        role={role}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`${styles.cardHeader} ${className}`}>{children}</div>;
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`${styles.cardBody} ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`${styles.cardFooter} ${className}`}>{children}</div>;
};
