import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, TrendingUp, AlertTriangle, CheckCircle,
  Brain, Sparkles, BarChart2, ShieldAlert
} from 'lucide-react';
import { useExpenses, useDashboardStats } from '../hooks/useData';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff3d3d',
  HIGH:     '#ff8c00',
  MEDIUM:   '#b84dff',
  LOW:      '#00aaff',
};

interface InsightCardProps { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; title: string; body: string; color: string; delay: number; }
function InsightCard({ icon: Icon, title, body, color, delay }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white mb-1">{title}</div>
          <div className="text-xs text-[#64748b] leading-relaxed">{body}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AIInsights() {
  const { expenses } = useExpenses();
  const { stats }    = useDashboardStats();

  // --- Compute insights from real data ---
  const insights = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;

    const amounts  = expenses.map((e) => parseFloat(e.amount ?? 0));
    const total    = amounts.reduce((a, b) => a + b, 0);
    const avg      = total / amounts.length;
    const max      = Math.max(...amounts);
    const maxExp   = expenses.find((e) => parseFloat(e.amount) === max);
    const overAvg  = expenses.filter((e) => parseFloat(e.amount) > avg * 2).length;

    // Top category by spend
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] ?? 0) + parseFloat(e.amount ?? 0); });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    // Currency diversity
    const currencies = Array.from(new Set(expenses.map((e) => e.currency).filter(Boolean)));

    return { total, avg, max, maxExp, overAvg, topCat, currencies, count: expenses.length };
  }, [expenses]);

  type CardDef = Omit<InsightCardProps, 'delay'>;
  const cards: CardDef[] = insights ? [
    {
      icon: TrendingUp,
      title: 'Spending Trend',
      body: `Total portfolio spend is $${insights.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${insights.count} transactions. Average transaction value is $${insights.avg.toFixed(2)}.`,
      color: '#ff4fd8',
    },
    {
      icon: ShieldAlert,
      title: 'Outlier Detection',
      body: `${insights.overAvg} transaction${insights.overAvg !== 1 ? 's' : ''} are more than 2× the average amount. The largest single expense is $${insights.max.toLocaleString()} from ${insights.maxExp?.payer ?? 'unknown payer'}.`,
      color: '#ff3d3d',
    },
    {
      icon: BarChart2,
      title: 'Top Spend Category',
      body: insights.topCat
        ? `"${insights.topCat[0]}" accounts for the highest spend at $${insights.topCat[1].toLocaleString('en-US', { minimumFractionDigits: 2 })}, representing ${((insights.topCat[1] / insights.total) * 100).toFixed(1)}% of total expenses.`
        : 'Category breakdown not available.',
      color: '#b84dff',
    },
    {
      icon: Brain,
      title: 'Currency Exposure',
      body: `Expenses span ${insights.currencies.length} currenc${insights.currencies.length !== 1 ? 'ies' : 'y'}: ${insights.currencies.join(', ') || 'USD'}. Multi-currency records introduce FX risk and conversion anomalies.`,
      color: '#00aaff',
    },
  ] : [];

  // Anomaly severity breakdown from stats
  const anomalyBreakdown = stats ? [
    { label: 'Critical', count: stats.critical_anomalies, color: SEVERITY_COLORS.CRITICAL },
    { label: 'High',     count: stats.high_anomalies ?? 0,     color: SEVERITY_COLORS.HIGH },
    { label: 'Medium',   count: stats.medium_anomalies, color: SEVERITY_COLORS.MEDIUM },
    { label: 'Low',      count: stats.low_anomalies,    color: SEVERITY_COLORS.LOW },
  ] : [];

  const totalAnomalies = anomalyBreakdown.reduce((s, b) => s + b.count, 0);
  const integrityScore = stats?.integrity_score ?? null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(184,77,255,0.1)', border: '1px solid rgba(184,77,255,0.2)' }}>
            <Cpu size={20} style={{ color: '#b84dff' }} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
            AI INSIGHTS
          </h1>
        </div>
        <p className="text-sm text-[#475569] ml-14">Machine-generated analysis of your expense data</p>
      </motion.div>

      {/* Score + Anomaly summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Integrity Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: 'rgba(255,79,216,0.04)', border: '1px solid rgba(255,79,216,0.12)' }}
        >
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,79,216,0.1)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke="#ff4fd8" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - (integrityScore ?? 54) / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 6px #ff4fd8)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {integrityScore !== null ? Math.round(integrityScore) : '—'}
              </span>
              <span className="text-[8px] text-[#475569]">SCORE</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#475569] mb-1">Data Integrity Score</div>
            <div className="text-lg font-bold text-white mb-1">{stats?.grade ?? '—'}</div>
            <div className="text-xs text-[#64748b]">
              {integrityScore !== null
                ? integrityScore >= 80 ? 'Excellent — data is clean and reliable.'
                  : integrityScore >= 60 ? 'Moderate — some anomalies need review.'
                  : 'Poor — significant data quality issues detected.'
                : 'Import data to compute score.'}
            </div>
          </div>
        </motion.div>

        {/* Anomaly breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} style={{ color: '#ff8c00' }} />
            <span className="text-xs font-medium text-[#94a3b8]">Anomaly Breakdown</span>
            <span className="ml-auto text-xs font-bold text-white">{totalAnomalies} total</span>
          </div>
          {anomalyBreakdown.length === 0 ? (
            <p className="text-xs text-[#475569]">No anomaly data yet. Run anomaly detection after importing CSV.</p>
          ) : (
            <div className="space-y-3">
              {anomalyBreakdown.map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color }}>{label}</span>
                    <span className="text-[#94a3b8]">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.05)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: totalAnomalies > 0 ? `${(count / totalAnomalies) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Insight Cards */}
      {insights ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: '#ff4fd8' }} />
            <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest">Generated Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((c, i) => (
              <InsightCard key={c.title} {...c} delay={0.2 + i * 0.08} />
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <CheckCircle size={40} style={{ color: '#475569' }} className="mx-auto mb-3" />
          <p className="text-sm text-[#64748b]">No expense data found.</p>
          <p className="text-xs text-[#475569] mt-1">Import a CSV file to generate AI-powered insights.</p>
        </motion.div>
      )}
    </div>
  );
}
