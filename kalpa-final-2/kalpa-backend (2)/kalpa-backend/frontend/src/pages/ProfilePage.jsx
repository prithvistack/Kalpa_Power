import { LogOut, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.email ? user.email[0].toUpperCase() : '?';
  const name     = user?.email?.split('@')[0] || 'User';

  return (
    <div className="fade-in max-w-lg mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)', margin: 0 }}>Profile</h1>

      {/* Avatar card */}
      <div className="card p-6" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--accent)', color: theme === 'dark' ? '#0d1a14' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, flexShrink: 0,
          boxShadow: '0 0 20px var(--accent-dim)',
        }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{name}</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3, wordBreak: 'break-all' }}>{user?.email}</p>
          <span style={{
            display: 'inline-block', marginTop: 8,
            fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 999,
            background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border)',
            textTransform: 'capitalize', letterSpacing: '0.03em',
          }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <p className="label" style={{ marginBottom: 12 }}>Preferences</p>
        <div className="card" style={{ overflow: 'hidden' }}>
          <button onClick={toggleTheme}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text)', fontSize: 14, fontWeight: 500, textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hi)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {theme === 'light' ? <Moon size={17} style={{ color: 'var(--text-3)' }} /> : <Sun size={17} style={{ color: 'var(--text-3)' }} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{theme === 'light' ? 'Off' : 'On'}</span>
          </button>
        </div>
      </div>

      {/* About */}
      <div>
        <p className="label" style={{ marginBottom: 12 }}>About</p>
        <div className="card p-5" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Platform</p>
            <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Kalpa Power</p>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Portal</p>
            <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Field Viewer</p>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Version</p>
            <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>5.0</p>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={handleLogout}
        className="btn btn-danger"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
