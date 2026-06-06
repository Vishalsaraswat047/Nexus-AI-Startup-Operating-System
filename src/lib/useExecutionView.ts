import { useCallback, useEffect, useState } from 'react';
import {
  fetchExecutionApi,
  tickExecutionApi,
  type ExecutionView,
} from './executionApi';

export function useExecutionView(companyId: string | null): {
  view: ExecutionView | null;
  loading: boolean;
  refresh: () => Promise<void>;
  tick: () => Promise<void>;
} {
  const [view, setView] = useState<ExecutionView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setView(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchExecutionApi(companyId);
      setView(data);
    } catch {
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const tick = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await tickExecutionApi(companyId);
      if (data) setView(data);
    } catch {
      /* ignore */
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
    if (!companyId) return;
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [refresh, companyId]);

  return { view, loading, refresh, tick };
}
