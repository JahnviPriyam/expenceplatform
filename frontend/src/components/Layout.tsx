import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import NavBar from './NavBar';

export default function Layout() {
  const [isPermanentlyExpanded, setIsPermanentlyExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_expanded');
      return saved === 'true';
    }
    return false;
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_expanded', String(isPermanentlyExpanded));
    }
  }, [isPermanentlyExpanded]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer on navigation change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Derived state for desktop sidebar layout
  const isDesktopExpanded = isPermanentlyExpanded || isHovered;

  return (
    <div className="flex min-h-screen bg-space grid-bg relative overflow-x-hidden">
      {/* Mobile Menu Button (Hamburger) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-white shadow-lg hover:bg-[rgba(255,79,216,0.08)] transition-all cursor-pointer"
        style={{
          boxShadow: '0 0 10px rgba(255, 79, 216, 0.15)',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Navigation */}
      <NavBar
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isExpanded={isDesktopExpanded}
        isPermanentlyExpanded={isPermanentlyExpanded}
        setIsPermanentlyExpanded={setIsPermanentlyExpanded}
        setIsHovered={setIsHovered}
      />

      {/* Backdrop overlay for closing sidebar on mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-35"
        />
      )}

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-auto min-h-screen transition-[margin-left,width] duration-[250ms] ease-in-out"
        style={{
          marginLeft: isMobile ? '0px' : (isDesktopExpanded ? '260px' : '72px'),
          width: isMobile ? '100vw' : (isDesktopExpanded ? 'calc(100vw - 260px)' : 'calc(100vw - 72px)'),
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
