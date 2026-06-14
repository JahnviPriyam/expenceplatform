import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import AnomalyCard from '../components/AnomalyCard';
import AIConsole from '../components/AIConsole';
import HolographicPanel from '../components/HolographicPanel';
import { useAnomalies, useAIExplain } from '../hooks/useData';
import type { Severity } from '../types';

const SEVERITIES: (Severity | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SEVERITY_COLORS: Record<string, string> = {
  ALL:      '#00f0ff',
  CRITICAL: '#ff3d3d',
  HIGH:     '#ff8c00',
  MEDIUM:   '#9d4edd',
  LOW:      '#00aaff',
};

export default function Anomalies() {
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL');
  const { anomalies, loading } = useAnomalies(filter === 'ALL' ? undefined : filter);
  const { explanation, loading: aiLoading, activeAnomalyId, explain } = useAIExplain();

  const activeAnomaly = anomalies.find(a => a.id === activeAnomalyId);

  const counts = anomalies.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
          ANOMALY DETECTION CENTER
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
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
              background: filter === sev ? `${SEVERITY_COLORS[sev]}15` : 'rgba(13,15,31,0.7)',
              border: `1px solid ${filter === sev ? SEVERITY_COLORS[sev] + '60' : 'rgba(0,240,255,0.1)'}`,
              boxShadow: filter === sev ? `0 0 20px ${SEVERITY_COLORS[sev]}20` : 'none',
            }}
          >
            <div className="text-xl font-bold" style={{ color: SEVERITY_COLORS[sev], fontFamily: 'Orbitron, sans-serif' }}>
              {counts[sev] ?? 0}
            </div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: filter === sev ? SEVERITY_COLORS[sev] : '#475569', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
              {sev}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* ── Anomaly List ── */}
        <div className="col-span-5">
          <HolographicPanel noPad className="h-full" id="panel-anomaly-list">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,240,255,0.1)]">
              <div className="flex items-center gap-2">
                <Filter size={13} style={{ color: '#00f0ff' }} />
                <span className="text-[10px] font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
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
                      background: filter === s ? `${SEVERITY_COLORS[s] || '#00f0ff'}20` : 'transparent',
                      color: filter === s ? (SEVERITY_COLORS[s] || '#00f0ff') : '#334155',
                      border: filter === s ? `1px solid ${SEVERITY_COLORS[s] || '#00f0ff'}40` : '1px solid transparent',
                      fontFamily: 'Orbitron, sans-serif',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[680px]">
              {loading && (
                <div className="text-center py-10">
                  <div className="text-xs animate-pulse" style={{ color: '#475569' }}>SCANNING...</div>
                </div>
              )}
              {!loading && anomalies.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-xs" style={{ color: '#334155' }}>No anomalies found for this filter</div>
                </div>
              )}
              {anomalies.map((anomaly, i) => (
                <AnomalyCard
                  key={anomaly.id}
                  anomaly={anomaly}
                  onExplain={explain}
                  isActive={anomaly.id === activeAnomalyId}
                  index={i}
                />
              ))}
            </div>
          </HolographicPanel>
        </div>

        {/* ── AI Console ── */}
        <div className="col-span-7 flex flex-col gap-5">
          <AIConsole
            explanation={explanation}
            loading={aiLoading}
            anomalyLabel={activeAnomaly ? `${activeAnomaly.anomaly_type.replace(/_/g, ' ')} · ${activeAnomaly.severity}` : undefined}
          />

          {/* Engineering decision note */}
          <HolographicPanel id="panel-decision" glowColor="#9d4edd">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
                  <span className="text-[10px] font-bold" style={{ color: '#9d4edd' }}>ENG</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold mb-1" style={{ color: '#9d4edd', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                  ENGINEERING DECISION: Duplicate Detection
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#475569' }}>
                  Duplicates are <span style={{ color: '#e2e8f0' }}>flagged for manual review</span> rather than auto-rejected.
                  High-confidence duplicate detection (same amount + date + payer) can still produce false positives —
                  for example, a weekly recurring expense or two people paying the same vendor on the same day.
                  Automated deletion would cause data loss; human confirmation is the safer default.
                </p>
              </div>
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}
