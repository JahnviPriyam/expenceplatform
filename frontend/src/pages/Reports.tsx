import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle, Calendar } from 'lucide-react';
import HolographicPanel from '../components/HolographicPanel';
import { useReports } from '../hooks/useData';
import api from '../lib/api';

const GRADE_COLORS: Record<string, string> = {
  A: '#00ff88', 'B+': '#00f0ff', B: '#00c8ff',
  C: '#ff8c00', D: '#ff4400', F: '#ff3d3d',
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
  const { reports, loading } = useReports();

  return (
    <div className="min-h-screen p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
          IMPORT REPORTS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
          {reports.length} report{reports.length !== 1 ? 's' : ''} generated · Download as PDF
        </p>
      </motion.div>

      {loading && (
        <div className="text-center py-20">
          <div className="text-xs animate-pulse" style={{ color: '#475569', fontFamily: 'Orbitron, sans-serif' }}>LOADING REPORTS...</div>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <HolographicPanel id="panel-no-reports" className="text-center py-16">
          <FileText size={40} className="mx-auto mb-4" style={{ color: '#1e293b' }} />
          <div className="text-sm" style={{ color: '#334155' }}>No reports yet. Import a CSV to generate your first report.</div>
        </HolographicPanel>
      )}

      <div className="space-y-5">
        {reports.map((report, i) => {
          const gradeColor = GRADE_COLORS[report.grade] || '#00f0ff';
          const breakdown = report.anomaly_breakdown || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <HolographicPanel id={`report-card-${report.id}`}>
                <div className="flex items-start justify-between gap-6">

                  {/* Left: file info + grade */}
                  <div className="flex items-center gap-5">
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                        style={{ background: `${gradeColor}10`, border: `2px solid ${gradeColor}40`, color: gradeColor, fontFamily: 'Orbitron, sans-serif' }}>
                        {report.grade}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={13} style={{ color: '#00f0ff' }} />
                        <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{report.filename}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#475569' }}>
                        <Calendar size={10} />
                        {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Center: metrics */}
                  <div className="flex gap-6 text-center">
                    {[
                      { label: 'Imported',  value: report.records_imported, color: '#00f0ff' },
                      { label: 'Total',     value: report.total_records,    color: '#0066ff' },
                      { label: 'Warnings',  value: report.warnings,         color: '#ff8c00' },
                      { label: 'Critical',  value: report.critical_issues,  color: '#ff3d3d' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="text-xl font-bold" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
                        <div className="text-[10px]" style={{ color: '#475569' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Right: integrity + PDF */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: gradeColor, fontFamily: 'Orbitron, sans-serif' }}>
                        {report.integrity_score?.toFixed(0)}
                      </div>
                      <div className="text-[10px]" style={{ color: '#475569' }}>/ 100 Score</div>
                    </div>
                    <button
                      id={`btn-pdf-${report.id}`}
                      onClick={() => downloadPDF(report.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold btn-primary"
                      style={{ color: 'white', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em' }}
                    >
                      <Download size={13} />
                      PDF
                    </button>
                  </div>
                </div>

                {/* Anomaly breakdown */}
                <div className="mt-4 pt-4 border-t border-[rgba(0,240,255,0.08)]">
                  <div className="flex gap-4 mb-3">
                    {([['CRITICAL', '#ff3d3d'], ['HIGH', '#ff8c00'], ['MEDIUM', '#9d4edd'], ['LOW', '#00aaff']] as [string, string][]).map(([sev, color]) => (
                      <div key={sev} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-[10px]" style={{ color: '#475569' }}>{sev}</span>
                        <span className="text-[10px] font-bold" style={{ color }}>{breakdown[sev as keyof typeof breakdown] ?? 0}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions taken */}
                  {report.actions_taken?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {report.actions_taken.map((action, j) => (
                        <div key={j} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.12)' }}>
                          <CheckCircle size={9} style={{ color: '#00f0ff' }} />
                          <span className="text-[10px]" style={{ color: '#64748b' }}>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </HolographicPanel>
            </motion.div>
          );
        })}
      </div>

      {/* Integrity Score Formula Reference */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6">
        <HolographicPanel id="panel-score-formula" glowColor="#9d4edd">
          <div className="text-[10px] font-bold mb-4" style={{ color: '#9d4edd', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
            INTEGRITY SCORE FORMULA
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs mb-3" style={{ color: '#475569' }}>
                Starts at <span style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>100</span>. Each anomaly type deducts points up to a capped maximum.
              </div>
              <div className="space-y-1.5">
                {[
                  ['Duplicate Expense', '-10 pts', 30, '#ff3d3d'],
                  ['Missing Payer',     '-15 pts', 25, '#ff8c00'],
                  ['Invalid Split',     '-20 pts', 30, '#ff8c00'],
                  ['Missing Currency',  '-5 pts',  20, '#9d4edd'],
                  ['Ambiguous Date',    '-10 pts', 15, '#9d4edd'],
                  ['Unusual Amount',    '-3 pts',  15, '#00aaff'],
                ].map(([rule, pts, cap, color]) => (
                  <div key={rule as string} className="flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color as string }} />
                    <span className="flex-1" style={{ color: '#64748b' }}>{rule}</span>
                    <span className="font-bold" style={{ color: color as string }}>{pts}</span>
                    <span style={{ color: '#334155' }}>max {cap}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs mb-3" style={{ color: '#475569' }}>Grade thresholds:</div>
              <div className="space-y-1.5">
                {[
                  ['A',  '90 – 100', '#00ff88'],
                  ['B+', '80 – 89',  '#00f0ff'],
                  ['B',  '70 – 79',  '#00c8ff'],
                  ['C',  '60 – 69',  '#ff8c00'],
                  ['D',  '50 – 59',  '#ff4400'],
                  ['F',  '< 50',     '#ff3d3d'],
                ].map(([grade, range, color]) => (
                  <div key={grade as string} className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold text-xs" style={{ color: color as string, fontFamily: 'Orbitron, sans-serif' }}>{grade}</span>
                    <span className="text-[11px]" style={{ color: '#475569' }}>{range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </HolographicPanel>
      </motion.div>
    </div>
  );
}
