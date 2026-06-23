'use client';

import { ElementType, ReactNode, useEffect, useRef, useState } from 'react';

interface RevealOnScrollProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  threshold?: number;
  id?: string;
  'aria-label'?: string;
}

export default function RevealOnScroll({
  as = 'div',
  children,
  className = '',
  delay = 0,
  distance = 18,
  threshold = 0.12,
  id,
  'aria-label': ariaLabel,
}: RevealOnScrollProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const Component = as as any;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Component
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={`aninexo-reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{
        '--reveal-delay': `${delay}ms`,
        '--reveal-distance': `${distance}px`,
      }}
    >
      {children}
    </Component>
  );
}
