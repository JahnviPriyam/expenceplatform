import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import AIConsole from '../components/AIConsole';
import HolographicPanel from '../components/HolographicPanel';
import { useAnomalies, useAIExplain, useExpenses } from '../hooks/useData';
import type { Severity, Participant } from '../types';

const SEVERITIES: (Severity | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SEVERITY_COLORS: Record<string, string> = {
  ALL:      '#ff4fd8',
  CRITICAL: '#ff3d3d',
  HIGH:     '#ff8c00',
  MEDIUM:   '#b84dff',
  LOW:      '#00aaff',
};

const TYPE_LABELS: Record<string, string> = {
  DUPLICATE_EXPENSE:   'Duplicate Expense',
  MISSING_CURRENCY:    'Missing Currency',
  MISSING_PAYER:       'Missing Payer',
  INVALID_SPLIT:       'Invalid Split',
  UNUSUAL_AMOUNT:      'Unusual Amount',
  FUTURE_DATE:         'Future Date',
  AMBIGUOUS_DATE:      'Ambiguous Date',
  SINGLE_PARTICIPANT:  'Single Participant',
  SETTLEMENT_MIXED:    'Settlement Mixed',
};

export default function Anomalies() {
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL');
  const { anomalies, loading } = useAnomalies(filter === 'ALL' ? undefined : filter);
  const { explanation, loading: aiLoading, explain } = useAIExplain();
  const { expenses } = useExpenses();
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<number | null>(null);

  // Tab selections & resolution tracking
  const [activeTab, setActiveTab] = useState<'details' | 'ai' | 'strategy'>('details');
  const [isResolvedMap, setIsResolvedMap] = useState<Record<number, boolean>>({});
  const [selectedResolution, setSelectedResolution] = useState<string>('');

  const activeAnomaly = anomalies.find(a => a.id === selectedAnomalyId);
  const activeExpense = activeAnomaly ? expenses.find(e => e.id === activeAnomaly.expense) : null;

  const handleRowClick = (id: number) => {
    setSelectedAnomalyId(id);
    setSelectedResolution('');
    explain(id);
  };

  const handleConfirmResolution = (id: number) => {
    setIsResolvedMap(prev => ({ ...prev, [id]: true }));
  };

  const counts = anomalies.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen p-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="title-page text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          ⚡ AUDIT WORKBENCH
        </h1>
        <p className="text-xs mt-1 text-[#64748b]">
          {anomalies.length} active anomalies flagged · Click row to execute AI audit & confirmation
        </p>
      </motion.div>

      {/* Severity Filter Pills Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(sev => (
          <motion.button
            key={sev}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setFilter(filter === sev ? 'ALL' : sev)}
            id={`filter-${sev.toLowerCase()}`}
            className="rounded-xl p-2.5 text-left transition-all cursor-pointer"
            style={{
              background: filter === sev ? `${SEVERITY_COLORS[sev]}12` : 'rgba(12,12,20,0.85)',
              border: `1px solid ${filter === sev ? SEVERITY_COLORS[sev] + '50' : 'rgba(255,79,216,0.08)'}`,
              boxShadow: filter === sev ? `0 0 10px ${SEVERITY_COLORS[sev]}10` : 'none',
            }}
          >
            <div className="text-lg font-extrabold" style={{ color: SEVERITY_COLORS[sev], fontFamily: 'Orbitron, sans-serif' }}>
              {counts[sev] ?? 0}
            </div>
            <div className="text-[8px] font-bold mt-0.5" style={{ color: filter === sev ? SEVERITY_COLORS[sev] : '#64748b', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
              {sev}
            </div>
          </motion.button>
        ))}
      </div>

      {/* WORKSPACE LAYOUT: 8 cols (Ledger) / 4 cols (Investigation Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN: Data-dense Ledger Table (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <HolographicPanel noPad className="overflow-hidden" id="panel-anomaly-list" glowColor="#ff4fd8">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(255,79,216,0.08)] bg-[rgba(5,5,10,0.4)]">
              <div className="flex items-center gap-2">
                <Filter size={12} style={{ color: '#ff4fd8' }} />
                <span className="text-[9px] font-bold" style={{ color: '#ff4fd8', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                  ANOMALY LEDGER
                </span>
              </div>
              <div className="flex gap-1.5">
                {SEVERITIES.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className="px-2 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer"
                    style={{
                      background: filter === s ? `${SEVERITY_COLORS[s] || '#ff4fd8'}15` : 'transparent',
                      color: filter === s ? (SEVERITY_COLORS[s] || '#ff4fd8') : '#475569',
                      border: filter === s ? `1px solid ${SEVERITY_COLORS[s] || '#ff4fd8'}30` : '1px solid transparent',
                      fontFamily: 'Orbitron, sans-serif',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-xs animate-pulse text-[#64748b]">SCANNING AUDIT RECORDS...</div>
            ) : anomalies.length === 0 ? (
              <div className="text-center py-20 text-xs text-[#475569]">No anomalies found for filter state.</div>
            ) : (
              <div className="overflow-y-auto max-h-[520px]">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(8,9,20,0.95)', borderBottom: '1px solid rgba(255,79,216,0.08)' }}>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>ROW</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>TYPE</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider text-right" style={{ fontFamily: 'Orbitron, sans-serif' }}>AMOUNT</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>SEVERITY</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>PAYER</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((a) => {
                      const isSelected = selectedAnomalyId === a.id;
                      const isResolved = isResolvedMap[a.id] || a.resolved;
                      const sevColor = SEVERITY_COLORS[a.severity] || '#ff4fd8';
                      return (
                        <tr
                          key={a.id}
                          onClick={() => handleRowClick(a.id)}
                          className="hover:bg-[rgba(255,79,216,0.02)] cursor-pointer transition-all border-b border-[rgba(255,79,216,0.03)]"
                          style={{
                            background: isSelected ? `${sevColor}04` : 'transparent',
                            outline: isSelected ? `1px solid ${sevColor}25` : 'none',
                          }}
                          id={`anomaly-row-${a.id}`}
                        >
                          <td className="p-3 text-center text-[#94a3b8] font-bold">
                            #{a.expense}
                          </td>
                          <td className="p-3 font-semibold text-[#e2e8f0]">
                            {TYPE_LABELS[a.anomaly_type] || a.anomaly_type}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#f8fafc]">
                            {a.expense_currency} {parseFloat(a.expense_amount).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full inline-block"
                              style={{
                                background: `${sevColor}12`,
                                border: `1px solid ${sevColor}30`,
                                color: sevColor,
                                fontFamily: 'Orbitron, sans-serif',
                              }}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[#64748b] font-medium truncate max-w-[80px]">
                            {a.expense_description.split(' - ')[1] || 'System'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                              background: isResolved ? 'rgba(0,255,136,0.08)' : 'rgba(255,79,216,0.05)',
                              color: isResolved ? '#00ff88' : '#e2e8f0',
                              border: `1px solid ${isResolved ? 'rgba(0,255,136,0.2)' : 'transparent'}`
                            }}>
                              {isResolved ? '✓ RESOLVED' : '⚠ Flagged'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </HolographicPanel>
        </div>

        {/* RIGHT COLUMN: Unified Investigation Tabs Console (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="glass-panel flex flex-col min-h-[460px] overflow-hidden" style={{ borderColor: 'rgba(255, 79, 216, 0.15)' }}>
            
            {/* Tabs Header */}
            <div className="flex border-b border-[rgba(255,79,216,0.08)] bg-[rgba(5,5,10,0.5)]">
              {(['details', 'ai', 'strategy'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => selectedAnomalyId && setActiveTab(tab)}
                  disabled={!selectedAnomalyId}
                  className={`flex-1 py-2 text-[8px] font-bold uppercase tracking-wider text-center transition-all border-b-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
                  style={{
                    color: activeTab === tab ? '#ff4fd8' : '#64748b',
                    borderColor: activeTab === tab ? '#ff4fd8' : 'transparent',
                    fontFamily: 'Orbitron, sans-serif'
                  }}
                >
                  {tab === 'details' ? '🔍 Record' : tab === 'ai' ? '🤖 AI Explainer' : '⚙️ Strategy'}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 flex flex-col justify-between">
              {activeAnomaly ? (
                <>
                  {activeTab === 'details' && (
                    <div className="p-4 space-y-3.5 text-[10px] overflow-y-auto max-h-[380px]">
                      <div>
                        <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif' }}>Description</span>
                        <div className="text-xs font-bold text-[#f8fafc] mt-0.5">{activeAnomaly.expense_description}</div>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif' }}>Amount</span>
                          <div className="text-sm font-extrabold text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {activeAnomaly.expense_currency} {parseFloat(activeAnomaly.expense_amount).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif' }}>Date</span>
                          <div className="text-xs text-[#94a3b8] font-bold mt-0.5">{activeAnomaly.expense_date}</div>
                        </div>
                      </div>
                      {activeExpense && (
                        <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,79,216,0.08)] pt-2.5">
                          <div>
                            <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif' }}>Payer</span>
                            <div className="text-xs font-semibold text-[#e2e8f0] mt-0.5">{activeExpense.payer || '(missing)'}</div>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif' }}>Category</span>
                            <div className="text-xs font-semibold text-[#e2e8f0] mt-0.5">{activeExpense.category || '(uncategorised)'}</div>
                          </div>
                        </div>
                      )}
                      {activeExpense && activeExpense.participants?.length > 0 && (
                        <div className="border-t border-[rgba(255,79,216,0.08)] pt-2.5">
                          <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider mb-1 block" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Split Shares ({activeExpense.split_type})
                          </span>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {activeExpense.participants.map((p: Participant, idx: number) => (
                              <div key={idx} className="flex justify-between text-[9px] bg-[rgba(0,0,0,0.25)] px-2 py-1 rounded">
                                <span className="text-[#94a3b8]">{p.name}</span>
                                <span className="text-[#e2e8f0] font-bold">
                                  {p.share_pct !== null ? `${p.share_pct}%` : `${activeAnomaly.expense_currency} ${p.share_amount}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="border-t border-[rgba(255,79,216,0.08)] pt-2.5">
                        <span className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif' }}>Detector Note</span>
                        <p className="text-[9px] text-[#64748b] leading-relaxed mt-0.5">{activeAnomaly.description}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ai' && (
                    <div className="flex-1 flex flex-col min-h-[380px]">
                      <AIConsole
                        explanation={explanation}
                        loading={aiLoading}
                        anomalyLabel={`${TYPE_LABELS[activeAnomaly.anomaly_type]} · ${activeAnomaly.severity}`}
                      />
                    </div>
                  )}

                  {activeTab === 'strategy' && (
                    <div className="p-4 space-y-4 text-[10px] flex-1 flex flex-col justify-between max-h-[380px] overflow-y-auto">
                      <div className="space-y-3">
                        <div>
                          <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '8px' }}>REASONING</span>
                          <p className="text-[#64748b] leading-relaxed mt-0.5">
                            {activeAnomaly.anomaly_type === 'DUPLICATE_EXPENSE' 
                              ? 'Identical expense profiles exist with overlapping transaction values, date ranges, and split participant counts.' 
                              : 'Schema parameters mismatched for base split percentages or default transaction formatting.'}
                          </p>
                        </div>
                        <div>
                          <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '8px' }}>TRADEOFFS</span>
                          <p className="text-[#64748b] leading-relaxed mt-0.5">
                            Auto-resolution is disabled to prevent accidental transaction deletions. Auditor review is enforced.
                          </p>
                        </div>
                        <div>
                          <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '8px' }}>RESOLUTION STRATEGY</span>
                          <p className="text-[#00ff88] leading-relaxed mt-0.5 font-semibold">
                            {activeAnomaly.anomaly_type === 'DUPLICATE_EXPENSE'
                              ? 'Recommended: Keep early entry, eliminate the secondary rows.'
                              : 'Recommended: Assign to correct participant and force reload base calculations.'}
                          </p>
                        </div>
                      </div>

                      {/* Resolution actions matching screenshot style */}
                      <div className="border-t border-[rgba(255,79,216,0.08)] pt-3 space-y-2.5">
                        {isResolvedMap[activeAnomaly.id] || activeAnomaly.resolved ? (
                          <div className="bg-[rgba(0,255,136,0.08)] p-2.5 rounded border border-[rgba(0,255,136,0.2)] text-center">
                            <span className="text-[9px] font-bold text-[#00ff88] block" style={{ fontFamily: 'Orbitron, sans-serif' }}>✓ STRATEGY CONFIRMED</span>
                            <span className="text-[8px] text-[#64748b] mt-0.5 block font-medium">Applied action to data model.</span>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="text-[8px] text-[#64748b] font-bold uppercase tracking-wider block mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                Resolution Action
                              </label>
                              <select
                                value={selectedResolution}
                                onChange={(e) => setSelectedResolution(e.target.value)}
                                className="w-full bg-[rgba(5,5,10,0.9)] border border-[rgba(255,79,216,0.15)] rounded px-2 py-1.5 text-[10px] text-[#e2e8f0] focus:outline-none focus:border-[#ff4fd8]"
                              >
                                <option value="">-- Choose resolution strategy --</option>
                                {activeAnomaly.anomaly_type === 'DUPLICATE_EXPENSE' ? (
                                  <>
                                    <option value="keep_first">Keep early entry, delete later duplicate</option>
                                    <option value="keep_both">Keep both records (recurring charge)</option>
                                  </>
                                ) : activeAnomaly.anomaly_type === 'MISSING_PAYER' ? (
                                  <>
                                    <option value="set_default">Assign default reviewer/analyst</option>
                                    <option value="void_expense">Mark row as void / non-reimbursable</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="override">Override detectors and mark valid</option>
                                    <option value="manually_fix">Fix parameters manually in DB</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <button
                              onClick={() => handleConfirmResolution(activeAnomaly.id)}
                              disabled={!selectedResolution}
                              className="w-full py-2 rounded text-xs font-bold text-white transition-all btn-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              style={{ fontFamily: 'Orbitron, sans-serif' }}
                            >
                              CONFIRM RESOLUTION
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#64748b] min-h-[360px]">
                  <Filter size={24} className="mb-2.5 text-[#334155]" />
                  <span>Select an issue from the ledger table</span>
                  <span className="text-[9px] mt-1 text-[#475569]">to perform investigations & resolutions.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
