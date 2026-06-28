import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, getApiErrorMessage } from '../api/api';
import KalpaLogo from '../components/KalpaLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      // Only show generic errors (validation, network) — never reveal email existence
      const msg = getApiErrorMessage(err, '');
      if (msg && !msg.toLowerCase().includes('account')) {
        setError(msg);
      } else {
        // Treat any backend response as "sent" to prevent enumeration
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: 'url(/solarpannel.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(8,20,18,0.55)', backdropFilter: 'blur(1px)' }} />

      <div className="relative z-10 w-full max-w-md px-6 py-8 fade-in">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: '#6db891', boxShadow: '0 0 32px rgba(109,184,145,0.35)' }}
          >
            <KalpaLogo size={32} />
          </div>
          <h1 className="text-4xl font-light" style={{ color: '#dde8e2', letterSpacing: '-0.02em' }}>Kalpa Power</h1>
          <p className="mt-2.5 text-xs uppercase tracking-widest font-medium" style={{ color: '#6db891' }}>
            Solar Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(14,22,20,0.65)',
            border: '1px solid rgba(109,184,145,0.12)',
            borderRadius: '18px',
          }}
          className="p-8 space-y-6 backdrop-blur-sm"
        >
          {sent ? (
            /* Success state */
            <div className="text-center space-y-5 py-4 scale-in">
              <div style={{ fontSize: '48px' }}>📬</div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#dde8e2' }}>Check your inbox</h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: '#8aa89e' }}>
                  If an account exists for <span style={{ color: '#6db891' }}>{email}</span>,
                  a password reset link has been sent. The link expires in 15 minutes.
                </p>
              </div>
              <div
                style={{ background: 'rgba(109,184,145,0.1)', border: '1px solid rgba(109,184,145,0.2)', borderRadius: '10px' }}
                className="p-4"
              >
                <p className="text-xs" style={{ color: '#6db891' }}>
                  Didn't receive it? Check your spam folder or wait a moment and try again.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ border: '1px solid rgba(109,184,145,0.28)', color: '#6db891', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,184,145,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Try a different email
                </button>
                <Link
                  to="/login"
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-center transition-all block"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#8aa89e', background: 'transparent', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dde8e2'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8aa89e'}
                >
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#dde8e2' }}>Forgot Password?</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#8aa89e' }}>
                  Enter your account email and we'll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#5a7870' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required
                    autoFocus
                    autoComplete="email"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: '#dde8e2',
                      padding: '10px 14px',
                      width: '100%',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(109,184,145,0.5)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {error && (
                  <div style={{ background: 'rgba(200,60,60,0.1)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: '10px' }} className="p-4">
                    <p className="text-sm" style={{ color: '#e57373' }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? 'rgba(109,184,145,0.3)' : '#6db891',
                    color: '#0d1a14',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Sending Reset Link…
                    </span>
                  ) : (
                    'Send Reset Link →'
                  )}
                </button>

                <Link
                  to="/login"
                  className="block text-center text-sm transition-colors"
                  style={{ color: '#5a7870', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#8aa89e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5a7870'}
                >
                  ← Back to Sign In
                </Link>
              </form>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: '#3a5a52' }}>
          Product Intelligence & Lifecycle Tracking
        </p>
      </div>
    </div>
  );
}
