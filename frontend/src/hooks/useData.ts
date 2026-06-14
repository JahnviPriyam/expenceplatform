import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { DashboardStats, Anomaly, Expense, ImportBatch, PaginatedResponse } from '../types';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<DashboardStats>('/dashboard/stats/');
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  return { stats, loading, error, refetch: fetchStats };
}

export function useAnomalies(severityFilter?: string, importBatchId?: number) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (severityFilter) params.severity = severityFilter;
      if (importBatchId) params.import_batch = importBatchId;
      const { data } = await api.get<PaginatedResponse<Anomaly>>('/anomalies/', { params });
      setAnomalies(data.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, importBatchId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { anomalies, loading, error, refetch: fetch };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PaginatedResponse<Expense>>('/expenses/')
      .then(r => setExpenses(r.data.results))
      .finally(() => setLoading(false));
  }, []);

  return { expenses, loading };
}

export function useReports() {
  const [reports, setReports] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get<PaginatedResponse<ImportBatch>>('/reports/');
    setReports(data.results);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  return { reports, loading, refetch: fetchReports };
}

export function useAIExplain() {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeAnomalyId, setActiveAnomalyId] = useState<number | null>(null);

  const explain = useCallback(async (anomalyId: number) => {
    setActiveAnomalyId(anomalyId);
    setExplanation('');
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/explain/${anomalyId}/`);
      setExplanation(data.explanation);
    } catch (e: any) {
      setExplanation('AI explanation unavailable. Please check your API key configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { explanation, loading, activeAnomalyId, explain };
}
