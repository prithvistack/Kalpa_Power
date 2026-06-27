import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, googleLogin, login, register } from '../api/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const googleButtonRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const sessionExpired = new URLSearchParams(location.search).get('session_expired') === '1';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleReady = googleClientId && !googleClientId.startsWith('your-google');

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
            setSession(data); navigate(from, { replace: true });
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
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await (mode === 'login' ? login : register)(form);
      setSession(data); navigate(from, { replace: true });
    } catch (err) { setError(getApiErrorMessage(err, 'Authentication failed')); }
    finally { setLoading(false); }
  }

  async function enterDemo() {
    setLoading(true); setError('');
    try {
      const { data } = await register({ email: `demo-${Date.now()}@kalpa.app`, password: 'password123' });
      setSession(data); navigate(from, { replace: true });
    } catch (err) { setError(getApiErrorMessage(err, 'Could not create demo session')); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2d2d 0%, #1a3a3a 100%)', backgroundImage: 'url(/solarpannel.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black opacity-40" style={{ pointerEvents: 'none' }} />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        {/* Brand Section */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: '#6db891' }}>
            <img src="/kalpalogo.png" alt="Kalpa Logo" width="32" height="32" />
          </div>
          <h1 className="text-4xl font-light" style={{ color: '#dde8e2' }}>Kalpa Power</h1>
          <p className="mt-3 text-sm" style={{ color: '#8aa89e' }}>Smart Solar Intelligence System</p>
        </div>

        {/* Auth Card */}
        <div style={{ background: 'rgba(26, 34, 36, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }} className="p-8 space-y-6 backdrop-blur-sm">
          {/* Session expired notice */}
          {sessionExpired && (
            <div style={{ background: 'rgba(200,100,100,0.1)', border: '1px solid rgba(200,100,100,0.2)', borderRadius: '8px' }} className="p-4">
              <p className="text-sm" style={{ color: '#c47f7f' }}>Your session has expired. Please sign in again.</p>
            </div>
          )}

          {/* Google Notice */}
          {!googleReady && (
            <div style={{ background: 'rgba(109,184,145,0.1)', border: '1px solid rgba(109,184,145,0.2)', borderRadius: '8px' }} className="p-4">
              <p className="text-sm" style={{ color: '#d4a066' }}>Add VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={submit}>
            {/* Google Sign-In */}
            {googleReady && (
              <>
                <div ref={googleButtonRef} className="w-full" />
              </>
            )}

            {/* Demo Button */}
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-lg font-medium transition-all border"
              style={{
                color: '#6db891',
                borderColor: 'rgba(109,184,145,0.3)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(109,184,145,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={enterDemo}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Enter Demo'}
            </button>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className="flex-1 py-2 rounded font-medium transition-all text-sm"
                  style={mode === m
                    ? { background: 'rgba(109,184,145,0.15)', color: '#6db891' }
                    : { background: 'transparent', color: '#8aa89e' }}
                  onClick={() => setMode(m)}
                >
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8aa89e' }}>Email Address</label>
                <input
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#dde8e2' }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm placeholder-[#4e6b62] outline-none focus:border-[#6db891] transition-colors"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8aa89e' }}>Password</label>
                <input
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#dde8e2' }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm placeholder-[#4e6b62] outline-none focus:border-[#6db891] transition-colors"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(200,100,100,0.1)', border: '1px solid rgba(200,100,100,0.2)', borderRadius: '8px' }} className="p-4">
                <p className="text-sm" style={{ color: '#c47f7f' }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              style={{ background: '#6db891', color: '#0d1a14' }}
              className="btn w-full font-semibold"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs" style={{ color: '#4e6b62' }}>
          Product Intelligence & Lifecycle Tracking
        </p>
      </div>
    </div>
  );
}
