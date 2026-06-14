import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CoreMetrics } from '../types';

// ── Color mapping by core state ──────────────────────────────────────────────
// Pristine (Excellent): Purple + White
// Stable (Healthy): Pink + Purple
// Warning/Critical (Poor): Red + Magenta
const STATE_COLORS = {
  pristine:  { core: '#b84dff', ring1: '#ffffff', ring2: '#ff6ec7', particle: '#ffffff', glow: '#b84dff' },
  stable:    { core: '#ff4fd8', ring1: '#b84dff', ring2: '#ff6ec7', particle: '#b84dff', glow: '#ff4fd8' },
  warning:   { core: '#ff3d3d', ring1: '#ff4fd8', ring2: '#ff6ec7', particle: '#ff4fd8', glow: '#ff3d3d' },
  critical:  { core: '#ff3d3d', ring1: '#ff4fd8', ring2: '#ff3d3d', particle: '#ff6ec7', glow: '#ff3d3d' },
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
        {/* Core sphere size increased by 40% (1.2 -> 1.68) */}
        <sphereGeometry args={[1.68, 64, 64]} />
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
        <sphereGeometry args={[1.68, 32, 32]} />
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
      // Scaled up particle orbit bounds
      const radius = 3.2 + Math.random() * 1.8;
      const height = (Math.random() - 0.5) * 2.5;
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
      const r = 4.2;
      return {
        start: new THREE.Vector3(Math.cos(angle) * r, (Math.random() - 0.5) * 2.5, Math.sin(angle) * r),
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
      <pointLight position={[5, 5, 5]} color="#ff6ec7" intensity={0.5} />
      <pointLight position={[-5, -5, 5]} color="#b84dff" intensity={0.3} />
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
        camera={{ position: [0, 0, 8.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneLights metrics={metrics} />
        <Stars radius={50} depth={30} count={300} factor={3} saturation={0.5} fade speed={0.5} />

        {/* Core Sphere */}
        <CoreSphere metrics={metrics} />

        {/* Orbital Rings - Scaled up by 40% */}
        <OrbitalRing radius={3.0} tubeRadius={0.015} color={colors.ring1} speed={0.4} tiltX={Math.PI / 4}  tiltZ={0}             instability={instability} />
        <OrbitalRing radius={3.6} tubeRadius={0.012} color={colors.ring2} speed={-0.3} tiltX={Math.PI / 6} tiltZ={Math.PI / 5}   instability={instability} />
        <OrbitalRing radius={4.2} tubeRadius={0.008} color={colors.ring1} speed={0.2} tiltX={Math.PI / 3}  tiltZ={-Math.PI / 4}  instability={instability} />

        {/* Particles */}
        <OrbitParticles count={instability > 0.4 ? 200 : 120} metrics={metrics} />

        {/* Data streams */}
        <DataStreams metrics={metrics} />
      </Canvas>
    </div>
  );
}
