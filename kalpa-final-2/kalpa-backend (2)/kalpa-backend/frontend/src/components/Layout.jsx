import {
  Activity, Bell, Building2, FileText, Home,
  LogOut, Menu, Moon, Package, ScanLine,
  Search, Settings, Sun, User, Users, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import KalpaLogo from './KalpaLogo';
import NotificationBell from './NotificationBell';

/* ── Nav definitions ─────────────────────────────────────── */
const ADMIN_LINKS = [
  { to: '/admin',          label: 'Dashboard', Icon: Activity,  end: true  },
  { to: '/admin/assets',   label: 'Assets',    Icon: Building2, end: false },
  { to: '/admin/scanner',  label: 'Scanner',   Icon: ScanLine,  end: false },
  { to: '/admin/manage',   label: 'Imports',   Icon: Package,   end: false },
  { to: '/admin/users',    label: 'Users',     Icon: Users,     end: false },
  { to: '/admin/audit',    label: 'Audit',     Icon: FileText,  end: false },
  { to: '/admin/settings', label: 'Settings',  Icon: Settings,  end: false },
];

const VIEWER_TABS = [
  { to: '/app',                label: 'Home',     Icon: Home,    end: true  },
  { to: '/app/search',         label: 'Search',   Icon: Search,  end: false },
  { to: '/app/scanner',        label: 'Scan',     Icon: ScanLine, end: false },
  { to: '/app/notifications',  label: 'Alerts',   Icon: Bell,    end: false },
  { to: '/app/profile',        label: 'Profile',  Icon: User,    end: false },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [theme, setTheme]         = useState(() => localStorage.getItem('theme') || 'light');
  const [userMenuOpen, setUMOpen] = useState(false);
  const [drawerOpen, setDrawer]   = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const h = e => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUMOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [userMenuOpen]);

  const initials = user?.email ? user.email[0].toUpperCase() : '?';

  const roleColors = {
    admin:      { bg: 'var(--accent-dim)', color: 'var(--accent)',  border: '1px solid var(--border-hi)' },
    technician: {
      bg:     theme === 'dark' ? 'rgba(6,182,212,0.12)'  : 'rgba(8,145,178,0.10)',
      color:  theme === 'dark' ? '#22d3ee'               : '#0e7490',
      border: theme === 'dark' ? '1px solid rgba(6,182,212,0.25)' : '1px solid rgba(8,145,178,0.22)',
    },
    viewer: { bg: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border)' },
  };
  const roleStyle = roleColors[user?.role] || roleColors.viewer;

  /* ── Shared sub-components ───────────────────────────── */
  const ThemeBtn = () => (
    <button onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-lg transition-colors"
      style={{ background: 'var(--surface-hi)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer' }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );

  const Avatar = ({ size = 6 }) => (
    <div className={`flex h-${size} w-${size} items-center justify-center rounded-full text-xs font-bold flex-shrink-0`}
      style={{ background: 'var(--accent)', color: theme === 'dark' ? '#0d1a14' : '#fff' }}>
      {initials}
    </div>
  );

  const UserMenu = () => (
    user ? (
      <div className="relative" ref={userMenuRef}>
        <button onClick={() => setUMOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all"
          style={{ background: userMenuOpen ? 'var(--surface-hi)' : 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
          aria-haspopup="true" aria-expanded={userMenuOpen}>
          <Avatar />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ color: 'var(--text-3)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden scale-in"
            style={{ background: 'var(--overlay)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', zIndex: 50 }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{user.email}</p>
              <span className="mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: roleStyle.bg, color: roleStyle.color, border: roleStyle.border }}>
                {user.role}
              </span>
            </div>
            <div className="py-1">
              <button onClick={() => { setUMOpen(false); handleLogout(); }}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-left"
                style={{ color: 'var(--text-2)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hi)'; e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    ) : null
  );

  const navCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${isActive ? 'nav-active' : 'nav-inactive'}`;

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen light-canvas"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', transition: 'background-color 0.25s, color 0.25s' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b"
        style={{ background: 'var(--overlay)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 1px 0 var(--border)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-8 py-4">

          {/* Brand */}
          <Link to={isAdmin ? '/admin' : '/app'} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: '#6db891', boxShadow: '0 0 14px rgba(109,184,145,0.22)' }}>
              <KalpaLogo size={16} />
            </div>
            <span className="text-sm font-semibold tracking-wide hidden sm:block" style={{ color: 'var(--text)' }}>
              {isAdmin ? 'Kalpa Admin' : 'Kalpa Power'}
            </span>
          </Link>

          {/* ── ADMIN: mobile controls (< lg) ─────────────── */}
          {isAdmin && (
            <div className="flex items-center gap-2 lg:hidden">
              <NotificationBell />
              <ThemeBtn />
              <button onClick={() => setDrawer(true)}
                className="flex items-center justify-center p-2 rounded-lg"
                style={{ background: 'var(--surface-hi)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
                aria-label="Menu">
                <Menu size={18} />
              </button>
            </div>
          )}

          {/* ── ADMIN: full desktop nav (≥ lg) ─────────────── */}
          {isAdmin && (
            <nav className="hidden lg:flex items-center gap-1">
              {ADMIN_LINKS.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={navCls}
                  style={{ padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                  {label}
                </NavLink>
              ))}
              <div className="flex items-center gap-2 ml-3 pl-3" style={{ borderLeft: '1px solid var(--border)' }}>
                <NotificationBell />
                <ThemeBtn />
                <UserMenu />
              </div>
            </nav>
          )}

          {/* ── VIEWER: mobile controls (< md) ─────────────── */}
          {!isAdmin && (
            <div className="flex items-center gap-2 md:hidden">
              <NotificationBell />
              <ThemeBtn />
              <UserMenu />
            </div>
          )}

          {/* ── VIEWER: desktop nav (≥ md) ─────────────────── */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-5">
              <NavLink to="/app" end className={navCls}>Home</NavLink>
              <NavLink to="/app/search" className={navCls}>Search</NavLink>
              <NavLink to="/app/scanner" className={navCls}>Scan</NavLink>
              <div className="flex items-center gap-2 ml-1 pl-3" style={{ borderLeft: '1px solid var(--border)' }}>
                <NotificationBell />
                <ThemeBtn />
                <UserMenu />
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* ── ADMIN: mobile slide-out drawer ──────────────────── */}
      {isAdmin && drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)' }}
            onClick={() => setDrawer(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 flex flex-col"
            style={{ background: 'var(--overlay)', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 40px rgba(0,0,0,0.25)', animation: 'kSlideR 0.28s cubic-bezier(0.16,1,0.3,1) both' }}>

            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>Admin Navigation</p>
              <button onClick={() => setDrawer(false)}
                className="flex items-center justify-center p-2 rounded-lg"
                style={{ background: 'var(--surface-hi)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {user && (
              <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: 'var(--accent)', color: theme === 'dark' ? '#0d1a14' : '#fff' }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{user.email}</p>
                    <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: roleStyle.bg, color: roleStyle.color, border: roleStyle.border }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {ADMIN_LINKS.map(({ to, label, Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setDrawer(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'font-semibold' : ''}`}
                  style={({ isActive }) => ({ background: isActive ? 'var(--accent-dim)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--text-2)', textDecoration: 'none' })}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="px-3 py-4 space-y-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface-hi)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-left"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────── */}
      <main className={`mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10 fade-in${!isAdmin ? ' pb-24 md:pb-10' : ''}`}>
        {children}
      </main>

      {/* ── VIEWER: fixed bottom tab bar (mobile only) ──────── */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden z-30"
          style={{ background: 'var(--overlay)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingTop: 4, paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }}>
            {VIEWER_TABS.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '6px 10px', borderRadius: 10, textDecoration: 'none', minWidth: 52,
                  color: isActive ? 'var(--accent)' : 'var(--text-3)',
                  transition: 'color 0.15s',
                })}>
                {({ isActive }) => (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, letterSpacing: '0.03em', lineHeight: 1.2 }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
