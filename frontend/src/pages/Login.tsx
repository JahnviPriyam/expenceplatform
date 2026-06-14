import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import { Lock, User, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as THREE from 'three';

// Background orb for login
function LoginOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });
  return (
    <Float speed={1.5} floatIntensity={1.2}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <MeshDistortMaterial
          color="#0066ff"
          emissive="#00f0ff"
          emissiveIntensity={0.3}
          distort={0.25}
          speed={3}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh scale={0.9}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color="#9d4edd" transparent opacity={0.08} />
      </mesh>
    </Float>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [btnHovered, setBtnHovered] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-space grid-bg flex items-center justify-center relative overflow-hidden">
      {/* Full-screen 3D background orb */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }} gl={{ antialias: true, alpha: true }}>
          <Stars radius={80} depth={50} count={500} factor={4} saturation={0.5} fade />
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 0, 5]} color="#00f0ff" intensity={2} />
          <pointLight position={[-5, -5, 3]} color="#9d4edd" intensity={1} />
          <LoginOrb />
        </Canvas>
      </div>

      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #030307 80%)' }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-panel p-8 rounded-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: 'conic-gradient(from 0deg, #00f0ff, #0066ff, #9d4edd, #00f0ff)',
                  padding: '2px',
                }}>
                <div className="w-full h-full rounded-full bg-[#080914] flex items-center justify-center">
                  <Zap size={24} style={{ color: '#00f0ff' }} />
                </div>
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-glow-cyan" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
              EXPENSE NEXUS
            </h1>
            <p className="text-xs mt-1" style={{ color: '#475569' }}>AI-Powered Expense Intelligence Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="text-[10px] font-bold mb-1.5 block" style={{ color: '#94a3b8', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                IDENTIFIER
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,240,255,0.15)',
                    color: '#e2e8f0',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,240,255,0.15)'}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold mb-1.5 block" style={{ color: '#94a3b8', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                ACCESS KEY
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  id="input-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,240,255,0.15)',
                    color: '#e2e8f0',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,240,255,0.15)'}
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff6b6b' }}>
                  <AlertCircle size={12} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              id="btn-login"
              type="submit"
              disabled={loading}
              onHoverStart={() => setBtnHovered(true)}
              onHoverEnd={() => setBtnHovered(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-sm font-bold relative overflow-hidden btn-primary"
              style={{ color: 'white', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}
            >
              {/* Particle burst on hover */}
              {btnHovered && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)' }}
                />
              )}
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Zap size={14} />
                  </motion.div>
                  AUTHENTICATING...
                </span>
              ) : (
                'INITIALIZE SESSION'
              )}
            </motion.button>
          </form>

          <p className="text-center text-[11px] mt-6" style={{ color: '#334155' }}>
            Demo: username <span style={{ color: '#00f0ff' }}>admin</span> / password <span style={{ color: '#00f0ff' }}>admin</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
