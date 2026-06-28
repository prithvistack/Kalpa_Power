import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage, resetPassword } from '../api/api';
import KalpaLogo from '../components/KalpaLogo';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);
  const inputRef = useRef(null);

  // Auto-focus first field
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Redirect countdown after success
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) { navigate('/login'); return; }
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [success, countdown, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true); setError('');
    try {
      await resetPassword({
        token,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  // No token in URL — show clear error
  if (!token) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: 'url(/solarpannel.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(8,20,18,0.55)' }} />
        <div className="relative z-10 w-full max-w-md px-6 py-8 text-center fade-in">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 className="text-xl font-semibold mb-3" style={{ color: '#dde8e2' }}>Invalid Reset Link</h2>
          <p className="text-sm mb-6" style={{ color: '#8aa89e' }}>
            This reset link is missing or malformed. Please request a new one.
          </p>
          <Link to="/forgot-password" style={{
            display: 'inline-block', background: '#6db891', color: '#0d1a14',
            padding: '10px 24px', borderRadius: '10px', fontWeight: 600,
            fontSize: '14px', textDecoration: 'none',
          }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: 'url(/solarpannel.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
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
          {success ? (
            /* Success state */
            <div className="text-center space-y-5 py-4 scale-in">
              <div style={{ fontSize: '52px' }}>✅</div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#dde8e2' }}>Password Updated</h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: '#8aa89e' }}>
                  Your password has been updated successfully. You can now sign in with your new credentials.
                </p>
              </div>
              <div
                style={{ background: 'rgba(109,184,145,0.1)', border: '1px solid rgba(109,184,145,0.25)', borderRadius: '10px' }}
                className="p-4"
              >
                <p className="text-sm font-medium" style={{ color: '#6db891' }}>
                  Redirecting to Sign In in {countdown}s…
                </p>
                <div
                  className="mt-2 rounded-full overflow-hidden"
                  style={{ height: '3px', background: 'rgba(109,184,145,0.2)' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(countdown / 5) * 100}%`,
                      background: '#6db891',
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
              </div>
              <Link
                to="/login"
                style={{
                  display: 'inline-block', background: '#6db891', color: '#0d1a14',
                  padding: '10px 24px', borderRadius: '10px', fontWeight: 600,
                  fontSize: '14px', textDecoration: 'none',
                }}
              >
                Sign In Now →
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#dde8e2' }}>Set New Password</h2>
                <p className="mt-2 text-sm" style={{ color: '#8aa89e' }}>
                  Choose a strong password for your Kalpa account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#5a7870' }}>
                    New Password
                  </label>
                  <input
                    ref={inputRef}
                    type="password"
                    placeholder="Min. 8 characters"
                    value={form.new_password}
                    onChange={e => { setForm(f => ({ ...f, new_password: e.target.value })); setError(''); }}
                    required
                    minLength={8}
                    autoComplete="new-password"
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

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#5a7870' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={form.confirm_password}
                    onChange={e => { setForm(f => ({ ...f, confirm_password: e.target.value })); setError(''); }}
                    required
                    autoComplete="new-password"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        form.confirm_password && form.confirm_password !== form.new_password
                          ? 'rgba(200,60,60,0.5)'
                          : form.confirm_password && form.confirm_password === form.new_password
                          ? 'rgba(109,184,145,0.5)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                      borderRadius: '10px',
                      color: '#dde8e2',
                      padding: '10px 14px',
                      width: '100%',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      if (!form.confirm_password || form.confirm_password === form.new_password) {
                        e.currentTarget.style.borderColor = 'rgba(109,184,145,0.5)';
                      }
                    }}
                    onBlur={e => {
                      if (!form.confirm_password) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      }
                    }}
                  />
                  {/* Inline match indicator */}
                  {form.confirm_password && form.new_password && (
                    <p className="mt-1.5 text-xs" style={{
                      color: form.confirm_password === form.new_password ? '#6db891' : '#e57373',
                    }}>
                      {form.confirm_password === form.new_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background: 'rgba(200,60,60,0.1)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: '10px' }} className="p-4">
                    <p className="text-sm font-medium" style={{ color: '#e57373' }}>{error}</p>
                    {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') || error.toLowerCase().includes('used')) && (
                      <Link
                        to="/forgot-password"
                        className="block mt-2 text-xs underline"
                        style={{ color: '#ffb74d' }}
                      >
                        Request a new reset link →
                      </Link>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || form.new_password !== form.confirm_password || !form.new_password}
                  style={{
                    width: '100%',
                    background: loading || form.new_password !== form.confirm_password || !form.new_password
                      ? 'rgba(109,184,145,0.3)'
                      : '#6db891',
                    color: '#0d1a14',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: loading || form.new_password !== form.confirm_password || !form.new_password
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Updating Password…
                    </span>
                  ) : (
                    'Reset Password →'
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
