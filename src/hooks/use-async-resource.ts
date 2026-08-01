"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [status, setStatus] = useState<number | undefined>();
  const reqId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    setStatus(undefined);
    try {
      const result = await loader();
      if (id === reqId.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (id === reqId.current) {
        setError(err);
        setStatus(axios.isAxiosError(err) ? err.response?.status : undefined);
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, status, reload, setData };
}
