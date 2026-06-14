import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CoreMetrics } from '../types';

// ── Color mapping by core state ──────────────────────────────────────────────
const STATE_COLORS = {
  pristine:  { core: '#00f0ff', ring1: '#0066ff', ring2: '#00f0ff', particle: '#60dfff', glow: '#00f0ff' },
  stable:    { core: '#00c8ff', ring1: '#0052cc', ring2: '#00c8ff', particle: '#40c8ff', glow: '#00c8ff' },
  warning:   { core: '#9d4edd', ring1: '#6b21a8', ring2: '#c084fc', particle: '#c084fc', glow: '#9d4edd' },
  critical:  { core: '#ff3d3d', ring1: '#991b1b', ring2: '#ff6b6b', particle: '#ff8888', glow: '#ff3d3d' },
};

// ── Central Intelligence Sphere ──────────────────────────────────────────────
function CoreSphere({ metrics }: { metrics: CoreMetrics }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const colors = STATE_COLORS[metrics.state];
  const instability = 1 - metrics.integrity_score / 100;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.3;
    meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.1;
    // Breathing scale
    const breathe = 1 + Math.sin(t * 1.5) * 0.04;
    const jitter = instability * Math.sin(t * 15) * 0.015;
    meshRef.current.scale.setScalar(breathe + jitter);
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <MeshDistortMaterial
          color={colors.core}
          emissive={colors.core}
          emissiveIntensity={0.4 + instability * 0.6}
          distort={0.1 + instability * 0.3}
          speed={2 + instability * 4}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow sphere */}
      <mesh scale={0.85}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color={colors.core} transparent opacity={0.15} />
      </mesh>
    </Float>
  );
}

// ── Orbital Ring ─────────────────────────────────────────────────────────────
function OrbitalRing({
  radius, tubeRadius, color, speed, tiltX, tiltZ, instability
}: {
  radius: number; tubeRadius: number; color: string;
  speed: number; tiltX: number; tiltZ: number; instability: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = t * speed;
    ref.current.rotation.x = tiltX + Math.sin(t * 0.5) * instability * 0.3;
    ref.current.rotation.y = tiltZ + Math.cos(t * 0.3) * instability * 0.2;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, tubeRadius, 16, 128]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
        roughness={0.2}
        metalness={0.9}
      />
    </mesh>
  );
}

// ── Orbiting Particles ───────────────────────────────────────────────────────
function OrbitParticles({ count = 120, metrics }: { count?: number; metrics: CoreMetrics }) {
  const ref = useRef<THREE.Points>(null);
  const colors = STATE_COLORS[metrics.state];
  const instability = 1 - metrics.integrity_score / 100;

  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      const height = (Math.random() - 0.5) * 2;
      pos[i * 3]     = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * (0.15 + instability * 0.3);
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05 + instability * 0.04}
        color={colors.particle}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// ── Data Stream Lines ─────────────────────────────────────────────────────────
function DataStreams({ metrics }: { metrics: CoreMetrics }) {
  const ref = useRef<THREE.Group>(null);
  const colors = STATE_COLORS[metrics.state];

  const lines = React.useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const r = 3.5;
      return {
        start: new THREE.Vector3(Math.cos(angle) * r, (Math.random() - 0.5) * 2, Math.sin(angle) * r),
        end: new THREE.Vector3(0, 0, 0),
      };
    });
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <group ref={ref}>
      {lines.map(({ start, end }, i) => {
        const points = [start, end];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={i} object={(() => { const l = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: colors.ring1, transparent: true, opacity: 0.3 })); return l; })()} />
        );
      })}
    </group>
  );
}

// ── Scene Lighting ────────────────────────────────────────────────────────────
function SceneLights({ metrics }: { metrics: CoreMetrics }) {
  const colors = STATE_COLORS[metrics.state];
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight ref={lightRef} position={[0, 0, 0]} color={colors.glow} intensity={2} distance={10} />
      <pointLight position={[5, 5, 5]} color="#0066ff" intensity={0.5} />
      <pointLight position={[-5, -5, 5]} color="#9d4edd" intensity={0.3} />
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
interface QuantumCoreProps {
  metrics: CoreMetrics;
  className?: string;
}

export default function QuantumCore({ metrics, className = '' }: QuantumCoreProps) {
  const colors = STATE_COLORS[metrics.state];
  const instability = 1 - metrics.integrity_score / 100;

  return (
    <div className={`relative ${className}`}>
      {/* Background radial glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow}18 0%, ${colors.glow}08 40%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneLights metrics={metrics} />
        <Stars radius={50} depth={30} count={300} factor={3} saturation={0.5} fade speed={0.5} />

        {/* Core Sphere */}
        <CoreSphere metrics={metrics} />

        {/* Orbital Rings */}
        <OrbitalRing radius={2.2} tubeRadius={0.015} color={colors.ring1} speed={0.4} tiltX={Math.PI / 4}  tiltZ={0}             instability={instability} />
        <OrbitalRing radius={2.6} tubeRadius={0.012} color={colors.ring2} speed={-0.3} tiltX={Math.PI / 6} tiltZ={Math.PI / 5}   instability={instability} />
        <OrbitalRing radius={3.0} tubeRadius={0.008} color={colors.ring1} speed={0.2} tiltX={Math.PI / 3}  tiltZ={-Math.PI / 4}  instability={instability} />

        {/* Particles */}
        <OrbitParticles count={instability > 0.4 ? 200 : 120} metrics={metrics} />

        {/* Data streams */}
        <DataStreams metrics={metrics} />
      </Canvas>

      {/* HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Top: State label */}
        <div className="flex justify-center">
          <CoreStateBadge
            state={metrics.state}
            colors={colors}
            grade={metrics.grade}
          />
        </div>

        {/* Bottom: Metrics bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'ANOMALIES', value: metrics.anomalies_found, unit: '', alert: metrics.anomalies_found > 5 },
            { label: 'CORE STABILITY', value: `${metrics.integrity_score.toFixed(0)}`, unit: '%', alert: metrics.integrity_score < 70 },
            { label: 'DATA INTEGRITY', value: `${metrics.data_integrity.toFixed(0)}`, unit: '%', alert: metrics.data_integrity < 75 },
            { label: 'CONFIDENCE', value: `${metrics.confidence_score.toFixed(0)}`, unit: '%', alert: false },
          ].map(({ label, value, unit, alert }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{
                background: 'rgba(8,9,20,0.85)',
                border: `1px solid ${alert ? 'rgba(157,78,221,0.4)' : 'rgba(0,240,255,0.15)'}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-[9px] font-bold mb-1" style={{ color: '#475569', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>
                {label}
              </div>
              <div className="text-xl font-bold" style={{ color: alert ? '#c084fc' : '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
                {value}<span className="text-xs ml-0.5" style={{ color: '#475569' }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline state badge
function CoreStateBadge({ state, colors, grade }: { state: string; colors: any; grade: string }) {
  const labels: Record<string, string> = {
    pristine: 'AWAITING DATA',
    stable:   'CORE STABLE',
    warning:  'ANOMALIES DETECTED',
    critical: 'CRITICAL INTEGRITY FAILURE',
  };
  return (
    <div
      className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest"
      style={{
        background: `${colors.glow}20`,
        border: `1px solid ${colors.glow}50`,
        color: colors.glow,
        fontFamily: 'Orbitron, sans-serif',
        letterSpacing: '0.15em',
      }}
    >
      {labels[state]} {grade && grade !== 'A' ? `· GRADE ${grade}` : ''}
    </div>
  );
}
