import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Upload, AlertTriangle, TrendingUp, DollarSign, ArrowRight, Shield } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import QuantumCore from '../components/QuantumCore';
import HolographicPanel from '../components/HolographicPanel';
import { useDashboardStats } from '../hooks/useData';
import type { CoreMetrics, CoreState } from '../types';

function deriveCoreMetrics(stats: ReturnType<typeof useDashboardStats>['stats']): CoreMetrics {
  if (!stats) return { state: 'pristine', integrity_score: 100, grade: 'A', anomalies_found: 0, data_integrity: 100, confidence_score: 100 };

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

const PIE_COLORS = ['#00f0ff', '#0066ff', '#9d4edd', '#ff8c00', '#00ff88'];

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();
  const coreMetrics = useMemo(() => deriveCoreMetrics(stats), [stats]);

  const radarData = stats ? [
    { subject: 'CRITICAL', value: stats.critical_anomalies, max: 10 },
    { subject: 'HIGH',     value: stats.high_anomalies,     max: 10 },
    { subject: 'MEDIUM',   value: stats.medium_anomalies,   max: 10 },
    { subject: 'LOW',      value: stats.low_anomalies,      max: 10 },
    { subject: 'CLEAN',    value: Math.max(0, 10 - stats.total_anomalies), max: 10 },
  ] : [];

  const pieData = stats ? Object.entries(stats.currency_distribution).map(([name, value]) => ({ name, value })) : [];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#00f0ff] font-orbitron animate-pulse" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        LOADING INTELLIGENCE CORE...
      </div>
    </div>
  );

  const hasData = stats && stats.total_expenses > 0;

  return (
    <div className="min-h-screen p-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              INTELLIGENCE DASHBOARD
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              Real-time expense intelligence · {stats?.total_expenses ?? 0} records analysed
            </p>
          </div>
          {!hasData && (
            <Link to="/import" id="btn-go-import"
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl btn-primary"
              style={{ color: 'white', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
              <Upload size={14} /> IMPORT DATA <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-5">

        {/* ── LEFT COLUMN (3 cols) ── */}
        <div className="col-span-3 flex flex-col gap-5">

          {/* Summary stats */}
          <HolographicPanel id="panel-stats">
            <div className="text-[10px] font-bold mb-4" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              FINANCIAL OVERVIEW
            </div>
            <div className="space-y-4">
              {[
                { label: 'Total Spend', value: stats ? `₹${parseFloat(stats.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—', icon: DollarSign, color: '#00f0ff' },
                { label: 'Total Records', value: stats?.total_expenses ?? '—', icon: TrendingUp, color: '#0066ff' },
                { label: 'Anomalies', value: stats?.total_anomalies ?? '—', icon: AlertTriangle, color: stats && stats.total_anomalies > 0 ? '#ff3d3d' : '#00ff88' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.06)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: '#475569' }}>{label}</div>
                    <div className="text-lg font-bold" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </HolographicPanel>

          {/* Top categories */}
          <HolographicPanel id="panel-categories">
            <div className="text-[10px] font-bold mb-4" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              TOP CATEGORIES
            </div>
            {stats?.top_categories?.length ? (
              <div className="space-y-2">
                {stats.top_categories.map((cat, i) => {
                  const pct = Math.round((parseFloat(cat.total) / parseFloat(stats.total_amount)) * 100);
                  return (
                    <div key={cat.category || i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: '#94a3b8' }}>{cat.category || 'Uncategorised'}</span>
                        <span style={{ color: '#00f0ff' }}>{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(0,240,255,0.1)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${PIE_COLORS[i % 5]}, ${PIE_COLORS[(i + 1) % 5]})` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#334155' }}>No category data yet</p>
            )}
          </HolographicPanel>

          {/* Integrity score */}
          <HolographicPanel id="panel-integrity" glowColor={coreMetrics.state === 'critical' ? '#ff3d3d' : '#00f0ff'}>
            <div className="text-[10px] font-bold mb-3" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              DATA INTEGRITY SCORE
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,240,255,0.1)" strokeWidth="6" />
                  <motion.circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke={coreMetrics.state === 'critical' ? '#ff3d3d' : coreMetrics.state === 'warning' ? '#9d4edd' : '#00f0ff'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - coreMetrics.integrity_score / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
                    {coreMetrics.integrity_score.toFixed(0)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: '#e2e8f0', fontFamily: 'Orbitron, sans-serif' }}>
                  {coreMetrics.grade}
                </div>
                <div className="text-[11px] mt-1" style={{ color: '#475569' }}>
                  {coreMetrics.state === 'pristine' ? 'No data imported yet' :
                   coreMetrics.state === 'stable' ? 'Healthy dataset' :
                   coreMetrics.state === 'warning' ? 'Issues detected' : 'Critical issues found'}
                </div>
              </div>
            </div>
          </HolographicPanel>
        </div>

        {/* ── CENTER (6 cols) — Quantum Core ── */}
        <div className="col-span-6">
          <HolographicPanel noPad className="h-full min-h-[600px]" id="panel-core">
            <QuantumCore metrics={coreMetrics} className="h-full min-h-[600px]" />
            {!hasData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 20 }}>
                <div className="text-center px-8">
                  <p className="text-sm mb-4" style={{ color: '#334155' }}>Core awaiting data ingestion</p>
                  <Link to="/import" id="btn-core-import" className="pointer-events-auto flex items-center gap-2 text-xs px-4 py-2 rounded-xl btn-primary"
                    style={{ color: 'white', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                    <Upload size={12} /> INGEST DATA
                  </Link>
                </div>
              </div>
            )}
          </HolographicPanel>
        </div>

        {/* ── RIGHT COLUMN (3 cols) ── */}
        <div className="col-span-3 flex flex-col gap-5">

          {/* Severity breakdown */}
          <HolographicPanel id="panel-severity" glowColor="#9d4edd">
            <div className="text-[10px] font-bold mb-4" style={{ color: '#9d4edd', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              ANOMALY SEVERITY
            </div>
            <div className="space-y-3">
              {[
                { label: 'Critical', count: stats?.critical_anomalies ?? 0, color: '#ff3d3d' },
                { label: 'High',     count: stats?.high_anomalies ?? 0,     color: '#ff8c00' },
                { label: 'Medium',   count: stats?.medium_anomalies ?? 0,   color: '#9d4edd' },
                { label: 'Low',      count: stats?.low_anomalies ?? 0,      color: '#00aaff' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="text-xs flex-1" style={{ color: '#94a3b8' }}>{label}</span>
                  <span className="text-sm font-bold" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{count}</span>
                </div>
              ))}
            </div>
          </HolographicPanel>

          {/* Anomaly Radar */}
          <HolographicPanel id="panel-radar" glowColor="#9d4edd">
            <div className="text-[10px] font-bold mb-2" style={{ color: '#9d4edd', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              ANOMALY RADAR
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,240,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9 }} />
                <Radar name="Issues" dataKey="value" stroke="#9d4edd" fill="#9d4edd" fillOpacity={0.25} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </HolographicPanel>

          {/* Currency Distribution */}
          <HolographicPanel id="panel-currency">
            <div className="text-[10px] font-bold mb-2" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              CURRENCY DISTRIBUTION
            </div>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % 5]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d0f1f', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 flex-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ background: PIE_COLORS[i % 5] }} />
                      <span className="text-[10px]" style={{ color: '#94a3b8' }}>{d.name}</span>
                      <span className="text-[10px] ml-auto font-bold" style={{ color: PIE_COLORS[i % 5] }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: '#334155' }}>No data</p>
            )}
          </HolographicPanel>

          {/* Quick actions */}
          <HolographicPanel id="panel-actions">
            <div className="text-[10px] font-bold mb-3" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              QUICK ACTIONS
            </div>
            <div className="space-y-2">
              {[
                { to: '/import',    icon: Upload,        label: 'Import New CSV',      color: '#0066ff' },
                { to: '/anomalies', icon: AlertTriangle, label: 'Review Anomalies',    color: '#9d4edd' },
                { to: '/reports',   icon: Shield,        label: 'Generate Report',     color: '#00ff88' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all hover:bg-[rgba(0,240,255,0.05)]"
                  style={{ border: '1px solid rgba(0,240,255,0.06)', color: '#94a3b8' }}>
                  <Icon size={13} style={{ color }} />
                  {label}
                  <ArrowRight size={11} className="ml-auto" style={{ color: '#334155' }} />
                </Link>
              ))}
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}
