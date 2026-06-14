import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { Anomaly, Severity } from '../types';

const SEVERITY_CONFIG: Record<Severity, { badge: string; glow: string; color: string; label: string }> = {
  CRITICAL: { badge: 'badge-critical glow-critical', glow: 'glow-critical', color: '#ff3d3d', label: 'CRITICAL' },
  HIGH:     { badge: 'badge-high glow-high',         glow: 'glow-high',     color: '#ff8c00', label: 'HIGH' },
  MEDIUM:   { badge: 'badge-medium glow-medium',     glow: 'glow-medium',   color: '#9d4edd', label: 'MEDIUM' },
  LOW:      { badge: 'badge-low',                    glow: '',              color: '#00aaff', label: 'LOW' },
};

const TYPE_LABELS: Record<string, string> = {
  DUPLICATE_EXPENSE:  'Duplicate Expense',
  MISSING_CURRENCY:   'Missing Currency',
  MISSING_PAYER:      'Missing Payer',
  INVALID_SPLIT:      'Invalid Split',
  UNUSUAL_AMOUNT:     'Unusual Amount',
  FUTURE_DATE:        'Future Date',
  AMBIGUOUS_DATE:     'Ambiguous Date',
  SINGLE_PARTICIPANT: 'Single Participant',
  SETTLEMENT_MIXED:   'Settlement Mixed',
};

interface AnomalyCardProps {
  anomaly: Anomaly;
  onExplain?: (id: number) => void;
  isActive?: boolean;
  index?: number;
}

export default function AnomalyCard({ anomaly, onExplain, isActive, index = 0 }: AnomalyCardProps) {
  const cfg = SEVERITY_CONFIG[anomaly.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`relative rounded-xl p-4 cursor-pointer transition-all duration-300 ${cfg.glow} ${
        isActive ? 'ring-1' : ''
      }`}
      style={{
        background: isActive
          ? `${cfg.color}10`
          : 'rgba(13,15,31,0.8)',
        border: `1px solid ${isActive ? cfg.color + '60' : 'rgba(0,240,255,0.1)'}`,
        outline: isActive ? `1px solid ${cfg.color}` : 'none',
      }}
      onClick={() => onExplain?.(anomaly.id)}
      id={`anomaly-card-${anomaly.id}`}
    >
      {/* Severity indicator strip */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
        style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle size={14} style={{ color: cfg.color, flexShrink: 0 }} />
            <span className="text-xs font-bold truncate" style={{ color: '#e2e8f0' }}>
              {anomaly.expense_description || `Expense #${anomaly.expense}`}
            </span>
          </div>
          <span className={`${cfg.badge} text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0`} style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
            {cfg.label}
          </span>
        </div>

        {/* Type */}
        <div className="text-[11px] font-semibold mb-1.5" style={{ color: cfg.color }}>
          {TYPE_LABELS[anomaly.anomaly_type] || anomaly.anomaly_type}
        </div>

        {/* Truncated description */}
        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: '#64748b' }}>
          {anomaly.description}
        </p>

        {/* Meta + Explain button */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-3 text-[10px]" style={{ color: '#334155' }}>
            {anomaly.expense_amount && (
              <span>{anomaly.expense_currency} {parseFloat(anomaly.expense_amount).toLocaleString()}</span>
            )}
            {anomaly.expense_date && <span>{anomaly.expense_date}</span>}
          </div>
          {onExplain && (
            <button
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
              style={{
                color: isActive ? '#00f0ff' : '#475569',
                background: isActive ? 'rgba(0,240,255,0.1)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,240,255,0.3)' : 'transparent'}`,
              }}
              onClick={(e) => { e.stopPropagation(); onExplain(anomaly.id); }}
              id={`explain-btn-${anomaly.id}`}
            >
              <span style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
                {isActive ? 'EXPLAINING' : 'EXPLAIN AI'}
              </span>
              <ChevronRight size={10} />
            </button>
          )}
        </div>

        {/* Cached AI explanation preview */}
        {anomaly.ai_explanation && !isActive && (
          <div className="mt-2 text-[10px] italic line-clamp-1" style={{ color: '#475569' }}>
            "{anomaly.ai_explanation.slice(0, 80)}..."
          </div>
        )}
      </div>
    </motion.div>
  );
}
