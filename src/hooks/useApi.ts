import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  initialMockData: T,
  deps: any[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T>(initialMockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setIsLive(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data');
      // Keep current data visible — do NOT replace with mock on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, isLive, refetch: doFetch };
}
