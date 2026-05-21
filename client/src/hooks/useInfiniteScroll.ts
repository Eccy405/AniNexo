import { useEffect, useRef, useState, useCallback } from 'react';

export function useInfiniteScroll<T>(fetchMore: () => Promise<void>, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoadingMore(true);
          fetchMore().finally(() => setLoadingMore(false));
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, fetchMore]
  );

  return { lastElementRef, loadingMore };
}
