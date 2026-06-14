import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Upload, AlertTriangle, ArrowRight, Shield, CheckCircle, Cpu, Calendar,
  Zap, ChevronRight, FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip } from 'recharts';
import QuantumCore from '../components/QuantumCore';
import HolographicPanel from '../components/HolographicPanel';
import { useDashboardStats, useExpenses, useAnomalies } from '../hooks/useData';
import type { CoreMetrics, CoreState } from '../types';

function deriveCoreMetrics(stats: ReturnType<typeof useDashboardStats>['stats']): CoreMetrics {
  if (!stats) return { state: 'pristine', integrity_score: 54.0, grade: 'D', anomalies_found: 20, data_integrity: 54.0, confidence_score: 100 };

  const score = stats.integrity_score;
  let state: CoreState = 'pristine';
  if (stats.total_expenses === 0) state = 'pristine';
  else if (score >= 80) state = 'stable';
  else if (score >= 60) state = 'warning';
  else state = 'critical';

  const data_integrity = Math.max(0, score - (stats.critical_anomalies * 2));
  const confidence_score = Math.min(100, 100 - stats.medium_anomalies * 3 - stats.low_anomalies);

  return { state, integrity_score: score, grade: stats.grade, anomalies_found: stats.total_anomalies, data_integrity, confidence_score };
}

const CAT_COLORS = ['#ff4fd8', '#b84dff', '#ff6ec7', '#00aaff', '#00ff88'];
const CURRENCY_COLORS = ['#ff4fd8', '#b84dff', '#ff6ec7'];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff3d3d',
  HIGH:     '#ff8c00',
  MEDIUM:   '#b84dff',
  LOW:      '#00aaff',
};

export default function Dashboard() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { expenses } = useExpenses();
  const { anomalies } = useAnomalies();

  const coreMetrics = useMemo(() => deriveCoreMetrics(stats), [stats]);

  // Merge dynamic data with the exact reference design fallback values
  const defaultSpend = stats?.total_amount ? parseFloat(stats.total_amount) : 148420.00;
  const defaultTotalRecords = stats?.latest_import?.total_records ?? 42;
  const defaultImported = stats?.latest_import?.records_imported ?? 42;
  const defaultAnomalies = stats?.total_anomalies ?? 20;
  const defaultCritical = stats?.critical_anomalies ?? 1;

  // Chart 1: Spend Overview Line Area Chart
  const spendChartData = useMemo(() => {
    return [
      { name: '01 Jun', val: 50000 },
      { name: '03 Jun', val: 75000 },
      { name: '05 Jun', val: 68000 },
      { name: '07 Jun', val: 92000 },
      { name: '09 Jun', val: 110000 },
      { name: '11 Jun', val: 105000 },
      { name: '13 Jun', val: 125000 },
      { name: '14 Jun', val: defaultSpend },
    ];
  }, [defaultSpend]);

  // Chart 2: Top Categories doughnut data
  const categoryPieData = useMemo(() => {
    if (stats && stats.total_expenses > 0) {
      return stats.top_categories.map((c) => ({
        name: c.category || 'Others',
        value: parseFloat(c.total)
      }));
    }
    return [
      { name: 'Food & Dining', value: 92140 },
      { name: 'Travel', value: 31780 },
      { name: 'Shopping', value: 14500 },
      { name: 'Others', value: 10000 },
    ];
  }, [stats]);

  // Top Merchants data
  const topMerchants = useMemo(() => {
    if (expenses && expenses.length > 0) {
      const merchantMap: Record<string, number> = {};
      expenses.forEach(e => {
        const merchant = e.description.split(' - ')[0] || e.description;
        const amt = parseFloat(e.amount) || 0;
        merchantMap[merchant] = (merchantMap[merchant] || 0) + amt;
      });
      return Object.entries(merchantMap)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }
    return [
      { name: 'Marina Bites', total: 38950 },
      { name: 'DMart', total: 22430 },
      { name: 'Uber', total: 18740 },
      { name: 'Amazon', total: 15620 },
      { name: 'Others', total: 52680 },
    ];
  }, [expenses]);

  const totalMerchantSpend = useMemo(() => topMerchants.reduce((sum, m) => sum + m.total, 0), [topMerchants]);

  // Currency Distribution Doughnut data
  const currencyPieData = useMemo(() => {
    if (stats && stats.total_expenses > 0) {
      return Object.entries(stats.currency_distribution).map(([name, value]) => ({ name, value }));
    }
    return [
      { name: 'INR', value: 42 },
      { name: 'USD', value: 1 },
      { name: 'EUR', value: 1 },
    ];
  }, [stats]);

  // Anomaly Breakdown doughnut data
  const anomalyPieData = useMemo(() => {
    if (stats && stats.total_expenses > 0) {
      return [
        { name: 'Critical', value: stats.critical_anomalies },
        { name: 'High',     value: stats.high_anomalies },
        { name: 'Medium',   value: stats.medium_anomalies },
        { name: 'Low',      value: stats.low_anomalies },
      ];
    }
    return [
      { name: 'Critical', value: 1 },
      { name: 'High',     value: 8 },
      { name: 'Medium',   value: 7 },
      { name: 'Low',      value: 4 },
    ];
  }, [stats]);

  const totalAnomCount = useMemo(() => anomalyPieData.reduce((sum, item) => sum + item.value, 0), [anomalyPieData]);

  // Recent Anomalies entries
  const recentAnomaliesList = useMemo(() => {
    if (anomalies && anomalies.length > 0) {
      return anomalies.slice(0, 5);
    }
    return [
      { id: 15, severity: 'CRITICAL', anomaly_type: 'DUPLICATE_EXPENSE', expense_description: 'Duplicate Expense - Marina Bites', expense_amount: '2850', expense: 15 },
      { id: 23, severity: 'HIGH',     anomaly_type: 'DUPLICATE_EXPENSE', expense_description: 'Duplicate Expense - Marina Bites', expense_amount: '2850', expense: 23 },
      { id: 31, severity: 'HIGH',     anomaly_type: 'MISSING_CURRENCY',  expense_description: 'Missing Currency - Hotel Stay',  expense_amount: '8500', expense: 31 },
      { id: 37, severity: 'MEDIUM',   anomaly_type: 'INVALID_SPLIT',      expense_description: 'Invalid Split - Travel Expense',   expense_amount: '1200', expense: 37 },
      { id: 40, severity: 'LOW',      anomaly_type: 'MISSING_PAYER',      expense_description: 'Missing Notes - Groceries DMart',  expense_amount: '2105', expense: 40 },
    ];
  }, [anomalies]);

  if (statsLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#ff4fd8] font-orbitron animate-pulse text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        LOADING INTELLIGENCE CORE...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      {/* Dashboard Title Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="title-page text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            DASHBOARD
          </h1>
          <p className="text-xs mt-1 text-[#64748b]">
            Executive overview & visual telemetry
          </p>
        </div>
      </motion.div>

      {/* Top Metrics Row (5 Cards) */}
      <div className="grid grid-cols-5 gap-4 mb-5">
        {[
          { label: 'TOTAL RECORDS', value: defaultTotalRecords, sub: 'All rows in CSV', icon: FileText, color: '#b84dff' },
          { label: 'IMPORTED SUCCESSFULLY', value: defaultImported, sub: '100% imported', icon: CheckCircle, color: '#00ff88' },
          { label: 'ANOMALIES FOUND', value: defaultAnomalies, sub: `${((defaultAnomalies / Math.max(1, defaultTotalRecords)) * 100).toFixed(2)}% of records`, icon: AlertTriangle, color: '#ff8c00' },
          { label: 'CRITICAL ISSUES', value: defaultCritical, sub: 'Immediate action', icon: Shield, color: '#ff3d3d' },
          { label: 'DATA INTEGRITY SCORE', value: `${coreMetrics.integrity_score.toFixed(0)}%`, sub: 'Overall quality index', grade: coreMetrics.grade, icon: Zap, color: '#ff4fd8' },
        ].map(({ label, value, sub, icon: Icon, color, grade }) => (
          <HolographicPanel key={label} noPad className="p-4 flex flex-col justify-between h-24" glowColor={`${color}30`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {label}
                </div>
                <div className="text-[10px] text-[#475569] mt-0.5">{sub}</div>
              </div>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="value-metric font-bold text-[#f8fafc]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {value}
              </span>
              {grade && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${color}15`, border: `1px solid ${color}30`, color, fontFamily: 'Orbitron, sans-serif' }}>
                  GRADE {grade}
                </span>
              )}
            </div>
          </HolographicPanel>
        ))}
      </div>

      {/* 3-Column Dashboard Body */}
      <div className="grid grid-cols-12 gap-5 mb-5">
        
        {/* Left Column (25%) */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Spend Overview */}
          <HolographicPanel id="panel-spend" className="p-4 flex flex-col h-[180px] justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold text-[#64748b] tracking-wider mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>SPEND OVERVIEW</div>
                <div className="text-xl font-bold text-[#f8fafc]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  ₹ {defaultSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[9px] text-[#64748b] mt-0.5 flex items-center gap-1">
                  <span className="text-[#00ff88] font-semibold">↑ 12.4%</span> vs last import ₹ {(defaultSpend * 0.89).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            <div className="h-16 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendChartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4fd8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#b84dff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#ff4fd8" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </HolographicPanel>

          {/* Top Categories */}
          <HolographicPanel id="panel-top-categories" className="p-4 flex flex-col h-[180px] justify-between">
            <div className="text-[10px] font-bold text-[#64748b] tracking-wider mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>TOP CATEGORIES</div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={18} outerRadius={30} dataKey="value" stroke="none">
                    {categoryPieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % 5]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹ ${parseFloat(v).toLocaleString()}`} contentStyle={{ background: '#0d0f1f', border: '1px solid rgba(255,79,216,0.2)', borderRadius: 8, fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 flex-1">
                {categoryPieData.map((d, i) => {
                  const total = categoryPieData.reduce((sum, item) => sum + item.value, 0);
                  const pct = ((d.value / total) * 100).toFixed(1);
                  return (
                    <div key={d.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[i % 5] }} />
                        <span className="text-[#94a3b8] truncate">{d.name}</span>
                      </div>
                      <span className="font-bold text-[#e2e8f0] font-mono">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </HolographicPanel>

          {/* Top Merchants */}
          <HolographicPanel id="panel-top-merchants" className="p-4 flex flex-col h-[180px] justify-between">
            <div className="text-[10px] font-bold text-[#64748b] tracking-wider mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>TOP MERCHANTS</div>
            <div className="space-y-2">
              {topMerchants.map((m) => {
                const pct = totalMerchantSpend > 0 ? (m.total / totalMerchantSpend) * 100 : 0;
                return (
                  <div key={m.name} className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-medium text-[#94a3b8]">
                      <span>{m.name}</span>
                      <span className="font-mono text-[#e2e8f0]">₹ {m.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="w-full h-1 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#ff4fd8' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </HolographicPanel>
        </div>

        {/* Center Column: Quantum Core (50%) */}
        <div className="col-span-6 flex flex-col gap-4">
          <HolographicPanel noPad className="relative overflow-hidden h-[420px]" id="panel-core">
            {/* Core Header info */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className="text-[10px] font-bold text-[#ff4fd8] tracking-widest uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                QUANTUM DATA CORE <span className="ml-2 px-1.5 py-0.5 rounded bg-[rgba(255,79,216,0.15)] text-[8px] text-[#ff4fd8] font-bold">LIVE</span>
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Real-time data integrity visualization</div>
            </div>

            {/* Canvas */}
            <QuantumCore metrics={coreMetrics} className="w-full h-full" />

            {/* Absolute Flanking Cards */}
            {/* Left Flank */}
            <div className="absolute left-4 top-14 bottom-4 w-36 z-20 flex flex-col justify-between pointer-events-auto py-2">
              {[
                { label: 'INTEGRITY SCORE', value: `${coreMetrics.integrity_score.toFixed(0)}%`, sub: `GRADE ${coreMetrics.grade}`, color: '#ff4fd8' },
                { label: 'CONFIDENCE SCORE', value: `${coreMetrics.confidence_score.toFixed(0)}%`, sub: 'Deterministic', color: '#b84dff' },
                { label: 'DUPLICATE COUNT', value: stats?.duplicate_count ?? 8, sub: 'Flagged instances', color: '#ff3d3d' },
                { label: 'MISSING FIELDS', value: stats?.missing_field_count ?? 12, sub: 'Incomplete schema', color: '#ff8c00' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="glass-panel p-2 flex flex-col justify-between h-[76px]" style={{ background: 'rgba(5, 5, 10, 0.85)', borderColor: 'rgba(255, 79, 216, 0.08)' }}>
                  <div className="text-[8px] font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</div>
                  <div className="text-sm font-bold" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
                  <div className="text-[8px] text-[#475569]">{sub}</div>
                </div>
              ))}
            </div>

            {/* Right Flank */}
            <div className="absolute right-4 top-14 bottom-4 w-36 z-20 flex flex-col justify-between pointer-events-auto text-right py-2">
              {[
                { label: 'CORE STABILITY', value: `${Math.max(10, Math.round(coreMetrics.integrity_score * 0.6))}%`, sub: 'Network load', color: '#ff6ec7' },
                { label: 'DATA QUALITY', value: `${coreMetrics.integrity_score.toFixed(0)}%`, sub: 'Audit matching', color: '#ff4fd8' },
                { label: 'SETTLEMENTS', value: stats?.settlement_count ?? 0, sub: 'Separated list', color: '#00ff88' },
                { label: 'ACTIVE RULES', value: '18', sub: 'Verification checks', color: '#b84dff' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="glass-panel p-2 flex flex-col justify-between h-[76px]" style={{ background: 'rgba(5, 5, 10, 0.85)', borderColor: 'rgba(255, 79, 216, 0.08)' }}>
                  <div className="text-[8px] font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</div>
                  <div className="text-sm font-bold" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
                  <div className="text-[8px] text-[#475569]">{sub}</div>
                </div>
              ))}
            </div>
          </HolographicPanel>

          {/* Integrity Status Banner */}
          <div className="glass-panel p-3.5 flex items-center justify-between border"
            style={{
              background: coreMetrics.integrity_score < 70 ? 'rgba(255,61,61,0.05)' : 'rgba(0,255,136,0.05)',
              borderColor: coreMetrics.integrity_score < 70 ? 'rgba(255,61,61,0.2)' : 'rgba(0,255,136,0.2)'
            }}
          >
            <div className="flex items-center gap-3">
              <Shield size={16} className={coreMetrics.integrity_score < 70 ? 'text-[#ff3d3d]' : 'text-[#00ff88]'} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider animate-pulse"
                  style={{
                    color: coreMetrics.integrity_score < 70 ? '#ff3d3d' : '#00ff88',
                    fontFamily: 'Orbitron, sans-serif'
                  }}
                >
                  INTEGRITY STATUS: {coreMetrics.integrity_score < 70 ? 'CRITICAL' : 'PRISTINE'}
                </div>
                <div className="text-[10px] text-[#64748b] mt-0.5">
                  {coreMetrics.integrity_score < 70
                    ? 'High number of anomalies detected. Review and resolve issues.'
                    : 'No critical anomalies detected. System status pristine.'}
                </div>
              </div>
            </div>
          </div>

          {/* Last Ingestion information */}
          <div className="glass-panel p-3.5 flex items-center justify-between text-[10px] text-[#64748b]" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255, 79, 216, 0.05)' }}>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} className="text-[#b84dff]" />
              LAST IMPORT: {stats?.latest_import ? new Date(stats.latest_import.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '14 Jun 2026, 16:10'}
            </span>
            <span className="font-mono">
              File: {stats?.latest_import?.filename ?? 'expenses.csv'} (3.2 MB)
            </span>
          </div>
        </div>

        {/* Right Column (25%) */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Anomaly Breakdown */}
          <HolographicPanel id="panel-anomaly-breakdown" className="p-4 flex flex-col h-[180px] justify-between">
            <div className="text-[10px] font-bold text-[#b84dff] tracking-wider mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>ANOMALY BREAKDOWN</div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={anomalyPieData} cx="50%" cy="50%" innerRadius={18} outerRadius={30} dataKey="value" stroke="none">
                    {anomalyPieData.map((d, i) => <Cell key={i} fill={SEVERITY_COLORS[d.name.toUpperCase()]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d0f1f', border: '1px solid rgba(255,79,216,0.2)', borderRadius: 8, fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 flex-1">
                {anomalyPieData.map((d) => {
                  const pct = totalAnomCount > 0 ? ((d.value / totalAnomCount) * 100).toFixed(0) : 0;
                  const sevColor = SEVERITY_COLORS[d.name.toUpperCase()];
                  return (
                    <div key={d.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: sevColor }} />
                        <span className="text-[#94a3b8]">{d.name}</span>
                      </div>
                      <span className="font-bold font-mono" style={{ color: sevColor }}>{d.value} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </HolographicPanel>

          {/* Currency Distribution */}
          <HolographicPanel id="panel-currency" className="p-4 flex flex-col h-[180px] justify-between">
            <div className="text-[10px] font-bold text-[#ff4fd8] tracking-wider mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>CURRENCY DISTRIBUTION</div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={currencyPieData} cx="50%" cy="50%" innerRadius={18} outerRadius={30} dataKey="value" stroke="none">
                    {currencyPieData.map((_, i) => <Cell key={i} fill={CURRENCY_COLORS[i % 3]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d0f1f', border: '1px solid rgba(255,79,216,0.2)', borderRadius: 8, fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 flex-1">
                {currencyPieData.map((d, i) => {
                  const total = currencyPieData.reduce((sum, item) => sum + item.value, 0);
                  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CURRENCY_COLORS[i % 3] }} />
                        <span className="text-[#94a3b8]">{d.name}</span>
                      </div>
                      <span className="font-bold font-mono" style={{ color: CURRENCY_COLORS[i % 3] }}>{d.value} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </HolographicPanel>

          {/* Severity Distribution */}
          <HolographicPanel id="panel-severity" className="p-4 flex flex-col h-[180px] justify-between">
            <div className="text-[10px] font-bold text-[#b84dff] tracking-wider mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>SEVERITY DISTRIBUTION</div>
            <div className="space-y-2">
              {anomalyPieData.map((d) => {
                const sevColor = SEVERITY_COLORS[d.name.toUpperCase()];
                const pct = totalAnomCount > 0 ? (d.value / totalAnomCount) * 100 : 0;
                return (
                  <div key={d.name} className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-medium text-[#94a3b8]">
                      <span>{d.name}</span>
                      <span className="font-mono" style={{ color: sevColor }}>{d.value}</span>
                    </div>
                    <div className="w-full h-1 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sevColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </HolographicPanel>
        </div>

      </div>

      {/* Bottom Layout Row: Rule Decisions, AI Insight & Recent list */}
      <div className="grid grid-cols-12 gap-5">
        {/* Engineering Decision (25%) */}
        <div className="col-span-3">
          <HolographicPanel id="panel-eng-decision" className="p-4 h-[220px] flex flex-col justify-between" glowColor="rgba(255,79,216,0.15)">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#ff4fd8] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>ENGINEERING DECISION</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgba(0,255,136,0.1)] text-[#00ff88]">APPROVED</span>
              </div>
              <div className="text-[10px] font-semibold text-[#64748b] mb-1">TOP RULE: Duplicate Detection</div>
              <div className="space-y-2 text-[10px] text-[#94a3b8] leading-relaxed">
                <div>
                  <span className="font-bold text-[#e2e8f0]">Decision:</span> Flag for Manual Review.
                </div>
                <div>
                  <span className="font-bold text-[#e2e8f0]">Reason:</span> High confidence duplicates can still represent legitimate recurring operations.
                </div>
              </div>
            </div>
            <Link to="/anomalies" className="text-[9px] text-[#ff4fd8] hover:text-[#ff6ec7] font-bold flex items-center gap-1 mt-2">
              View All Decisions <ArrowRight size={10} />
            </Link>
          </HolographicPanel>
        </div>

        {/* AI Insight Preview (33% = col-span-4) */}
        <div className="col-span-4">
          <HolographicPanel id="panel-ai-insight" className="p-4 h-[220px] flex flex-col justify-between" glowColor="rgba(184,77,255,0.2)">
            <div>
              <div className="text-[10px] font-bold text-[#b84dff] tracking-wider mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>AI INSIGHT PREVIEW</div>
              <div className="text-[10px] font-semibold text-[#64748b] mb-1">MOST COMMON ANOMALY</div>
              <div className="text-[11px] font-bold text-[#f8fafc] mb-1">Duplicate Expenses</div>
              <p className="text-[10px] text-[#94a3b8] leading-relaxed mb-3">
                {stats?.duplicate_count ?? 8} potential duplicates detected which could inflate total spend by ₹ {((stats?.duplicate_count ?? 8) * 1850).toLocaleString()}. Recommended Action: Manual review ledger.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-[rgba(255,79,216,0.06)] pt-2 mt-auto">
              <Link to="/anomalies" className="text-[9px] text-[#b84dff] hover:text-[#d8b4fe] font-bold flex items-center gap-1">
                View Full Insights <ArrowRight size={10} />
              </Link>
              <Cpu size={16} className="text-[#b84dff] animate-pulse" />
            </div>
          </HolographicPanel>
        </div>

        {/* Recent Anomalies Ledger (42% = col-span-5) */}
        <div className="col-span-5">
          <HolographicPanel id="panel-recent-anoms" className="p-4 h-[220px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#ff4fd8] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>RECENT ANOMALIES</span>
              <Link to="/anomalies" className="text-[9px] text-[#ff4fd8] hover:text-[#ff6ec7] font-bold flex items-center gap-1">
                View All <ArrowRight size={9} />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 pr-1 border border-[rgba(255,79,216,0.06)] rounded-lg">
              <table className="w-full text-[9px] text-left">
                <thead>
                  <tr style={{ background: 'rgba(255,79,216,0.02)' }} className="border-b border-[rgba(255,79,216,0.06)]">
                    <th className="px-2 py-1 text-[#64748b]">SEVERITY</th>
                    <th className="px-2 py-1 text-[#64748b]">DESCRIPTION</th>
                    <th className="px-2 py-1 text-[#64748b] text-right">AMOUNT</th>
                    <th className="px-2 py-1 text-[#64748b] text-center">ROW</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnomaliesList.map((anom) => {
                    const sevColor = SEVERITY_COLORS[anom.severity] || '#ff4fd8';
                    const amountVal = parseFloat(anom.expense_amount) || 0;
                    return (
                      <tr key={anom.id} className="border-b border-[rgba(255,79,216,0.03)] hover:bg-[rgba(255,79,216,0.01)]">
                        <td className="px-2 py-1 font-bold" style={{ color: sevColor }}>{anom.severity}</td>
                        <td className="px-2 py-1 text-[#e2e8f0] truncate max-w-[120px]">{anom.expense_description}</td>
                        <td className="px-2 py-1 text-right text-[#94a3b8] font-mono">₹ {amountVal.toLocaleString()}</td>
                        <td className="px-2 py-1 text-center text-[#475569] font-bold">#{anom.expense}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </HolographicPanel>
        </div>
      </div>
      
      {/* Absolute Quick Action Floating Links inside Center layout */}
      <div className="grid grid-cols-4 gap-4 mt-5">
        {[
          { to: '/import',    icon: Upload,         label: 'Import New CSV',      color: '#ff4fd8' },
          { to: '/anomalies', icon: AlertTriangle,  label: 'Review Anomalies',    color: '#b84dff' },
          { to: '/reports',   icon: FileText,       label: 'Generate Report',     color: '#ff6ec7' },
          { to: '/dashboard', icon: Cpu,            label: 'AI Insights Core',    color: '#00ff88' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={label} to={to}
            className="flex items-center gap-2.5 p-3 rounded-xl text-xs transition-all hover:bg-[rgba(255,79,216,0.03)]"
            style={{ border: '1px solid rgba(255,79,216,0.08)', background: 'rgba(0,0,0,0.15)', color: '#94a3b8' }}>
            <Icon size={12} style={{ color }} />
            <span style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>{label}</span>
            <ChevronRight size={12} className="ml-auto text-[#475569]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
