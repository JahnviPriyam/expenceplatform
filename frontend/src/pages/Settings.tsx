import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  ChevronRight, Check, Moon, Sun, Monitor
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ThemeOption = 'dark' | 'light' | 'system';

interface ToggleProps { checked: boolean; onChange: () => void; color?: string; }
function Toggle({ checked, onChange, color = '#ff4fd8' }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer shrink-0"
      style={{ background: checked ? color : 'rgba(255,255,255,0.08)' }}
    >
      <motion.div
        layout
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  );
}

type IconComponent = React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;

function SectionHeader({ icon: Icon, title }: { icon: IconComponent; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} style={{ color: '#ff4fd8' }} />
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();

  // --- Local UI State (demo-only; no backend persistence needed for assessment) ---
  const [theme, setTheme]                     = useState<ThemeOption>('dark');
  const [emailAlerts, setEmailAlerts]         = useState(true);
  const [anomalyAlerts, setAnomalyAlerts]     = useState(true);
  const [weeklyDigest, setWeeklyDigest]       = useState(false);
  const [twoFactor, setTwoFactor]             = useState(false);
  const [sessionTimeout, setSessionTimeout]   = useState(true);
  const [saved, setSaved]                     = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const themeOptions: { value: ThemeOption; icon: IconComponent; label: string }[] = [
    { value: 'dark',   icon: Moon,    label: 'Dark' },
    { value: 'light',  icon: Sun,     label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(255,79,216,0.1)', border: '1px solid rgba(255,79,216,0.2)' }}>
            <SettingsIcon size={20} style={{ color: '#ff4fd8' }} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
            SETTINGS
          </h1>
        </div>
        <p className="text-sm text-[#475569] ml-14">Manage your account preferences and configurations</p>
      </motion.div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SectionHeader icon={User} title="Profile" />
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #b84dff, #ff4fd8)', color: 'white' }}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <div className="text-base font-semibold text-white">{user?.username ?? 'Analyst'}</div>
            <div className="text-xs text-[#475569]">Expense Analyst · Nexus Platform</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['Display Name', 'Email Address'].map((label) => (
            <div key={label}>
              <label className="block text-xs text-[#475569] mb-1">{label}</label>
              <input
                type="text"
                placeholder={label === 'Display Name' ? user?.username ?? '' : 'user@company.com'}
                readOnly
                className="w-full px-3 py-2 rounded-xl text-sm text-[#64748b] outline-none cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SectionHeader icon={Palette} title="Appearance" />
        <div className="flex gap-3">
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl text-xs transition-all cursor-pointer"
              style={{
                background: theme === value ? 'rgba(255,79,216,0.08)' : 'rgba(255,255,255,0.02)',
                border: theme === value ? '1px solid rgba(255,79,216,0.35)' : '1px solid rgba(255,255,255,0.06)',
                color: theme === value ? '#ff4fd8' : '#64748b',
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
              {theme === value && <Check size={10} style={{ color: '#ff4fd8' }} />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SectionHeader icon={Bell} title="Notifications" />
        <div className="space-y-4">
          {[
            { label: 'Email alerts',      sub: 'Receive import and report summaries via email', checked: emailAlerts,     set: () => setEmailAlerts(!emailAlerts) },
            { label: 'Anomaly alerts',    sub: 'Instant notification when critical anomalies are detected', checked: anomalyAlerts,  set: () => setAnomalyAlerts(!anomalyAlerts) },
            { label: 'Weekly digest',     sub: 'Summary of expense activity every Monday', checked: weeklyDigest,   set: () => setWeeklyDigest(!weeklyDigest) },
          ].map(({ label, sub, checked, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{label}</div>
                <div className="text-xs text-[#475569]">{sub}</div>
              </div>
              <Toggle checked={checked} onChange={set} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SectionHeader icon={Shield} title="Security" />
        <div className="space-y-4">
          {[
            { label: 'Two-factor authentication', sub: 'Add an extra layer of login security',   checked: twoFactor,       set: () => setTwoFactor(!twoFactor),           color: '#00ff88' },
            { label: 'Session timeout',           sub: 'Auto-logout after 30 minutes of inactivity', checked: sessionTimeout, set: () => setSessionTimeout(!sessionTimeout), color: '#00aaff' },
          ].map(({ label, sub, checked, set, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{label}</div>
                <div className="text-xs text-[#475569]">{sub}</div>
              </div>
              <Toggle checked={checked} onChange={set} color={color} />
            </div>
          ))}
        </div>

        {/* Linked Actions */}
        <div className="mt-4 space-y-2">
          {['Change password', 'Manage active sessions'].map((action) => (
            <button
              key={action}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.04)' }}
            >
              {action}
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #b84dff, #ff4fd8)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(255,79,216,0.3)',
          }}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Check size={14} /> Saved!
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Save Preferences
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  );
}
