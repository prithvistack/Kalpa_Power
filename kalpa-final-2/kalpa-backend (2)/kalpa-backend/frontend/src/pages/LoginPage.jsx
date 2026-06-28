import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, googleLogin, login, register } from '../api/api';
import KalpaLogo from '../components/KalpaLogo';
import OtpScreen from '../components/OtpScreen';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const googleButtonRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateCountdown, setRateCountdown] = useState(0);
  const [mfaState, setMfaState] = useState(null);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const homeFor = (role) => role === 'admin' ? '/admin' : '/app';
  const sessionExpired = new URLSearchParams(location.search).get('session_expired') === '1';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleReady = googleClientId && !googleClientId.startsWith('your-google');

  // Rate limit countdown
  useEffect(() => {
    if (rateCountdown <= 0) { setRateLimited(false); return; }
    const id = setInterval(() => setRateCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [rateCountdown]);

  useEffect(() => {
    if (!googleReady || !googleButtonRef.current) return;
    const initialize = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setLoading(true); setError('');
          try {
            const { data } = await googleLogin(response.credential);
            setSession(data); navigate(homeFor(data.user?.role), { replace: true });
          } catch (err) { setError(getApiErrorMessage(err, 'Google sign-in failed')); }
          finally { setLoading(false); }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline', size: 'large',
        width: googleButtonRef.current.offsetWidth || 360, text: 'signin_with',
      });
    };
    if (window.google?.accounts?.id) { initialize(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true; script.onload = initialize;
    document.head.appendChild(script);
  }, [from, googleClientId, googleReady, navigate, setSession]);

  async function submit(e) {
    e.preventDefault();
    if (rateLimited) return;
    setLoading(true); setError('');
    try {
      const { data } = await login(form);
      if (data.mfa_required && data.mfa_session_token) {
        setMfaState({ sessionToken: data.mfa_session_token, email: form.email, password: form.password });
      } else {
        setSession(data); navigate(homeFor(data.user?.role), { replace: true });
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        setRateLimited(true);
        setRateCountdown(60);
        setError('Too many attempts. Please wait 60 seconds before trying again.');
      } else {
        setError(getApiErrorMessage(err, 'Authentication failed'));
      }
    } finally { setLoading(false); }
  }

  async function enterDemo() {
    setLoading(true); setError('');
    try {
      const { data } = await register({ email: `demo-${Date.now()}@kalpa.app`, password: 'password123' });
      setSession(data); navigate(homeFor(data.user?.role), { replace: true });
    } catch (err) { setError(getApiErrorMessage(err, 'Could not create demo session')); }
    finally { setLoading(false); }
  }

  function handleOtpSuccess(sessionData) {
    setSession(sessionData);
    navigate(homeFor(sessionData.user?.role), { replace: true });
  }

  if (mfaState) {
    return (
      <OtpScreen
        initialSessionToken={mfaState.sessionToken}
        email={mfaState.email}
        password={mfaState.password}
        onSuccess={handleOtpSuccess}
        onBack={() => setMfaState(null)}
      />
    );
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/solarpannel.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
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
          <p className="mt-2.5 text-sm" style={{ color: '#6db891', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, fontSize: '11px' }}>
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
          className="p-8 space-y-5 backdrop-blur-sm"
        >
          {/* Session expired */}
          {sessionExpired && (
            <div style={{ background: 'rgba(200,60,60,0.12)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: '10px' }} className="p-4">
              <p className="text-sm" style={{ color: '#e57373' }}>Your session has expired. Please sign in again.</p>
            </div>
          )}

          {googleReady && <div ref={googleButtonRef} className="w-full" />}

          {/* Demo button */}
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-lg font-medium transition-all text-sm"
            style={{ color: '#6db891', border: '1px solid rgba(109,184,145,0.28)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,184,145,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={enterDemo}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Try Demo (no account needed)'}
          </button>

          {/* Mode toggle */}
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
                className="flex-1 py-1.5 rounded text-sm font-medium transition-all"
                style={mode === m
                  ? { background: 'rgba(109,184,145,0.18)', color: '#6db891' }
                  : { background: 'transparent', color: '#8aa89e' }}
                onClick={() => { setMode(m); setError(''); }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#5a7870' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
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
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#5a7870' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
              {/* Forgot password — only shown in login mode */}
              {mode === 'login' && (
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: '12px', color: '#6db891', textDecoration: 'none', opacity: 0.8 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {/* Rate limit countdown */}
            {rateLimited && (
              <div style={{ background: 'rgba(255,160,60,0.1)', border: '1px solid rgba(255,160,60,0.25)', borderRadius: '10px' }} className="p-4">
                <p className="text-sm font-medium" style={{ color: '#ffb74d' }}>
                  ⏱ Rate limited — try again in {rateCountdown}s
                </p>
                <div
                  className="mt-2 rounded-full overflow-hidden"
                  style={{ height: '3px', background: 'rgba(255,183,77,0.2)' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(rateCountdown / 60) * 100}%`,
                      background: '#ffb74d',
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && !rateLimited && (
              <div style={{ background: 'rgba(200,60,60,0.1)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: '10px' }} className="p-4">
                <p className="text-sm" style={{ color: '#e57373' }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || rateLimited}
              style={{
                width: '100%',
                background: loading || rateLimited ? 'rgba(109,184,145,0.3)' : '#6db891',
                color: '#0d1a14',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 16px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading || rateLimited ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : rateLimited ? (
                `Wait ${rateCountdown}s`
              ) : (
                mode === 'login' ? 'Sign In →' : 'Create Account →'
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: '#3a5a52' }}>
          Product Intelligence & Lifecycle Tracking
        </p>
      </div>
    </div>
  );
}
