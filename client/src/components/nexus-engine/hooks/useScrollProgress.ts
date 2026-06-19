import { useEffect, useRef } from 'react';

/**
 * useScrollProgress
 * ─────────────────────────────────────────────────────────────────────
 * Listens to window scroll (passive) and computes a [0..1] progress
 * value representing how far the user has scrolled through the Nexus
 * section element.
 *
 * Returns a ref (not state) to avoid triggering React re-renders on
 * every scroll event — the R3F frame loop reads it directly.
 */
export function useScrollProgress(
  sectionRef: React.RefObject<HTMLDivElement | null>
) {
  const progress = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect   = el.getBoundingClientRect();
      const total  = el.offsetHeight + window.innerHeight;
      // How many pixels of the section have been "consumed" by scrolling
      const scrolled = window.innerHeight - rect.top;
      progress.current = Math.max(0, Math.min(1, scrolled / total));
    };

    // Compute initial value
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRef]);

  return progress; // MutableRefObject<number>
}
