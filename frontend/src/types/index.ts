// ── Core Domain Types ────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: string;
  currency: string;
  currency_inferred: boolean;
  date: string;
  category: string;
  payer: string;
  participants: Participant[];
  split_type: 'equal' | 'percentage' | 'exact';
  notes: string;
  is_settlement: boolean;
  anomaly_count: number;
  anomalies: Anomaly[];
  import_batch: number;
  created_at: string;
}

export interface Anomaly {
  id: number;
  expense: number;
  expense_description: string;
  expense_amount: string;
  expense_currency: string;
  expense_date: string;
  anomaly_type: AnomalyType;
  severity: Severity;
  description: string;
  ai_explanation: string;
  resolved: boolean;
  import_batch: number;
  created_at: string;
}

export type AnomalyType =
  | 'DUPLICATE_EXPENSE'
  | 'MISSING_CURRENCY'
  | 'MISSING_PAYER'
  | 'INVALID_SPLIT'
  | 'UNUSUAL_AMOUNT'
  | 'FUTURE_DATE'
  | 'AMBIGUOUS_DATE'
  | 'SINGLE_PARTICIPANT'
  | 'SETTLEMENT_MIXED';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Participant {
  name: string;
  share_amount: number | null;
  share_pct: number | null;
}

export interface ImportBatch {
  id: number;
  filename: string;
  total_records: number;
  records_imported: number;
  warnings: number;
  critical_issues: number;
  integrity_score: number;
  grade: string;
  actions_taken: string[];
  anomaly_breakdown: Record<Severity, number>;
  created_at: string;
}

export interface DashboardStats {
  total_expenses: number;
  total_amount: string;
  total_anomalies: number;
  critical_anomalies: number;
  high_anomalies: number;
  medium_anomalies: number;
  low_anomalies: number;
  integrity_score: number;
  grade: string;
  currency_distribution: Record<string, number>;
  top_categories: { category: string; total: string; count: number }[];
  latest_import: ImportBatch | null;
}

// ── Core State for the Quantum Core ─────────────────────────────────────────

export type CoreState = 'pristine' | 'stable' | 'warning' | 'critical';

export interface CoreMetrics {
  state: CoreState;
  integrity_score: number;
  grade: string;
  anomalies_found: number;
  data_integrity: number;
  confidence_score: number;
}

// ── API Pagination ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
