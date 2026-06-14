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

  const activeAnomaly = anomalies.find(a => a.id === selectedAnomalyId);
  const activeExpense = activeAnomaly ? expenses.find(e => e.id === activeAnomaly.expense) : null;

  const handleRowClick = (id: number) => {
    setSelectedAnomalyId(id);
    explain(id);
  };

  const counts = anomalies.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen p-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="title-page text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          ANOMALY DETECTION CENTER
        </h1>
        <p className="text-xs mt-1 text-[#64748b]">
          {anomalies.length} anomalies detected · Click any anomaly for AI analysis
        </p>
      </motion.div>

      {/* Severity summary bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(sev => (
          <motion.button
            key={sev}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(filter === sev ? 'ALL' : sev)}
            id={`filter-${sev.toLowerCase()}`}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: filter === sev ? `${SEVERITY_COLORS[sev]}15` : 'rgba(12,12,20,0.85)',
              border: `1px solid ${filter === sev ? SEVERITY_COLORS[sev] + '60' : 'rgba(255,79,216,0.08)'}`,
              boxShadow: filter === sev ? `0 0 10px ${SEVERITY_COLORS[sev]}15` : 'none',
            }}
          >
            <div className="text-xl font-bold" style={{ color: SEVERITY_COLORS[sev], fontFamily: 'Orbitron, sans-serif' }}>
              {counts[sev] ?? 0}
            </div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: filter === sev ? SEVERITY_COLORS[sev] : '#64748b', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
              {sev}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Left Column: Anomaly List (6 cols = 50% width) */}
        <div className="col-span-6">
          <HolographicPanel noPad className="h-full" id="panel-anomaly-list">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,79,216,0.08)]">
              <div className="flex items-center gap-2">
                <Filter size={13} style={{ color: '#ff4fd8' }} />
                <span className="text-[10px] font-bold" style={{ color: '#ff4fd8', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                  ANOMALY LEDGER
                </span>
              </div>
              <div className="flex gap-1">
                {SEVERITIES.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className="px-2 py-0.5 rounded text-[9px] font-bold transition-all"
                    style={{
                      background: filter === s ? `${SEVERITY_COLORS[s] || '#ff4fd8'}20` : 'transparent',
                      color: filter === s ? (SEVERITY_COLORS[s] || '#ff4fd8') : '#475569',
                      border: filter === s ? `1px solid ${SEVERITY_COLORS[s] || '#ff4fd8'}40` : '1px solid transparent',
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
              <div className="overflow-y-auto max-h-[500px] rounded-lg border border-[rgba(255,79,216,0.06)]">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(8,9,20,0.9)', borderBottom: '1px solid rgba(255,79,216,0.08)' }}>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>TYPE</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>SEVERITY</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>ROW</th>
                      <th className="p-3 font-bold text-[#64748b] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>ACTION TAKEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((a) => {
                      const isSelected = selectedAnomalyId === a.id;
                      const sevColor = SEVERITY_COLORS[a.severity] || '#ff4fd8';
                      return (
                        <tr
                          key={a.id}
                          onClick={() => handleRowClick(a.id)}
                          className="hover:bg-[rgba(255,79,216,0.03)] cursor-pointer transition-all border-b border-[rgba(255,79,216,0.03)]"
                          style={{
                            background: isSelected ? `${sevColor}06` : 'transparent',
                            outline: isSelected ? `1px solid ${sevColor}30` : 'none',
                          }}
                          id={`anomaly-row-${a.id}`}
                        >
                          <td className="p-3 font-medium text-[#e2e8f0]">
                            {TYPE_LABELS[a.anomaly_type] || a.anomaly_type}
                          </td>
                          <td className="p-3">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{
                                background: `${sevColor}15`,
                                border: `1px solid ${sevColor}40`,
                                color: sevColor,
                                fontFamily: 'Orbitron, sans-serif',
                                letterSpacing: '0.05em'
                              }}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[#94a3b8] font-bold">
                            #{a.expense}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px]" style={{ color: a.resolved ? '#00ff88' : '#e2e8f0' }}>
                              {a.resolved ? '✓ Resolved' : '⚠ Flagged for review'}
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

        {/* Center Column: Selected Anomaly Details (3 cols) */}
        <div className="col-span-3 flex flex-col">
          <HolographicPanel className="flex-1 flex flex-col h-full p-4 justify-between" id="panel-anomaly-details">
            <div>
              <div className="title-section text-[#ff4fd8] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                RECORD ATTRIBUTES
              </div>
              
              {activeAnomaly ? (
                <div className="space-y-4">
                  {/* Expense Title */}
                  <div>
                    <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Description</span>
                    <div className="text-sm font-bold text-[#f8fafc] mt-0.5">{activeAnomaly.expense_description}</div>
                  </div>

                  {/* Expense Amount */}
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Amount</span>
                      <div className="text-lg font-bold text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {activeAnomaly.expense_currency} {parseFloat(activeAnomaly.expense_amount).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Date</span>
                      <div className="text-xs text-[#94a3b8] font-bold mt-1">{activeAnomaly.expense_date}</div>
                    </div>
                  </div>

                  {/* Payer and Category */}
                  {activeExpense && (
                    <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,79,216,0.08)] pt-3">
                      <div>
                        <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Payer</span>
                        <div className="text-xs font-semibold text-[#e2e8f0] mt-0.5">{activeExpense.payer || '(missing)'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Category</span>
                        <div className="text-xs font-semibold text-[#e2e8f0] mt-0.5">{activeExpense.category || '(uncategorised)'}</div>
                      </div>
                    </div>
                  )}

                  {/* Split Allocations */}
                  {activeExpense && activeExpense.participants?.length > 0 && (
                    <div className="border-t border-[rgba(255,79,216,0.08)] pt-3">
                      <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-1.5 block" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Split Shares ({activeExpense.split_type})
                      </span>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {activeExpense.participants.map((p: Participant, idx: number) => (
                          <div key={idx} className="flex justify-between text-[10px] bg-[rgba(0,0,0,0.2)] px-2 py-1 rounded">
                            <span className="text-[#94a3b8]">{p.name}</span>
                            <span className="text-[#e2e8f0] font-bold">
                              {p.share_pct !== null ? `${p.share_pct}%` : `${activeAnomaly.expense_currency} ${p.share_amount}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detector Explanation */}
                  <div className="border-t border-[rgba(255,79,216,0.08)] pt-3">
                    <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Detector Note</span>
                    <p className="text-[11px] text-[#64748b] leading-relaxed mt-1">{activeAnomaly.description}</p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-[#475569]">
                  Select an issue from the ledger to load record attributes.
                </div>
              )}
            </div>
            
            {activeAnomaly && (
              <button
                onClick={() => explain(activeAnomaly.id)}
                className="w-full mt-4 py-2 rounded-xl text-xs font-bold btn-primary"
                style={{ color: 'white', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}
              >
                RE-RUN AI AUDIT
              </button>
            )}
          </HolographicPanel>
        </div>

        {/* Right Column: AI Explanation Console (3 cols) */}
        <div className="col-span-3 flex flex-col">
          <AIConsole
            explanation={explanation}
            loading={aiLoading}
            anomalyLabel={activeAnomaly ? `${TYPE_LABELS[activeAnomaly.anomaly_type]} · ${activeAnomaly.severity}` : undefined}
          />
        </div>
      </div>

      {/* Bottom Row: Engineering Decision Panel (full width) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <HolographicPanel id="panel-decision-refactored" glowColor="#b84dff" className="p-5">
          <div className="title-section text-[#b84dff] mb-3" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
            ENGINEERING DECISION: Duplicate & Anomaly Processing Strategy
          </div>
          <div className="grid grid-cols-4 gap-6 text-[11px]">
            <div>
              <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block mb-1">Decision</span>
              <p className="text-[#64748b] leading-relaxed">
                Duplicates are flagged for manual confirm rather than auto-deleted. Anomaly threshold limits are audit-only.
              </p>
            </div>
            <div>
              <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block mb-1">Reason</span>
              <p className="text-[#64748b] leading-relaxed">
                Legitimate overlapping expenses exist (recurring SaaS, separate orders from same vendor, back-to-back client travel).
              </p>
            </div>
            <div>
              <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block mb-1">Tradeoffs</span>
              <p className="text-[#64748b] leading-relaxed">
                Requires one additional click by the reviewer, but eliminates the risk of silent data loss during file ingestion.
              </p>
            </div>
            <div>
              <span className="font-bold text-[#e2e8f0] uppercase tracking-wider block mb-1">Chosen Action</span>
              <p className="text-[#64748b] leading-relaxed">
                Isolate potential duplicates, render clear explanations with 5-transaction contexts, and provide a single-click resolution.
              </p>
            </div>
          </div>
        </HolographicPanel>
      </motion.div>
    </div>
  );
}
