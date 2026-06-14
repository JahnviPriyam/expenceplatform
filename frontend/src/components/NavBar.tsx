import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Upload, AlertTriangle,
  FileText, LogOut, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/import',    icon: Upload,          label: 'Import CSV', id: 'nav-import' },
  { to: '/anomalies', icon: AlertTriangle,   label: 'Anomalies',  id: 'nav-anomalies' },
  { to: '/reports',   icon: FileText,        label: 'Reports',    id: 'nav-reports' },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col"
      style={{
        background: 'rgba(8,9,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(0,240,255,0.12)',
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(0,240,255,0.1)]">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'conic-gradient(from 0deg, #00f0ff, #0066ff, #9d4edd, #00f0ff)',
              padding: '2px',
            }}
          >
            <div className="w-full h-full rounded-full bg-obsidian flex items-center justify-center">
              <Zap size={16} style={{ color: '#00f0ff' }} />
            </div>
          </motion.div>
          <div>
            <div className="font-orbitron text-sm font-bold text-glow-cyan" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
              EXPENSE
            </div>
            <div className="font-orbitron text-xs" style={{ color: '#0066ff', fontFamily: 'Orbitron, sans-serif' }}>
              NEXUS
            </div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            className={({ isActive }) =>
              `nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'active text-[#00f0ff] bg-[rgba(0,240,255,0.08)]'
                  : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[rgba(255,255,255,0.03)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} style={{ color: isActive ? '#00f0ff' : undefined }} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status */}
      <div className="p-4 mx-4 mb-4 rounded-xl" style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.08)' }}>
        <div className="text-[10px] font-medium mb-2" style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
          SYSTEM STATUS
        </div>
        {[
          { label: 'AI Engine', status: 'ONLINE', color: '#00f0ff' },
          { label: 'DB Connection', status: 'LIVE', color: '#00ff88' },
          { label: 'Anomaly Scanner', status: 'ACTIVE', color: '#9d4edd' },
        ].map(({ label, status, color }) => (
          <div key={label} className="flex items-center justify-between py-1">
            <span className="text-[11px] text-[#64748b]">{label}</span>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              <span className="text-[10px] font-bold" style={{ color }}>{status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User + Logout */}
      <div className="p-4 border-t border-[rgba(0,240,255,0.08)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #0066ff, #9d4edd)', color: 'white' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-xs font-medium text-[#e2e8f0]">{user?.username}</div>
            <div className="text-[10px] text-[#475569]">Analyst</div>
          </div>
        </div>
        <button
          id="btn-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#64748b] hover:text-[#ff6b6b] hover:bg-[rgba(255,61,61,0.08)] transition-all duration-200"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
