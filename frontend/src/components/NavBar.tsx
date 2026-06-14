import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Upload, AlertTriangle,
  FileText, LogOut, Zap, Calendar, Settings, Cpu, Layers, X, Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',   id: 'nav-dashboard' },
  { to: '/import',      icon: Upload,          label: 'Import CSV',  id: 'nav-import' },
  { to: '/anomalies',   icon: AlertTriangle,   label: 'Anomalies',   id: 'nav-anomalies' },
  { to: '/expenses',    icon: Layers,          label: 'Expenses',    id: 'nav-expenses' },
  { to: '/reports',     icon: FileText,        label: 'Reports',     id: 'nav-reports' },
  { to: '/ai-insights', icon: Cpu,             label: 'AI Insights', id: 'nav-insights' },
  { to: '/settings',    icon: Settings,        label: 'Settings',    id: 'nav-settings' },
];

interface NavBarProps {
  isMobile: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isExpanded: boolean;
  isPermanentlyExpanded: boolean;
  setIsPermanentlyExpanded: (val: boolean) => void;
  setIsHovered: (val: boolean) => void;
}

export default function NavBar({
  isMobile,
  isMobileOpen,
  onMobileClose,
  isExpanded,
  isPermanentlyExpanded,
  setIsPermanentlyExpanded,
  setIsHovered
}: NavBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  // Live Clock matching format: 16:22:45 / 14 Jun 2026
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const time = d.toLocaleTimeString('en-GB', { hour12: false });
      const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      setTimeStr(`${time} / ${day}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isFullyExpanded = isMobile ? true : isExpanded;

  // Determine motion.aside props dynamically
  const motionProps = isMobile
    ? {
        initial: { x: -260 },
        animate: { x: isMobileOpen ? 0 : -260 },
        transition: { type: 'tween' as const, duration: 0.3 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.aside
      {...motionProps}
      onMouseEnter={isMobile ? undefined : () => setIsHovered(true)}
      onMouseLeave={isMobile ? undefined : () => setIsHovered(false)}
      className={`fixed left-0 top-0 h-full z-40 flex flex-col ${
        isMobile ? (isMobileOpen ? 'shadow-[0_0_30px_rgba(255,79,216,0.15)] w-[260px]' : 'pointer-events-none w-[260px]') : ''
      }`}
      style={{
        width: isMobile ? '260px' : (isFullyExpanded ? '260px' : '72px'),
        transition: isMobile ? undefined : 'width 250ms ease',
        background: 'rgba(8,9,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,79,216,0.12)',
      }}
    >
      {/* Logo / Header */}
      <div className={`p-4 border-b border-[rgba(255,79,216,0.1)] flex items-center h-16 shrink-0 ${isFullyExpanded ? 'justify-between' : 'justify-center'}`}>
        {isFullyExpanded ? (
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'conic-gradient(from 0deg, #ff4fd8, #b84dff, #ff6ec7, #ff4fd8)',
                padding: '2px',
              }}
            >
              <div className="w-full h-full rounded-full bg-obsidian flex items-center justify-center">
                <Zap size={16} style={{ color: '#ff4fd8' }} />
              </div>
            </motion.div>
            <div className="truncate">
              <div className="font-orbitron text-sm font-bold text-glow-cyan" style={{ color: '#ff4fd8', fontFamily: 'Orbitron, sans-serif' }}>
                EXPENSE
              </div>
              <div className="font-orbitron text-xs" style={{ color: '#b84dff', fontFamily: 'Orbitron, sans-serif' }}>
                NEXUS
              </div>
            </div>
          </div>
        ) : null}

        {/* Toggle Button for Desktop / Close Button for Mobile */}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setIsPermanentlyExpanded(!isPermanentlyExpanded)}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
            title={isPermanentlyExpanded ? "Collapse Sidebar" : "Pin/Expand Sidebar"}
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            title={!isFullyExpanded ? label : undefined}
            className={({ isActive }) =>
              `nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'active text-[#ff4fd8] bg-[rgba(255,79,216,0.08)]'
                  : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[rgba(255,255,255,0.03)]'
              } ${!isFullyExpanded ? 'justify-center px-0' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} style={{ color: isActive ? '#ff4fd8' : undefined }} className="shrink-0" />
                {isFullyExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
                {isActive && isFullyExpanded && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: '#ff4fd8', boxShadow: '0 0 6px #ff4fd8' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status */}
      {isFullyExpanded ? (
        <div className="p-4 mx-4 mb-3 rounded-xl shrink-0 transition-all duration-200" style={{ background: 'rgba(255,79,216,0.04)', border: '1px solid rgba(255,79,216,0.08)' }}>
          <div className="text-[10px] font-medium mb-2" style={{ color: '#ff4fd8', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
            SYSTEM STATUS
          </div>
          {[
            { label: 'AI Engine', status: 'ONLINE', color: '#ff4fd8' },
            { label: 'DB Connection', status: 'LIVE', color: '#00ff88' },
            { label: 'Anomaly Scanner', status: 'ACTIVE', color: '#b84dff' },
          ].map(({ label, status, color }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <span className="text-[11px] text-[#64748b]">{label}</span>
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[10px] font-bold" style={{ color }}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 mb-4 shrink-0 transition-all duration-200">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
            title="System Status: All Systems Operational"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#00ff88]"
              style={{ boxShadow: '0 0 8px #00ff88' }}
            />
          </div>
        </div>
      )}

      {/* User + Logout */}
      <div className="p-4 border-t border-[rgba(255,79,216,0.08)] shrink-0">
        {isFullyExpanded ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #b84dff, #ff4fd8)', color: 'white' }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-[#e2e8f0] truncate">{user?.username}</div>
                <div className="text-[10px] text-[#475569]">Analyst</div>
              </div>
            </div>
            <button
              id="btn-logout"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#64748b] hover:text-[#ff3d3d] hover:bg-[rgba(255,61,61,0.08)] transition-all duration-200 cursor-pointer"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="truncate">Sign Out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 transition-all duration-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shrink-0"
              title={`${user?.username} (Analyst)`}
              style={{ background: 'linear-gradient(135deg, #b84dff, #ff4fd8)', color: 'white' }}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              id="btn-logout"
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-[#64748b] hover:text-[#ff3d3d] hover:bg-[rgba(255,61,61,0.08)] transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              <LogOut size={16} className="shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Clock */}
      <div
        className="p-4 border-t border-[rgba(255,79,216,0.05)] flex items-center justify-center bg-[rgba(0,0,0,0.15)] h-12 shrink-0 cursor-pointer"
        title={timeStr}
      >
        <Calendar size={12} className="text-[#b84dff] shrink-0" />
        {isFullyExpanded && (
          <span className="font-mono text-[10px] text-[#475569] ml-2 truncate">
            {timeStr}
          </span>
        )}
      </div>
    </motion.aside>
  );
}
