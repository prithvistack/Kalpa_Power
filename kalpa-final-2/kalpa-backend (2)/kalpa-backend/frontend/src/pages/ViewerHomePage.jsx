import { Bell, ScanLine, Search, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ViewerHomePage() {
  const { user } = useAuthStore();
  const name = user?.email?.split('@')[0] || 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="fade-in max-w-lg mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Welcome */}
      <div style={{ paddingTop: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
          {greeting}
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>{name}</h1>
        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)' }}>Kalpa Power · Field Portal</p>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="label" style={{ marginBottom: 14 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Link to="/app/scanner" style={{ textDecoration: 'none' }}>
            <div className="card card-hover p-6 text-center" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanLine size={26} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Scan QR</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Identify an asset</p>
              </div>
            </div>
          </Link>

          <Link to="/app/search" style={{ textDecoration: 'none' }}>
            <div className="card card-hover p-6 text-center" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--purple-dim)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={26} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Search</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Find any asset</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="label" style={{ marginBottom: 4 }}>Information</p>

        <div className="card p-4" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warn)', opacity: 0.12, flexShrink: 0 }} />
          <div style={{ position: 'absolute', marginLeft: 0 }}>
            <Wrench size={18} style={{ color: 'var(--warn)', position: 'relative', top: 9, left: 9 }} />
          </div>
          <div style={{ marginLeft: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: '1.3' }}>Maintenance Alerts</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, lineHeight: '1.5' }}>
              Assets requiring service will show alerts in your notifications. Check the bell icon regularly.
            </p>
          </div>
        </div>

        <div className="card p-4" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0, width: 36, height: 36 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'var(--accent-dim)' }} />
            <ShieldCheck size={18} style={{ color: 'var(--accent)', position: 'absolute', top: 9, left: 9 }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: '1.3' }}>Warranty Status</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, lineHeight: '1.5' }}>
              Search for any asset to view its current warranty status, maintenance history, and product details.
            </p>
          </div>
        </div>

        <div className="card p-4" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0, width: 36, height: 36 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'var(--purple-dim)' }} />
            <Bell size={18} style={{ color: 'var(--purple)', position: 'absolute', top: 9, left: 9 }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: '1.3' }}>Notifications</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, lineHeight: '1.5' }}>
              Warranty expiry and maintenance reminders are sent automatically. Tap Alerts to view all.
            </p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--surface)', flexShrink: 0 }}>
          {user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{user?.email}</p>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999, background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
