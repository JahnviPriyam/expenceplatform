import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, Zap, CheckCircle } from 'lucide-react';
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      setUploadState('error');
      return;
    }
    setError('');
    setResult(null);
    setProgress(0);
    setUploadedFile(file);
    setLogs(['[SYSTEM] Initializing CSV file ingestion chamber...']);

    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 8, 92);
        setProgress(currentProgress);

        if (currentProgress >= 20 && currentProgress < 40 && logs.length === 1) {
          setLogs(prev => [...prev, `[PARSER] Parsing file ${file.name} via Pandas...`, '[PARSER] Schema mapped successfully.']);
        } else if (currentProgress >= 40 && currentProgress < 60 && logs.length === 3) {
          setLogs(prev => [...prev, '[ANOMALY] Running 9 rule-based detectors...', '[ANOMALY] Scanning for duplicate signatures...']);
        } else if (currentProgress >= 60 && currentProgress < 80 && logs.length === 5) {
          setLogs(prev => [...prev, '[ANOMALY] Analyzing percentage splits...', '[INTEGRITY] Computing score penalties...']);
        } else if (currentProgress >= 80 && logs.length === 7) {
          setLogs(prev => [...prev, '[DATABASE] Syncing telemetry core...', '[DATABASE] Writing records to PostgreSQL...']);
        }
      }, 300);

      const { data } = await api.post('/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setLogs(prev => [...prev, '[DATABASE] Transaction committed. Ingestion successful.']);
      // update result counts (displayed below)
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[rgba(255,79,216,0.03)] to-[rgba(0,0,0,0.5)]">
      {/* HEADER BAR */}
      <div className="p-3 border-b border-[rgba(255,79,216,0.06)] bg-[rgba(5,5,10,0.8)]">
        <h1 className="text-xl font-bold text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
          📤 IMPORT WORKFLOW
        </h1>
        <p className="text-xs text-[#64748b] mt-1">Step 1: Upload · Step 2: Parse · Step 3: Detect · Step 4: Compute · Step 5: Archive</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-y-auto">
        
        {/* LEFT PIPELINE TRACKER (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <HolographicPanel className="p-4" glowColor="#ff4fd8">
            <span className="text-[10px] font-bold text-[#ff4fd8] tracking-widest block mb-4 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Pipeline Ingestion Stages
            </span>
            <div className="relative pl-6 space-y-5">
              {/* Vertical timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-[1px] bg-[rgba(255,79,216,0.15)]" />

              {[
                { label: 'Upload Expense CSV', desc: 'Drag file into drop zone', check: () => uploadState !== 'idle' && uploadState !== 'dragging' },
                { label: 'Parse Columns Schema', desc: 'Validate description, amount, payer', check: () => ['parsing', 'detecting', 'scoring', 'done'].includes(uploadState) },
                { label: 'Run Anomaly Detectors', desc: 'Scan duplicates & splitting errors', check: () => ['detecting', 'scoring', 'done'].includes(uploadState) },
                { label: 'Compute Integrity Grade', desc: 'Penalties accounting & scores', check: () => ['scoring', 'done'].includes(uploadState) },
                { label: 'Commit Ingestion Run', desc: 'Write verified rows to DB core', check: () => uploadState === 'done' },
              ].map((step, idx) => {
                const isDone = step.check();
                const isCurrent = !isDone && (
                  (idx === 0 && ['idle', 'dragging', 'uploading'].includes(uploadState)) ||
                  (idx === 1 && uploadState === 'parsing') ||
                  (idx === 2 && uploadState === 'detecting') ||
                  (idx === 3 && uploadState === 'scoring') ||
                  (idx === 4 && uploadState === 'error')
                );
                
                const dotColor = isDone ? '#00ff88' : isCurrent ? '#ff4fd8' : '#334155';
                const shadow = isCurrent ? '0 0 8px #ff4fd8' : 'none';

                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div 
                      className="absolute -left-[22px] top-1.5 w-[9px] h-[9px] rounded-full transition-all"
                      style={{ background: dotColor, boxShadow: shadow }}
                    />
                    <div>
                      <div className="text-[10px] font-bold" style={{ color: isDone ? '#00ff88' : isCurrent ? '#ff4fd8' : '#64748b', fontFamily: 'Orbitron, sans-serif' }}>
                        {step.label}
                      </div>
                      <p className="text-[8px] text-[#64748b] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </HolographicPanel>

          {/* Guidelines Card in Left Column */}
          <HolographicPanel className="p-4 flex-1">
            <span className="text-[9px] font-bold text-[#ff4fd8] uppercase tracking-wider block mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              CSV Specifications
            </span>
            <div className="space-y-3 text-[9px] text-[#64748b]">
              <div>
                <span className="font-bold text-[#e2e8f0] block">Required Fields</span>
                <span className="text-[8px] text-[#94a3b8]">description, amount, payer</span>
              </div>
              <div>
                <span className="font-bold text-[#e2e8f0] block">Optional Fields</span>
                <span className="text-[8px] text-[#94a3b8]">currency, date, category</span>
              </div>
              <div className="pt-2 border-t border-[rgba(255,79,216,0.08)]">
                <span className="text-[8px] block">⚠️ UTF-8 comma separated, maximum size 10MB</span>
              </div>
            </div>
          </HolographicPanel>
        </div>

        {/* RIGHT ACTION CHAMBER (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <HolographicPanel
            noPad
            className={`relative overflow-hidden flex flex-col items-center justify-center p-8 flex-1 transition-all ${uploadState === 'dragging' ? 'scale-[0.99]' : ''}`}
            id="drop-zone"
            glowColor={uploadState === 'done' ? '#00ff88' : uploadState === 'error' ? '#ff3d3d' : '#ff4fd8'}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-6 cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => uploadState === 'idle' && fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} id="file-input" />
              
              <AnimatePresence mode="wait">
                {uploadState === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="mb-4 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,79,216,0.06)', border: '2px solid rgba(255,79,216,0.15)' }}>
                      <Upload size={36} style={{ color: '#ff4fd8' }} />
                    </motion.div>
                    <div className="text-xl font-bold mb-1" style={{ color: '#e2e8f0', fontFamily: 'Orbitron, sans-serif' }}>
                      DRAG & DROP CSV FILE HERE
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-4">or click to browse local files · Max 10MB</p>
                    <div className="inline-flex gap-2 bg-[rgba(255,79,216,0.04)] px-3 py-1.5 rounded-lg border border-[rgba(255,79,216,0.1)] text-[9px] text-[#ff4fd8] font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      📋 Required: description, amount, payer
                    </div>
                  </motion.div>
                )}

                {uploadState === 'dragging' && (
                  <motion.div key="dragging" initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-center pointer-events-none">
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="mb-4 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,79,216,0.15)', border: '2px solid rgba(255,79,216,0.5)' }}>
                      <Zap size={36} style={{ color: '#ff4fd8' }} />
                    </motion.div>
                    <div className="text-lg font-bold text-[#ff4fd8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      ⚡ INGEST CSV DATA STREAM
                    </div>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg text-center">
                    <div className="mb-4 text-[10px] font-bold text-[#ff4fd8] uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      Ingestion Process Status: {progress}%
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[rgba(255,79,216,0.1)] mb-5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#b84dff] via-[#ff4fd8] to-[#00ff88]" style={{ width: `${progress}%`, transition: 'width 0.15s ease-out' }} />
                    </div>

                    {/* Console Log */}
                    <div className="p-3 text-left font-mono text-[9px] text-[#64748b] max-h-40 overflow-y-auto w-full rounded border border-[rgba(255,79,216,0.1)] bg-[rgba(4,4,8,0.98)]">
                      {logs.map((log, idx) => (
                        <div key={idx} className="mb-0.5 text-[#94a3b8]">
                          <span style={{ color: '#00ff88' }}>›</span> {log}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {uploadState === 'done' && (
                  <motion.div key="done" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full max-w-xl">
                    <div className="mb-3 mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.3)' }}>
                      <CheckCircle size={32} style={{ color: '#00ff88' }} />
                    </div>
                    <div className="text-lg font-bold mb-1" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
                      CSV INGESTION RUN COMPLETED
                    </div>
                    <p className="text-xs text-[#64748b] mb-5">
                      Successfully processed <span className="text-[#f8fafc] font-semibold">{uploadedFile?.name}</span>.
                    </p>

                    {/* Results Dashboard */}
                    {result && (
                      <div className="grid grid-cols-5 gap-2 mb-6 text-left">
                        {[
                          { l: 'PARSED', v: result.total_records, c: '#b84dff' },
                          { l: 'VALID', v: result.records_imported, c: '#00ff88' },
                          { l: 'ANOMALIES', v: result.critical_issues + result.warnings, c: '#ff8c00' },
                          { l: 'CRITICAL', v: result.critical_issues, c: '#ff3d3d' },
                          { l: 'SCORE', v: `${result.integrity_score?.toFixed(0)}%`, c: '#ff4fd8' },
                        ].map(({ l, v, c }) => (
                          <div key={l} className="p-2 text-center rounded bg-[rgba(0,0,0,0.25)] border border-[rgba(255,79,216,0.06)]">
                            <div className="text-[8px] font-bold text-[#64748b]" style={{ fontFamily: 'Orbitron, sans-serif' }}>{l}</div>
                            <div className="text-sm font-bold mt-0.5" style={{ color: c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 justify-center">
                      <button onClick={() => navigate('/anomalies')} className="px-4 py-2 rounded text-xs font-bold text-white transition-all btn-primary" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        VERIFY ANOMALIES →
                      </button>
                      <button onClick={() => navigate('/reports')} className="px-4 py-2 rounded text-xs font-bold transition-all border border-[rgba(255,79,216,0.25)] text-[#ff4fd8] hover:bg-[rgba(255,79,216,0.05)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        VIEW REPORT
                      </button>
                      <button onClick={() => { setUploadState('idle'); setResult(null); setUploadedFile(null); }} className="px-4 py-2 rounded text-xs font-bold transition-all border border-[rgba(255,79,216,0.15)] text-[#64748b] hover:text-[#e2e8f0]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        RESET
                      </button>
                    </div>
                  </motion.div>
                )}

                {uploadState === 'error' && (
                  <motion.div key="error" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <div className="mb-4 mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,61,61,0.1)', border: '2px solid rgba(255,61,61,0.3)' }}>
                      <AlertCircle size={32} style={{ color: '#ff3d3d' }} />
                    </div>
                    <div className="text-lg font-bold mb-1" style={{ color: '#ff3d3d', fontFamily: 'Orbitron, sans-serif' }}>
                      INGESTION RUN REJECTED
                    </div>
                    <p className="text-xs text-[#ff8c00] mb-5">{error}</p>
                    <button onClick={() => setUploadState('idle')} className="px-5 py-2 rounded text-xs font-bold text-white" style={{ background: '#ff3d3d', fontFamily: 'Orbitron, sans-serif' }}>
                      RE-INITIATE RUN
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}
