import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface HolographicPanelProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  id?: string;
  noPad?: boolean;
  style?: React.CSSProperties;
}

export default function HolographicPanel({
  children, className = '', glowColor = '#ff4fd8', id, noPad = false, style = {}
}: HolographicPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-4, 4]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  }

  return (
    <motion.div
      id={id}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: hovered ? rotateX : 0,
        rotateY: hovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
        ...style
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`glass-panel relative overflow-hidden ${noPad ? '' : 'p-5'} ${className}`}
    >
      {/* Specular highlight on hover */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            background: `radial-gradient(ellipse at ${50}% ${50}%, ${glowColor}08 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none">
        <div className="absolute top-0 left-0 w-3 h-px" style={{ background: glowColor }} />
        <div className="absolute top-0 left-0 h-3 w-px" style={{ background: glowColor }} />
      </div>
      <div className="absolute top-0 right-0 w-3 h-3 pointer-events-none">
        <div className="absolute top-0 right-0 w-3 h-px" style={{ background: glowColor }} />
        <div className="absolute top-0 right-0 h-3 w-px" style={{ background: glowColor }} />
      </div>
      <div className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-3 h-px" style={{ background: glowColor }} />
        <div className="absolute bottom-0 left-0 h-3 w-px" style={{ background: glowColor }} />
      </div>
      <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-3 h-px" style={{ background: glowColor }} />
        <div className="absolute bottom-0 right-0 h-3 w-px" style={{ background: glowColor }} />
      </div>

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
