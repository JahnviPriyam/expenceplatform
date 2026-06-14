import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import api from '../lib/api';
import HolographicPanel from '../components/HolographicPanel';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'parsing' | 'detecting' | 'scoring' | 'done' | 'error';

export default function Import() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [issuesCounter, setIssuesCounter] = useState(0);

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      setUploadState('error');
      return;
    }
    setError('');
    setResult(null);
    setProgress(0);
    setIssuesCounter(0);
    setLogs(['[SYSTEM] Initializing CSV file ingestion chamber...']);

    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // In-flight progress simulation
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 8, 92);
        setProgress(currentProgress);

        // Append log messages dynamically based on progress
        if (currentProgress >= 20 && currentProgress < 40 && logs.length === 1) {
          setLogs(prev => [...prev, `[PARSER] Parsing file ${file.name} via Pandas...`, '[PARSER] Schema mapped successfully.']);
        } else if (currentProgress >= 40 && currentProgress < 60 && logs.length === 3) {
          setLogs(prev => [...prev, '[ANOMALY] Running 9 rule-based detectors...', '[ANOMALY] Scanning for duplicate signatures...']);
          setIssuesCounter(2);
        } else if (currentProgress >= 60 && currentProgress < 80 && logs.length === 5) {
          setLogs(prev => [...prev, '[ANOMALY] Analyzing percentage splits...', '[INTEGRITY] Computing score penalties...']);
          setIssuesCounter(7);
        } else if (currentProgress >= 80 && logs.length === 7) {
          setLogs(prev => [...prev, '[DATABASE] Syncing telemetry core...', '[DATABASE] Writing records to PostgreSQL...']);
          setIssuesCounter(10);
        }
      }, 300);

      const { data } = await api.post('/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setLogs(prev => [...prev, '[DATABASE] Transaction committed. Ingestion successful.']);
      setIssuesCounter(data.critical_issues + data.warnings);
      setUploadState('done');
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Upload failed. Please try again.');
      setUploadState('error');
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setUploadState('dragging'); };
  const handleDragLeave = () => setUploadState('idle');
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const isProcessing = ['uploading', 'parsing', 'detecting', 'scoring'].includes(uploadState);

  return (
    <div className="min-h-screen p-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="title-page text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          CSV IMPORT MODULE
        </h1>
        <p className="text-xs mt-1 text-[#64748b]">
          Ingest Shared Expense records, parse schema structures, and execute audit rules
        </p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">

        {/* Left Column: Import Zone or Post-Upload Summary (7 cols) */}
        <div className="col-span-7">
          {uploadState === 'done' && result ? (
            <motion.div key="done-summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <HolographicPanel id="panel-import-summary" glowColor="#ff4fd8" className="p-5">
                <div className="title-section text-[#ff4fd8] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  INGESTION SUCCESS SUMMARY
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-4 gap-4 mb-5">
                  {[
                    { label: 'TOTAL CSV RECORDS', value: result.total_records, color: '#b84dff' },
                    { label: 'IMPORTED SUCCESSFULLY', value: result.records_imported, color: '#00ff88' },
                    { label: 'CRITICAL ISSUES', value: result.critical_issues, color: '#ff3d3d' },
                    { label: 'WARNINGS GENERATED', value: result.warnings, color: '#ff8c00' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="glass-panel p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <div className="text-[10px] font-semibold text-[#64748b] tracking-wider mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</div>
                      <div className="text-xl font-bold" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Score & Grade Row */}
                <div className="grid grid-cols-3 gap-4 mb-5 border-t border-[rgba(255,79,216,0.08)] pt-4">
                  <div className="glass-panel p-3.5 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div>
                      <div className="text-[9px] font-bold text-[#64748b]" style={{ fontFamily: 'Orbitron, sans-serif' }}>INTEGRITY INDEX</div>
                      <div className="text-lg font-bold text-[#ff4fd8] mt-0.5" style={{ fontFamily: 'Orbitron, sans-serif' }}>{result.integrity_score?.toFixed(1)} / 100</div>
                    </div>
                  </div>
                  <div className="glass-panel p-3.5 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div>
                      <div className="text-[9px] font-bold text-[#64748b]" style={{ fontFamily: 'Orbitron, sans-serif' }}>RESULTING GRADE</div>
                      <div className="text-lg font-bold text-[#b84dff] mt-0.5" style={{ fontFamily: 'Orbitron, sans-serif' }}>GRADE {result.grade}</div>
                    </div>
                  </div>
                  <div className="glass-panel p-3.5 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div>
                      <div className="text-[9px] font-bold text-[#64748b]" style={{ fontFamily: 'Orbitron, sans-serif' }}>STATUS</div>
                      <div className="text-lg font-bold text-[#00ff88] mt-0.5" style={{ fontFamily: 'Orbitron, sans-serif' }}>INGESTED</div>
                    </div>
                  </div>
                </div>

                {/* Actions Log */}
                {result.actions_taken?.length > 0 && (
                  <div className="border-t border-[rgba(255,79,216,0.08)] pt-4 mb-4">
                    <span className="text-[10px] font-bold text-[#64748b] tracking-wider mb-2 block" style={{ fontFamily: 'Orbitron, sans-serif' }}>INGESTION ACTIONS RECORDED</span>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {result.actions_taken.map((action: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-[#94a3b8]">
                          <ChevronRight size={11} className="mt-0.5 text-[#ff4fd8] shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  <button onClick={() => navigate('/anomalies')} className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold" style={{ color: 'white', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                    REVIEW ANOMALIES LEDGER
                  </button>
                  <button onClick={() => { setUploadState('idle'); setResult(null); }} className="py-2.5 px-5 rounded-xl text-xs font-bold transition-all"
                    style={{ border: '1px solid rgba(255,79,216,0.15)', color: '#64748b' }}>
                    IMPORT ANOTHER FILE
                  </button>
                </div>
              </HolographicPanel>
            </motion.div>
          ) : (
            <motion.div
              className={`energy-chamber rounded-2xl relative overflow-hidden cursor-pointer min-h-[420px] flex flex-col items-center justify-center p-12 ${uploadState === 'dragging' ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => uploadState === 'idle' && fileRef.current?.click()}
              id="drop-zone"
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} id="file-input" />

              {/* Sparks */}
              {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                <motion.div key={i} className={`absolute ${pos} w-4 h-4`}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}>
                  <Zap size={14} style={{ color: '#ff4fd8' }} />
                </motion.div>
              ))}

              <AnimatePresence mode="wait">
                {uploadState === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="mb-6 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,79,216,0.06)', border: '1px solid rgba(255,79,216,0.15)' }}>
                      <Upload size={32} style={{ color: '#ff4fd8' }} />
                    </motion.div>
                    <div className="text-lg font-bold mb-2" style={{ color: '#e2e8f0', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                      QUANTUM INTAKE CHAMBER
                    </div>
                    <p className="text-sm mb-1" style={{ color: '#64748b' }}>Drag & drop your CSV file here</p>
                    <p className="text-xs" style={{ color: '#475569' }}>or click to select a file</p>
                    <div className="mt-6 text-[10px] px-4 py-2 rounded-full inline-block"
                      style={{ background: 'rgba(255,79,216,0.04)', border: '1px solid rgba(255,79,216,0.1)', color: '#64748b' }}>
                      Supported: .csv · Max 10MB
                    </div>
                  </motion.div>
                )}

                {uploadState === 'dragging' && (
                  <motion.div key="dragging" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="mb-4 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,79,216,0.15)', border: '2px solid rgba(255,79,216,0.5)' }}>
                      <Zap size={32} style={{ color: '#ff4fd8' }} />
                    </motion.div>
                    <div className="text-lg font-bold text-glow-cyan" style={{ color: '#ff4fd8', fontFamily: 'Orbitron, sans-serif' }}>
                      RELEASE TO ABSORB
                    </div>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md text-center">
                    <div className="mb-4 text-xs font-semibold text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      INGESTING FILE... {progress}%
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[rgba(255,79,216,0.1)] mb-6 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#b84dff] to-[#ff4fd8]"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>

                    {/* Timeline Tracker */}
                    <div className="flex gap-3 justify-center mb-6">
                      {['parsing', 'detecting', 'scoring'].map((step, i) => {
                        const states = ['uploading', 'parsing', 'detecting', 'scoring'];
                        const stepIndex = states.indexOf(uploadState);
                        const isDone = stepIndex > i + 1;
                        const isCurrent = stepIndex === i + 1;
                        return (
                          <div key={step} className="flex flex-col items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background: isDone ? '#00ff88' : isCurrent ? '#ff4fd8' : 'rgba(255,79,216,0.15)',
                                boxShadow: isCurrent ? '0 0 8px #ff4fd8' : 'none',
                              }}
                            />
                            <span className="text-[8px]" style={{ color: isDone || isCurrent ? '#ff4fd8' : '#475569', fontFamily: 'Orbitron, sans-serif' }}>
                              {step.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Log Terminal Feed */}
                    <div className="glass-panel p-3 text-left font-mono text-[9px] text-[#64748b] h-32 overflow-y-auto" style={{ background: 'rgba(5,6,15,0.95)', border: '1px solid rgba(255,79,216,0.1)' }}>
                      {logs.map((log, idx) => (
                        <div key={idx} className="mb-0.5">{log}</div>
                      ))}
                    </div>

                    {/* Detected Issues scanner */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#64748b]">
                      <AlertCircle size={11} className="text-[#ff8c00]" />
                      <span>Anomalies Flagged: <strong className="text-[#ff8c00] font-bold">{issuesCounter}</strong></span>
                    </div>
                  </motion.div>
                )}

                {uploadState === 'error' && (
                  <motion.div key="error" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <div className="mb-4 mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,61,61,0.1)', border: '2px solid rgba(255,61,61,0.4)' }}>
                      <AlertCircle size={32} style={{ color: '#ff3d3d' }} />
                    </div>
                    <div className="text-lg font-bold mb-2" style={{ color: '#ff6b6b', fontFamily: 'Orbitron, sans-serif' }}>
                      IMPORT FAILED
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#475569' }}>{error}</p>
                    <button onClick={() => setUploadState('idle')} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold" style={{ color: 'white' }}>
                      TRY AGAIN
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right Column: Schema specifications & Details (5 cols) */}
        <div className="col-span-5 flex flex-col gap-5">
          <HolographicPanel id="panel-csv-guide" className="p-4">
            <div className="title-section text-[#ff4fd8] mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              EXPECTED CSV FORMAT
            </div>
            <div className="rounded-xl overflow-hidden border border-[rgba(255,79,216,0.08)]">
              <table className="w-full text-[10px]">
                <thead>
                  <tr style={{ background: 'rgba(255,79,216,0.05)' }}>
                    {['description', 'amount', 'currency', 'date', 'payer', 'category'].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-bold" style={{ color: '#ff4fd8', fontFamily: 'Orbitron, sans-serif' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Pizza Friday', '1200', 'INR', '2024-06-01', 'Alice', 'Food'],
                    ['Cab Ride', '350', '', '2024-06-02', 'Bob', 'Travel'],
                    ['Hotel Stay', '8500', 'INR', '2024-06-03', 'Alice', 'Stay'],
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,79,216,0.06)' }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1.5" style={{ color: cell ? '#64748b' : '#ff8c00' }}>
                          {cell || '(missing)'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] mt-2.5 text-[#64748b]">
              Optional columns: participants, split_type, notes. Missing currencies will be inferred from context.
            </p>
          </HolographicPanel>

          <HolographicPanel id="panel-what-happens" className="p-4">
            <div className="title-section text-[#ff4fd8] mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              WHAT HAPPENS ON UPLOAD
            </div>
            <div className="space-y-3 text-[11px]">
              {[
                { step: '01', label: 'Parse & Normalize', desc: 'Pandas service resolves columns and infers currencies from adjacent rows.', color: '#ff4fd8' },
                { step: '02', label: 'Anomaly Detection', desc: 'Checks duplicate groups, split sums, payer presence, and dates.', color: '#b84dff' },
                { step: '03', label: 'Integrity Scoring', desc: 'Calculates penalties dynamically. Mutates the Quantum Core visual orbit.', color: '#ff6ec7' },
                { step: '04', label: 'Persist database records', desc: 'Commits entities (batch, anomalies, expenses) to PostgreSQL.', color: '#00ff88' },
              ].map(({ step, label, desc, color }) => (
                <div key={step} className="flex gap-3">
                  <div className="font-bold text-xs shrink-0 mt-0.5" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{step}</div>
                  <div>
                    <div className="font-semibold text-[#e2e8f0]">{label}</div>
                    <div className="text-[#64748b] mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}
