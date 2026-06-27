import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Subtle gradient accent */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: 'radial-gradient(ellipse 1000px 500px at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 max-w-2xl px-6 py-20 text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: 'var(--accent)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-5xl md:text-6xl font-light text-[var(--text)] tracking-tight">
          Kalpa Power
        </h1>

        <p className="mt-6 text-xl text-[var(--text-2)] leading-relaxed">
          Smart solar asset intelligence and lifecycle tracking for industrial power systems
        </p>

        <p className="mt-8 text-base text-[var(--text-3)] max-w-lg mx-auto">
          Manage your solar infrastructure with precision. Track maintenance, monitor performance, and optimize asset lifecycle across all your installations.
        </p>

        {/* CTA */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <button
                onClick={() => navigate('/')}
                className="btn btn-primary px-8"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="btn btn-outline px-8"
              >
                View Analytics
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary px-8"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-outline px-8"
              >
                Create Account
              </button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 border-t border-[var(--border)]">
          <div>
            <div className="text-3xl mb-3">🔍</div>
            <p className="font-medium text-[var(--text)] mb-2">Smart Search</p>
            <p className="text-sm text-[var(--text-3)]">Find and filter assets by type, location, and status</p>
          </div>
          <div>
            <div className="text-3xl mb-3">📱</div>
            <p className="font-medium text-[var(--text)] mb-2">QR Scanning</p>
            <p className="text-sm text-[var(--text-3)]">Instant asset lookup with QR code camera scanning</p>
          </div>
          <div>
            <div className="text-3xl mb-3">📊</div>
            <p className="font-medium text-[var(--text)] mb-2">Analytics</p>
            <p className="text-sm text-[var(--text-3)]">Real-time insights into asset performance and health</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 py-6 text-center text-xs text-[var(--text-3)] border-t border-[var(--border)]">
        <p>Product Intelligence & Lifecycle Tracking for Solar Assets</p>
      </div>
    </div>
  );
}
