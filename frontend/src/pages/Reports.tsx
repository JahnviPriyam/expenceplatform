import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, ChevronRight, Shield, RefreshCw } from 'lucide-react';
import HolographicPanel from '../components/HolographicPanel';
import { useReports, useAnomalies } from '../hooks/useData';
import api from '../lib/api';

const GRADE_COLORS: Record<string, string> = {
  A: '#00ff88', 'B+': '#ff4fd8', B: '#b84dff',
  C: '#ff8c00', D: '#ff4400', F: '#ff3d3d',
};

const PENALTIES = {
  DUPLICATE_EXPENSE:   { label: 'Duplicate Expense Signature', points: 10, max: 30, severity: 'CRITICAL' },
  MISSING_PAYER:       { label: 'Missing Payer Identity',      points: 15, max: 25, severity: 'HIGH' },
  INVALID_SPLIT:       { label: 'Invalid Participant Splits',  points: 20, max: 30, severity: 'HIGH' },
  MISSING_CURRENCY:    { label: 'Missing Base Currency',       points: 5,  max: 20, severity: 'HIGH' },
  AMBIGUOUS_DATE:      { label: 'Ambiguous Date Format',       points: 10, max: 15, severity: 'MEDIUM' },
  UNUSUAL_AMOUNT:      { label: 'Unusual Amount Deviation',    points: 3,  max: 15, severity: 'MEDIUM' },
  FUTURE_DATE:         { label: 'Future Transaction Date',     points: 10, max: 10, severity: 'MEDIUM' },
  SINGLE_PARTICIPANT:  { label: 'Single Participant Split',    points: 2,  max: 10, severity: 'LOW' },
  SETTLEMENT_MIXED:    { label: 'Settlement Mixed in Expense', points: 5,  max: 10, severity: 'LOW' },
};

async function downloadPDF(reportId: number) {
  try {
    const res = await api.get(`/reports/${reportId}/pdf/`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_report_${reportId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('PDF download failed', e);
  }
}

export default function Reports() {
  const { reports, loading, refetch } = useReports();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Set initial selected report when reports list changes
  useEffect(() => {
    if (reports.length > 0 && selectedReportId === null) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0] || null;

  // Fetch anomalies for the active report to build dynamic penalty table & AI insights
  const { anomalies, loading: loadingAnomalies } = useAnomalies(undefined, activeReport?.id);

  // Group anomalies by type to calculate actual penalty scores
  const anomalyCounts = anomalies.reduce((acc, a) => {
    acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate dynamic AI Insights based on anomaly profile
  const generateAIInsights = () => {
    if (!activeReport) return [];
    const insights: string[] = [];

    if (activeReport.critical_issues > 0) {
      insights.push(
        `CRITICAL RISK: Detected ${activeReport.critical_issues} duplicate transactions. Re-evaluate upstream source ledger generation to prevent double-billing and data inflation.`
      );
    }
    
    if (anomalyCounts['MISSING_PAYER'] > 0) {
      insights.push(
        `PAYER DEFICIT: Found ${anomalyCounts['MISSING_PAYER']} entries missing an owner/payer. Direct employee matching requires field verification or fallback configurations.`
      );
    }

    if (anomalyCounts['INVALID_SPLIT'] > 0) {
      insights.push(
        `SPLIT ANOMALY: ${anomalyCounts['INVALID_SPLIT']} transaction splits did not aggregate to 100% or equal sums. Validate participant distributions prior to processing.`
      );
    }

    if (anomalyCounts['MISSING_CURRENCY'] > 0) {
      insights.push(
        `CURRENCY EXPOSURE: ${anomalyCounts['MISSING_CURRENCY']} transactions lacked base currencies. Although automatically inferred, verify that regional source formats are configured correctly.`
      );
    }

    if (anomalyCounts['AMBIGUOUS_DATE'] > 0 || anomalyCounts['FUTURE_DATE'] > 0) {
      insights.push(
        `TEMPORAL COMPLIANCE: Found chronological outliers. Ensure international date formatting constraints are applied consistently to CSV file headers.`
      );
    }

    if (insights.length === 0) {
      insights.push(
        "INTEGRITY RATING EXCELLENT: CSV data conforms fully to Nexus specifications. No structural modifications or adjustments recommended."
      );
    } else {
      insights.push(
        "RECOMMENDATION: Enforce schema-level constraints on raw exports to improve automated ingestion reliability."
      );
    }

    return insights;
  };

  const aiInsights = generateAIInsights();
  const gradeColor = activeReport ? (GRADE_COLORS[activeReport.grade] || '#ff4fd8') : '#ff4fd8';

  // Get status string based on score
  const getIntegrityStatus = (score: number) => {
    if (score >= 90) return { label: 'PRISTINE SYSTEM', color: '#00ff88' };
    if (score >= 70) return { label: 'STABLE CORE', color: '#ff4fd8' };
    if (score >= 50) return { label: 'COMPROMISED SCHEMA', color: '#ff8c00' };
    return { label: 'CRITICAL TELEMETRY', color: '#ff3d3d' };
  };

  const integrityStatus = activeReport ? getIntegrityStatus(activeReport.integrity_score) : { label: 'N/A', color: '#64748b' };

  return (
    <div className="min-h-screen p-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="title-page text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            AUDIT & INTEGRITY REPORTS
          </h1>
          <p className="text-xs mt-1 text-[#64748b]">
            Review data quality grades, rule deductions, and AI system audit recommendations
          </p>
        </div>
        
        {/* Horizontal Selection Menu in Header */}
        {!loading && reports.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              INGESTION RUN:
            </span>
            <select
              value={selectedReportId || ''}
              onChange={(e) => setSelectedReportId(Number(e.target.value))}
              className="bg-[rgba(8,8,16,0.95)] border border-[rgba(255,79,216,0.15)] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] focus:outline-none focus:border-[#ff4fd8] cursor-pointer"
            >
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.filename} (Grade {report.grade} · Score {report.integrity_score.toFixed(0)})
                </option>
              ))}
            </select>
            <button 
              onClick={() => refetch()} 
              className="p-2 border border-[rgba(255,79,216,0.2)] rounded-lg text-[#ff4fd8] hover:bg-[rgba(255,79,216,0.05)] transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              RELOAD
            </button>
          </div>
        )}
      </motion.div>

      {loading && (
        <div className="text-center py-20">
          <div className="text-xs animate-pulse text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            DECRYPTING DATA LEDGER...
          </div>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <HolographicPanel id="panel-no-reports" className="text-center py-16">
          <FileText size={40} className="mx-auto mb-4 text-[#475569]" />
          <div className="text-sm font-bold text-[#e2e8f0]" style={{ fontFamily: 'Orbitron, sans-serif' }}>NO INTEGRITY REPORTS FOUND</div>
          <p className="text-xs mt-2 text-[#475569] max-w-sm mx-auto">
            Please navigate to the CSV Import module and ingest an expense file to compile telemetry reports.
          </p>
        </HolographicPanel>
      )}

      {!loading && reports.length > 0 && activeReport && (
        <div className="w-full max-w-7xl mx-auto space-y-5">
          
          {/* Executive Header Card - Full Width */}
          <HolographicPanel id="report-details-header" glowColor={gradeColor} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-3xl font-extrabold"
                    style={{
                      background: `radial-gradient(circle, ${gradeColor}18 0%, ${gradeColor}05 100%)`,
                      border: `2px solid ${gradeColor}60`,
                      boxShadow: `0 0 15px ${gradeColor}20`,
                      color: gradeColor,
                      fontFamily: 'Orbitron, sans-serif'
                    }}
                  >
                    {activeReport.grade}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[#64748b] tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    EXECUTIVE SUMMARY TELEMETRY
                  </div>
                  <h2 className="text-lg font-bold text-[#f8fafc] mt-0.5 truncate max-w-lg">{activeReport.filename}</h2>
                  
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="text-lg font-extrabold text-[#f8fafc]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {activeReport.integrity_score.toFixed(1)} <span className="text-xs text-[#64748b] font-normal">/ 100 GRADE INDEX</span>
                    </div>
                    <div className="h-4 w-[1px] bg-[rgba(255,79,216,0.15)]" />
                    <div className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: `${integrityStatus.color}15`, color: integrityStatus.color, fontFamily: 'Orbitron, sans-serif' }}>
                      {integrityStatus.label}
                    </div>
                  </div>
                </div>
              </div>

              <button
                id={`btn-pdf-detail-${activeReport.id}`}
                onClick={() => downloadPDF(activeReport.id)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold btn-primary text-white cursor-pointer"
                style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}
              >
                <Download size={14} />
                DOWNLOAD PDF REPORT
              </button>
            </div>
          </HolographicPanel>

          {/* Quick Metrics Bar - 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'INGESTION RUN DATE', value: new Date(activeReport.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), color: '#64748b' },
              { label: 'RECORDS PARSED', value: activeReport.total_records, color: '#0066ff' },
              { label: 'VALIDATED ENTRIES', value: activeReport.records_imported, color: '#00ff88' },
              { label: 'FLAGGED ANOMALIES', value: activeReport.warnings + activeReport.critical_issues, color: activeReport.critical_issues > 0 ? '#ff3d3d' : '#ff8c00' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3.5 text-center rounded-xl bg-[rgba(13,15,31,0.8)] border border-[rgba(255,79,216,0.08)]">
                <div className="text-[8px] font-bold text-[#64748b] tracking-wider mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</div>
                <div className="text-sm font-semibold truncate text-[#e2e8f0]" style={{ color: color !== '#64748b' ? color : undefined }}>{value}</div>
              </div>
            ))}
          </div>

          {/* UPPER SPLIT SECTION: Charts & AI Findings (6 cols / 6 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Severity Breakdown Progress Meters */}
            <HolographicPanel id="report-anomalies-severity" className="p-4" glowColor="#ff4fd8">
              <div className="title-section text-[#ff4fd8] mb-3.5" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px' }}>
                Anomaly Severity Distribution
              </div>
              <div className="space-y-3.5">
                {([
                  { key: 'CRITICAL', label: 'CRITICAL SEVERITY', color: '#ff3d3d' },
                  { key: 'HIGH', label: 'HIGH SEVERITY', color: '#ff8c00' },
                  { key: 'MEDIUM', label: 'MEDIUM SEVERITY', color: '#9d4edd' },
                  { key: 'LOW', label: 'LOW SEVERITY', color: '#b84dff' },
                ] as const).map(({ key, label, color }) => {
                  const count = activeReport.anomaly_breakdown?.[key] ?? 0;
                  const totalAnom = activeReport.warnings + activeReport.critical_issues;
                  const percentage = totalAnom > 0 ? (count / totalAnom) * 100 : 0;
                  
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-[#64748b]" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</span>
                        <span className="font-extrabold font-mono" style={{ color }}>{count}</span>
                      </div>
                      <div className="w-full h-1 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </HolographicPanel>

            {/* AI Recommendations Panel */}
            <HolographicPanel id="report-ai-recommendations" glowColor="#9d4edd" className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3.5">
                  <Shield size={14} className="text-[#9d4edd]" />
                  <div className="title-section text-[#9d4edd] font-bold" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px' }}>
                    AI System Audit Insights
                  </div>
                </div>
                <div className="space-y-2.5">
                  {aiInsights.map((insight, j) => (
                    <div key={j} className="flex gap-2 text-[10px] leading-relaxed text-[#94a3b8]">
                      <div className="font-bold text-[#9d4edd] font-mono shrink-0">0{j+1}</div>
                      <div>{insight}</div>
                    </div>
                  ))}
                </div>
              </div>
            </HolographicPanel>
          </div>

          {/* LOWER SECTION: Penalty Accounting Ledger (12 cols) */}
          <HolographicPanel id="report-penalty-breakdown" className="p-4" glowColor="#b84dff">
            <div className="title-section text-[#ff4fd8] mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px' }}>
              Integrity Index Penalty Deductions
            </div>
            
            {loadingAnomalies ? (
              <div className="text-center py-6 text-[10px] text-[#64748b]">ANALYZING SCHEMA RULES...</div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-[rgba(255,79,216,0.08)] bg-[rgba(0,0,0,0.15)]">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr style={{ background: 'rgba(255,79,216,0.04)', borderBottom: '1px solid rgba(255,79,216,0.08)' }}>
                      <th className="px-3 py-2.5 font-bold text-[#ff4fd8] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>RULE DESCRIPTION</th>
                      <th className="px-3 py-2.5 font-bold text-[#ff4fd8] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>SEVERITY</th>
                      <th className="px-3 py-2.5 font-bold text-[#ff4fd8] tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>BASE PENALTY</th>
                      <th className="px-3 py-2.5 font-bold text-[#ff4fd8] tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>OCCURRENCES</th>
                      <th className="px-3 py-2.5 font-bold text-[#ff4fd8] tracking-wider text-right" style={{ fontFamily: 'Orbitron, sans-serif' }}>TOTAL DEDUCTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PENALTIES).map(([type, rule]) => {
                      const count = anomalyCounts[type] || 0;
                      const totalDeducted = Math.min(count * rule.points, rule.max);
                      const severityColor = rule.severity === 'CRITICAL' ? '#ff3d3d' : rule.severity === 'HIGH' ? '#ff8c00' : rule.severity === 'MEDIUM' ? '#9d4edd' : '#b84dff';
                      
                      return (
                        <tr key={type} className="border-t border-[rgba(255,79,216,0.04)] hover:bg-[rgba(255,79,216,0.01)] transition-colors">
                          <td className="px-3 py-2 text-[#e2e8f0] font-medium">{rule.label}</td>
                          <td className="px-3 py-2">
                            <span className="text-[8px] font-bold" style={{ color: severityColor }}>{rule.severity}</span>
                          </td>
                          <td className="px-3 py-2 text-center text-[#64748b] font-mono">-{rule.points} pts</td>
                          <td className="px-3 py-2 text-center font-bold text-[#e2e8f0]">{count}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold" style={{ color: totalDeducted > 0 ? '#ff3d3d' : '#475569' }}>
                            {totalDeducted > 0 ? `-${totalDeducted} pts` : '0 pts'}
                            {totalDeducted === rule.max && <span className="text-[8px] text-[#ff8c00] ml-1 font-sans font-bold">(CAPPED)</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </HolographicPanel>

          {/* Ingestion Audit Log - Full Width */}
          <HolographicPanel id="report-actions-taken" className="p-4">
            <div className="title-section text-[#ff4fd8] mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px' }}>
              Ingestion Run Audit Log
            </div>
            <div className="space-y-1.5 text-[10px] text-[#94a3b8] max-h-40 overflow-y-auto">
              {activeReport.actions_taken?.length > 0 ? (
                activeReport.actions_taken.map((action, j) => (
                  <div key={j} className="flex items-center gap-2 py-1 px-2.5 rounded bg-[rgba(255,79,216,0.02)] border border-[rgba(255,79,216,0.04)]">
                    <ChevronRight size={10} className="text-[#ff4fd8] shrink-0" />
                    <span>{action}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[10px] text-[#475569]">
                  No manual or automated actions logged.
                </div>
              )}
            </div>
          </HolographicPanel>

        </div>
      )}
    </div>
  );
}
