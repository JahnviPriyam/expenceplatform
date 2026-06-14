import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import api from '../lib/api';
import HolographicPanel from '../components/HolographicPanel';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'parsing' | 'detecting' | 'scoring' | 'done' | 'error';

const UPLOAD_STEPS = ['parsing', 'detecting', 'scoring', 'done'] as const;

const STEP_LABELS: Record<string, string> = {
  parsing:   'PARSING CSV DATA...',
  detecting: 'DETECTING ANOMALIES...',
  scoring:   'COMPUTING INTEGRITY SCORE...',
  done:      'IMPORT COMPLETE',
};

export default function Import() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      setUploadState('error');
      return;
    }
    setFileName(file.name);
    setError('');
    setResult(null);

    // Simulate sequential step animations
    const steps: UploadState[] = ['uploading', 'parsing', 'detecting', 'scoring'];
    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Animate steps while the request is in-flight
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        stepIdx = Math.min(stepIdx + 1, 2);
        setCurrentStep(stepIdx);
        setUploadState(steps[stepIdx + 1]);
      }, 900);

      const { data } = await api.post('/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(stepInterval);
      setCurrentStep(3);
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
          CSV IMPORT MODULE
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
          Upload your expense CSV · Anomaly detection runs automatically
        </p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">

        {/* ── Energy Chamber ── */}
        <div className="col-span-7">
          <motion.div
            className={`energy-chamber rounded-2xl relative overflow-hidden cursor-pointer min-h-[420px] flex flex-col items-center justify-center p-12 ${uploadState === 'dragging' ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => uploadState === 'idle' && fileRef.current?.click()}
            id="drop-zone"
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} id="file-input" />

            {/* Corner energy sparks */}
            {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
              <motion.div key={i} className={`absolute ${pos} w-4 h-4`}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}>
                <Zap size={14} style={{ color: '#00f0ff' }} />
              </motion.div>
            ))}

            <AnimatePresence mode="wait">
              {uploadState === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-6 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
                    <Upload size={36} style={{ color: '#00f0ff' }} />
                  </motion.div>
                  <div className="text-lg font-bold mb-2" style={{ color: '#e2e8f0', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                    QUANTUM INTAKE CHAMBER
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#475569' }}>Drag & drop your CSV file here</p>
                  <p className="text-xs" style={{ color: '#334155' }}>or click to select a file</p>
                  <div className="mt-6 text-[10px] px-4 py-2 rounded-full inline-block"
                    style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', color: '#475569' }}>
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
                    style={{ background: 'rgba(0,240,255,0.15)', border: '2px solid rgba(0,240,255,0.5)' }}>
                    <Zap size={36} style={{ color: '#00f0ff' }} />
                  </motion.div>
                  <div className="text-lg font-bold text-glow-cyan" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
                    RELEASE TO ABSORB
                  </div>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md text-center">
                  {/* File absorption animation */}
                  <motion.div
                    animate={{ scale: [1, 0.1], opacity: [1, 0], y: [0, 40] }}
                    transition={{ duration: 0.8, ease: 'easeIn' }}
                    className="mb-6 mx-auto w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)' }}>
                    <FileText size={28} style={{ color: '#00f0ff' }} />
                  </motion.div>

                  {/* Core flash */}
                  <motion.div
                    animate={{ scale: [0, 3, 0], opacity: [0, 0.6, 0] }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)' }}
                  />

                  <div className="mb-6 font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                    {STEP_LABELS[uploadState] || 'PROCESSING...'}
                  </div>

                  {/* Holographic scan line */}
                  <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)', boxShadow: '0 0 10px #00f0ff' }}
                  />

                  {/* Step progress */}
                  <div className="flex gap-3 justify-center">
                    {UPLOAD_STEPS.map((step, i) => (
                      <div key={step} className="flex flex-col items-center gap-1">
                        <motion.div
                          animate={{ scale: i === currentStep ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.5, repeat: i === currentStep ? Infinity : 0 }}
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: i < currentStep ? '#00ff88' : i === currentStep ? '#00f0ff' : 'rgba(0,240,255,0.15)',
                            boxShadow: i === currentStep ? '0 0 8px #00f0ff' : 'none',
                          }}
                        />
                        <span className="text-[8px]" style={{ color: i <= currentStep ? '#00f0ff' : '#334155', fontFamily: 'Orbitron, sans-serif' }}>
                          {step.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {uploadState === 'done' && result && (
                <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="mb-4 mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.4)' }}>
                    <CheckCircle size={36} style={{ color: '#00ff88' }} />
                  </motion.div>
                  <div className="text-lg font-bold mb-1" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
                    IMPORT SUCCESSFUL
                  </div>
                  <p className="text-sm" style={{ color: '#475569' }}>{fileName}</p>
                </motion.div>
              )}

              {uploadState === 'error' && (
                <motion.div key="error" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className="mb-4 mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,61,61,0.1)', border: '2px solid rgba(255,61,61,0.4)' }}>
                    <AlertCircle size={36} style={{ color: '#ff3d3d' }} />
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
        </div>

        {/* ── Results & Guide ── */}
        <div className="col-span-5 flex flex-col gap-5">
          {result ? (
            <>
              <HolographicPanel id="panel-result" glowColor="#00ff88">
                <div className="text-[10px] font-bold mb-4" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                  IMPORT SUMMARY
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Records Imported', value: result.records_imported, color: '#00f0ff' },
                    { label: 'Total Records',     value: result.total_records,   color: '#0066ff' },
                    { label: 'Critical Issues',   value: result.critical_issues, color: '#ff3d3d' },
                    { label: 'Warnings',          value: result.warnings,        color: '#ff8c00' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.08)' }}>
                      <div className="text-xs font-bold mb-0.5" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
                      <div className="text-[10px]" style={{ color: '#475569' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Integrity score */}
                <div className="rounded-xl p-3 mb-4 flex items-center gap-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.08)' }}>
                  <div>
                    <div className="text-[10px] mb-0.5" style={{ color: '#475569' }}>Integrity Score</div>
                    <div className="text-2xl font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
                      {result.integrity_score?.toFixed(0)} / 100
                    </div>
                  </div>
                  <div className="text-3xl font-bold ml-auto" style={{ color: '#9d4edd', fontFamily: 'Orbitron, sans-serif' }}>
                    {result.grade}
                  </div>
                </div>

                {/* Actions taken */}
                {result.actions_taken?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold mb-2" style={{ color: '#475569', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>ACTIONS TAKEN</div>
                    {result.actions_taken.map((action: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: '#00f0ff' }} />
                        <span className="text-[11px]" style={{ color: '#64748b' }}>{action}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate('/anomalies')} className="flex-1 btn-primary py-2 rounded-xl text-xs font-bold" style={{ color: 'white', fontFamily: 'Orbitron, sans-serif' }}>
                    VIEW ANOMALIES
                  </button>
                  <button onClick={() => { setUploadState('idle'); setResult(null); }} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ border: '1px solid rgba(0,240,255,0.2)', color: '#475569' }}>
                    IMPORT ANOTHER
                  </button>
                </div>
              </HolographicPanel>
            </>
          ) : (
            <>
              <HolographicPanel id="panel-csv-guide">
                <div className="text-[10px] font-bold mb-4" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                  EXPECTED CSV FORMAT
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,240,255,0.1)' }}>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ background: 'rgba(0,240,255,0.06)' }}>
                        {['description', 'amount', 'currency', 'date', 'payer', 'category'].map(h => (
                          <th key={h} className="px-2 py-2 text-left font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
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
                        <tr key={i} style={{ borderTop: '1px solid rgba(0,240,255,0.06)' }}>
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
                <p className="text-[10px] mt-3" style={{ color: '#334155' }}>
                  Optional columns: participants, split_type, notes. Missing currencies will be inferred from context.
                </p>
              </HolographicPanel>

              <HolographicPanel id="panel-what-happens">
                <div className="text-[10px] font-bold mb-4" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                  WHAT HAPPENS ON UPLOAD
                </div>
                <div className="space-y-3">
                  {[
                    { step: '01', label: 'Parse & Normalize', desc: 'Pandas reads your CSV, normalizes columns, infers missing currencies from context.', color: '#00f0ff' },
                    { step: '02', label: 'Anomaly Detection', desc: 'Rule engine checks for duplicates, missing fields, invalid splits, unusual amounts.', color: '#9d4edd' },
                    { step: '03', label: 'Integrity Scoring', desc: 'Score computed from penalty table. Drives the Quantum Core visual state.', color: '#0066ff' },
                    { step: '04', label: 'Persist to Database', desc: 'All records, anomalies, and import report saved to PostgreSQL.', color: '#00ff88' },
                  ].map(({ step, label, desc, color }) => (
                    <div key={step} className="flex gap-3">
                      <div className="text-xs font-bold shrink-0 mt-0.5" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{step}</div>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{label}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#475569' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </HolographicPanel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
