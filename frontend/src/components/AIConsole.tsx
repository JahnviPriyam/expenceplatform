import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, Cpu, Zap } from 'lucide-react';

interface AIConsoleProps {
  explanation: string;
  loading: boolean;
  anomalyLabel?: string;
}

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text, speed]);

  return displayed;
}

// Neural network background canvas
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const nodes = Array.from({ length: 20 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));

    let animId: number;
    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(0,240,255,${0.15 * (1 - dist / 120)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(0,240,255,0.4)';
        ctx!.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />;
}

export default function AIConsole({ explanation, loading, anomalyLabel }: AIConsoleProps) {
  const displayed = useTypewriter(explanation, 14);
  const isEmpty = !explanation && !loading;

  return (
    <div className="relative rounded-2xl overflow-hidden h-full min-h-[280px]"
      style={{
        background: 'rgba(6,7,18,0.95)',
        border: '1px solid rgba(0,240,255,0.15)',
        boxShadow: '0 0 40px rgba(0,102,255,0.1)',
      }}
    >
      {/* Neural network background */}
      <NeuralCanvas />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-[rgba(0,240,255,0.1)]">
        <div className="flex items-center gap-2">
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}
          >
            <Cpu size={16} style={{ color: '#00f0ff' }} />
          </motion.div>
          <span className="text-xs font-bold" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.12em' }}>
            AI INTELLIGENCE ENGINE
          </span>
        </div>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" style={{ color: '#9d4edd' }} />
            <span className="text-[10px]" style={{ color: '#9d4edd' }}>GEMINI PROCESSING...</span>
          </motion.div>
        )}
        {explanation && !loading && (
          <div className="ml-auto flex items-center gap-1.5">
            <Zap size={10} style={{ color: '#00ff88' }} />
            <span className="text-[10px]" style={{ color: '#00ff88' }}>ANALYSIS COMPLETE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 p-5">
        <AnimatePresence mode="wait">
          {isEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <Bot size={36} style={{ color: '#1e293b' }} className="mb-3" />
              <p className="text-sm" style={{ color: '#334155' }}>
                Select an anomaly to generate an AI explanation
              </p>
              <p className="text-[11px] mt-1" style={{ color: '#1e293b' }}>
                Powered by Google Gemini 1.5 Flash
              </p>
            </motion.div>
          )}

          {loading && !explanation && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8"
            >
              {[60, 80, 45, 70].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-3 rounded-full mb-3"
                  style={{ width: `${w}%`, background: 'rgba(0,240,255,0.08)' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </motion.div>
          )}

          {(displayed || explanation) && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
              {anomalyLabel && (
                <div className="text-[10px] font-bold mb-3 px-2 py-1 rounded-lg inline-block"
                  style={{ background: 'rgba(157,78,221,0.15)', color: '#c084fc', border: '1px solid rgba(157,78,221,0.3)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                  {anomalyLabel}
                </div>
              )}
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #0066ff, #00f0ff)' }}>
                    <Bot size={12} style={{ color: 'white' }} />
                  </div>
                </div>
                <p
                  className="text-sm leading-7 typewriter-cursor"
                  style={{ color: '#cbd5e1', fontFamily: 'Inter, sans-serif' }}
                >
                  {displayed || explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
