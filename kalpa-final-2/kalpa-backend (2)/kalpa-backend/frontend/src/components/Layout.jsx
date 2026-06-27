import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const handleLogout = () => { logout(); navigate('/login'); };
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const navLink = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'}`;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)', transition: 'background 0.3s ease, color 0.3s ease' }}>
      {/* Navbar - Premium Minimal */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
              style={{ background: 'var(--accent)' }}
            >
              <img src="/kalpalogo.png" alt="Kalpa Logo" width="16" height="16" />
            </div>
            <span className="text-sm font-semibold text-[var(--text)] tracking-wide">Kalpa Power</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-8">
            <NavLink className={navLink} to="/">Search</NavLink>
            <NavLink className={navLink} to="/scanner">Scan</NavLink>
            <NavLink className={navLink} to="/analytics">Analytics</NavLink>
            {user?.role === 'admin' && <NavLink className={navLink} to="/admin">Admin</NavLink>}
            
            {/* Notifications */}
            <NotificationBell />
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {user && (
              <>
                <div className="w-px h-5" style={{ background: 'var(--border)' }} />
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-8 py-12 fade-in">
        {children}
      </main>
    </div>
  );
}
