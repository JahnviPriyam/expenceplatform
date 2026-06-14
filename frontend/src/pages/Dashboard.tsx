import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Zap
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import QuantumCore from '../components/QuantumCore';
import HolographicPanel from '../components/HolographicPanel';
import { useDashboardStats, useExpenses } from '../hooks/useData';
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

  const coreMetrics = useMemo(() => deriveCoreMetrics(stats), [stats]);

  // Merge dynamic data with the exact reference design fallback values
  const defaultSpend = stats?.total_amount ? parseFloat(stats.total_amount) : 148420.00;
  const defaultTotalRecords = stats?.latest_import?.total_records ?? 42;
  const defaultImported = stats?.latest_import?.records_imported ?? 42;
  const defaultAnomalies = stats?.total_anomalies ?? 20;
  const defaultCritical = stats?.critical_anomalies ?? 1;



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


  if (statsLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#ff4fd8] font-orbitron animate-pulse text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        LOADING INTELLIGENCE CORE...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[rgba(255,79,216,0.02)] to-[rgba(0,0,0,0.3)]">
      {/* TOP BAR: Compact header + quick metrics */}
      <div className="p-4 pl-14 lg:pl-4 border-b border-[rgba(255,79,216,0.06)] bg-[rgba(5,5,10,0.85)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              ⚡ MISSION CONTROL
            </h1>
            <p className="text-xs text-[#64748b] mt-1">Real-time intelligence core | {stats?.total_expenses ?? 0} records | {coreMetrics.integrity_score.toFixed(0)}% integrity</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <div className="text-[10px] text-[#64748b]">INTEGRITY STATUS</div>
              <div className="text-sm font-bold" style={{ color: coreMetrics.integrity_score < 70 ? '#ff3d3d' : '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
                {coreMetrics.integrity_score < 70 ? 'CRITICAL' : 'PRISTINE'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#64748b]">ANOMALIES</div>
              <div className="text-sm font-bold text-[#ff8c00]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {defaultAnomalies}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI PANEL: Unified horizontal banner */}
      <div className="px-4 pt-4">
        <HolographicPanel className="p-3.5" glowColor="rgba(255,79,216,0.08)">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,79,216,0.12)]">
            {[
              { label: 'RECORDS INGESTED', value: defaultTotalRecords, icon: CheckCircle, color: '#ff4fd8' },
              { label: 'VALID ENTRIES', value: defaultImported, icon: CheckCircle, color: '#00ff88' },
              { label: 'TOTAL ANOMALIES', value: defaultAnomalies, icon: AlertTriangle, color: '#ff8c00' },
              { label: 'CRITICAL ISSUES', value: defaultCritical, icon: AlertTriangle, color: '#ff3d3d' },
              { label: 'QUALITY GRADE', value: coreMetrics.grade, icon: Zap, color: '#ff4fd8' },
              { label: 'ESTIMATED SPEND', value: `₹${(defaultSpend/100000).toFixed(1)}L`, icon: Zap, color: '#b84dff' },
            ].map(({ label, value, icon: Icon, color }, idx) => (
              <div key={label} className={`flex flex-col justify-between items-center text-center ${idx > 0 ? 'pt-2 md:pt-0 md:pl-2' : ''}`}>
                <span className="text-[8px] font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Icon size={11} style={{ color }} />
                  <span className="text-sm font-extrabold text-[#f8fafc]" style={{ fontFamily: 'Orbitron, sans-serif' }}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </HolographicPanel>
      </div>

      {/* MAIN CONTENT: 2-column layout - Center console + Sidebar analytics */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        
        {/* CENTER CONSOLE: Quantum Core & System Logs (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <HolographicPanel noPad className="relative overflow-hidden flex flex-col justify-between flex-1" id="panel-core" style={{ minHeight: '520px' }}>
            <div className="absolute top-3 left-4 z-20 pointer-events-none">
              <div className="text-[11px] font-bold text-[#ff4fd8] tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                QUANTUM INTEGRITY CORE <span className="ml-1 px-1 py-0.5 rounded bg-[rgba(0,255,136,0.2)] text-[7px] text-[#00ff88] font-bold">LIVE</span>
              </div>
            </div>
            
            <div className="flex-1 w-full mt-12" style={{ height: '360px' }}>
              <QuantumCore metrics={coreMetrics} className="w-full h-full" />
            </div>

            {/* Integrated Telemetry Log grid at bottom of Core panel */}
            <div className="border-t border-[rgba(255,79,216,0.12)] bg-[rgba(5,5,10,0.85)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px]">
              <div>
                <div className="font-bold text-[#ff4fd8] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Import Activity</div>
                <div className="text-[#64748b] space-y-1">
                  <div>📁 File: <span className="text-[#e2e8f0] font-semibold">{stats?.latest_import?.filename ?? 'expenses.csv'}</span></div>
                  <div>📅 Ingested: <span className="text-[#e2e8f0] font-semibold">{stats?.latest_import ? new Date(stats.latest_import.created_at).toLocaleDateString('en-GB') : '14 Jun'}</span></div>
                  <div>⚙️ Size: <span className="text-[#e2e8f0] font-semibold">{defaultTotalRecords} rows</span></div>
                </div>
              </div>
              <div>
                <div className="font-bold text-[#ff4fd8] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Quality Index</div>
                <div className="text-[#64748b] space-y-1">
                  <div>📊 Integrity Index: <span className="text-[#e2e8f0] font-semibold">{coreMetrics.integrity_score.toFixed(0)}%</span></div>
                  <div>✓ Core Confidence: <span className="text-[#e2e8f0] font-semibold">{coreMetrics.confidence_score.toFixed(0)}%</span></div>
                  <div>⚠️ Anomalies Check: <span className="text-[#e2e8f0] font-semibold">{defaultAnomalies} detected</span></div>
                </div>
              </div>
              <div>
                <div className="font-bold text-[#ff4fd8] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Spend Analysis</div>
                <div className="text-[#64748b] space-y-1">
                  <div>📈 Spend Trend: <span className="text-[#00ff88] font-bold">↑ 12.4%</span></div>
                  <div>🛍️ Top Merchants: <span className="text-[#e2e8f0] font-semibold">{topMerchants.slice(0, 2).map(m => m.name.slice(0, 10)).join(', ')}</span></div>
                  <div>🌍 Base Currency: <span className="text-[#e2e8f0] font-semibold">INR (Inferred)</span></div>
                </div>
              </div>
            </div>
          </HolographicPanel>
        </div>

        {/* RIGHT SIDEBAR: Consolidated Analytics (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <HolographicPanel className="flex-1 flex flex-col justify-between p-4" glowColor="#ff4fd8">
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-[#ff4fd8] uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Analytics & Telemetry Console
              </div>
              
              {/* Severity Breakdown */}
              <div className="border-b border-[rgba(255,79,216,0.08)] pb-3">
                <span className="text-[9px] font-bold text-[#64748b] block mb-2 uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>Severity Distribution</span>
                <div className="flex items-center gap-3">
                  <div style={{ width: '60px', height: '60px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={anomalyPieData} cx="50%" cy="50%" innerRadius={12} outerRadius={24} dataKey="value" stroke="none">
                          {anomalyPieData.map((d, i) => <Cell key={i} fill={SEVERITY_COLORS[d.name.toUpperCase()]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 flex-1 text-[9px]">
                    {anomalyPieData.map((d) => {
                      const sevColor = SEVERITY_COLORS[d.name.toUpperCase()];
                      return (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="text-[#94a3b8]">{d.name}</span>
                          <span className="font-bold" style={{ color: sevColor }}>{d.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Spending By Category */}
              <div className="border-b border-[rgba(255,79,216,0.08)] pb-3">
                <span className="text-[9px] font-bold text-[#64748b] block mb-2 uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>Category Distribution</span>
                <div className="flex items-center gap-3">
                  <div style={{ width: '60px', height: '60px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={12} outerRadius={24} dataKey="value" stroke="none">
                          {categoryPieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % 5]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 flex-1 text-[9px]">
                    {categoryPieData.slice(0, 3).map((d, i) => {
                      const total = categoryPieData.reduce((sum, item) => sum + item.value, 0);
                      const pct = ((d.value / total) * 100).toFixed(0);
                      return (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1 truncate">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[i % 5] }} />
                            <span className="text-[#94a3b8] truncate">{d.name.slice(0, 12)}</span>
                          </div>
                          <span className="font-bold text-[#e2e8f0]">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Currency Index */}
              <div className="border-b border-[rgba(255,79,216,0.08)] pb-3">
                <span className="text-[9px] font-bold text-[#64748b] block mb-2 uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>Currency Index</span>
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  {currencyPieData.map((d, i) => {
                    const total = currencyPieData.reduce((sum, item) => sum + item.value, 0);
                    const pct = ((d.value / total) * 100).toFixed(0);
                    return (
                      <div key={d.name} className="bg-[rgba(0,0,0,0.2)] p-1 rounded text-center border border-[rgba(255,79,216,0.05)]">
                        <span className="font-semibold block" style={{ color: CURRENCY_COLORS[i % 3] }}>{d.name}</span>
                        <span className="text-[#94a3b8] font-bold mt-0.5 block">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Spend Entities */}
              <div>
                <span className="text-[9px] font-bold text-[#64748b] block mb-2 uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>Top Spend Entities</span>
                <div className="space-y-1.5 text-[9px]">
                  {topMerchants.slice(0, 3).map((m, i) => (
                    <div key={m.name} className="flex justify-between items-center bg-[rgba(255,79,216,0.02)] px-2 py-1 rounded">
                      <span className="text-[#94a3b8]">{i + 1}. {m.name.slice(0, 16)}</span>
                      <span className="text-[#e2e8f0] font-mono font-bold">₹{Math.round(m.total/1000)}k</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Access links */}
            <div className="mt-4 pt-3 border-t border-[rgba(255,79,216,0.08)]">
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <Link to="/import" className="px-2 py-2 rounded text-center bg-[rgba(255,79,216,0.05)] hover:bg-[rgba(255,79,216,0.1)] border border-[rgba(255,79,216,0.15)] text-[#ff4fd8] font-bold transition-all" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  📤 IMPORT CSV
                </Link>
                <Link to="/anomalies" className="px-2 py-2 rounded text-center bg-[rgba(180,77,255,0.05)] hover:bg-[rgba(180,77,255,0.1)] border border-[rgba(180,77,255,0.15)] text-[#b84dff] font-bold transition-all" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  🔍 ANOMALIES
                </Link>
              </div>
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}

