import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage, login, verifyOtp } from '../api/api';
import KalpaLogo from './KalpaLogo';

const OTP_DURATION = 5 * 60; // 300 seconds — must match backend OTP_EXPIRE_MINUTES

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function timerColor(seconds) {
  if (seconds > 60) return '#6db891';
  if (seconds > 30) return '#d4a066';
  return '#c47f7f';
}

export default function OtpScreen({ initialSessionToken, email, password, onSuccess, onBack }) {
  const [sessionToken, setSessionToken] = useState(initialSessionToken);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_DURATION);
  const [resendCooldown, setResendCooldown] = useState(60); // 60s before resend is enabled
  const inputRef = useRef(null);

  // Auto-focus OTP input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const expired = secondsLeft <= 0;

  async function handleVerify(e) {
    e?.preventDefault();
    if (loading || !otp.trim() || expired) return;

    const trimmed = otp.replace(/\s/g, '');
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await verifyOtp({ mfa_session_token: sessionToken, otp: trimmed });
      onSuccess(data);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Unable to verify code. Please try again.');

      if (msg.toLowerCase().includes('expired')) {
        setError('Your verification code has expired. Please request a new one.');
        setSecondsLeft(0);
      } else if (msg.toLowerCase().includes('maximum') || msg.toLowerCase().includes('attempts exceeded')) {
        setError('Too many incorrect attempts. Please log in again.');
        setTimeout(() => onBack(), 2500);
      } else if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid')) {
        setError(msg);
      } else {
        setError('Unable to verify code. Please try again.');
      }
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setError('');
    setResendMsg('');
    try {
      const { data } = await login({ email, password });
      if (data.mfa_session_token) {
        setSessionToken(data.mfa_session_token);
        setSecondsLeft(OTP_DURATION);
        setResendCooldown(60);
        setOtp('');
        setResendMsg('A new verification code has been sent to your email.');
        inputRef.current?.focus();
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not resend code. Please try again.'));
    } finally {
      setResendLoading(false);
    }
  }

  function handleOtpChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setError('');
    setResendMsg('');
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f2d2d 0%, #1a3a3a 100%)',
        backgroundImage: 'url(/solarpannel.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-40" style={{ pointerEvents: 'none' }} />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: '#6db891' }}
          >
            <KalpaLogo size={32} />
          </div>
          <h1 className="text-4xl font-light" style={{ color: '#dde8e2' }}>Kalpa Power</h1>
          <p className="mt-3 text-sm" style={{ color: '#8aa89e' }}>Smart Solar Intelligence System</p>
        </div>

        {/* OTP Card */}
        <div
          style={{
            background: 'rgba(26, 34, 36, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
          }}
          className="p-8 space-y-6 backdrop-blur-sm"
        >
          {/* Shield icon + title */}
          <div className="text-center space-y-2">
            <div className="text-4xl">🔐</div>
            <h2 className="text-xl font-semibold" style={{ color: '#dde8e2' }}>
              Verify Your Identity
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8aa89e' }}>
              A 6-digit verification code has been sent to<br />
              <span style={{ color: '#6db891' }}>{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {/* OTP input */}
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: '#8aa89e' }}
              >
                Verification Code
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                disabled={loading || expired}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? 'rgba(200,100,100,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  color: '#dde8e2',
                  fontFamily: 'monospace',
                  fontSize: '28px',
                  letterSpacing: '12px',
                  textAlign: 'center',
                }}
                className="w-full px-3 py-4 rounded-lg outline-none focus:border-[#6db891] transition-colors"
              />
            </div>

            {/* Countdown timer */}
            <div className="text-center">
              {expired ? (
                <p className="text-sm font-medium" style={{ color: '#c47f7f' }}>
                  ⏰ Code expired — request a new one below
                </p>
              ) : (
                <p className="text-sm font-medium tabular-nums" style={{ color: timerColor(secondsLeft) }}>
                  ⏱ {formatTime(secondsLeft)} remaining
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: 'rgba(200,100,100,0.1)',
                  border: '1px solid rgba(200,100,100,0.2)',
                  borderRadius: '8px',
                }}
                className="p-4"
              >
                <p className="text-sm" style={{ color: '#c47f7f' }}>{error}</p>
              </div>
            )}

            {/* Resend success */}
            {resendMsg && (
              <div
                style={{
                  background: 'rgba(109,184,145,0.1)',
                  border: '1px solid rgba(109,184,145,0.2)',
                  borderRadius: '8px',
                }}
                className="p-4"
              >
                <p className="text-sm" style={{ color: '#6db891' }}>✓ {resendMsg}</p>
              </div>
            )}

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || !otp || otp.length < 6 || expired}
              style={{
                background: loading || !otp || otp.length < 6 || expired
                  ? 'rgba(109,184,145,0.3)'
                  : '#6db891',
                color: '#0d1a14',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: '600',
                width: '100%',
                cursor: loading || !otp || otp.length < 6 || expired ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Verifying…
                </span>
              ) : 'Verify'}
            </button>

            {/* Resend + Back row */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  flex: 1,
                  border: '1px solid rgba(109,184,145,0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: resendCooldown > 0 ? '#4e6b62' : '#6db891',
                  background: 'transparent',
                  cursor: resendCooldown > 0 || resendLoading ? 'not-allowed' : 'pointer',
                  transition: 'color 0.2s',
                }}
              >
                {resendLoading
                  ? 'Sending…'
                  : resendCooldown > 0
                  ? `Resend (${resendCooldown}s)`
                  : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={onBack}
                style={{
                  flex: 1,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#8aa89e',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: '#4e6b62' }}>
          Product Intelligence &amp; Lifecycle Tracking
        </p>
      </div>
    </div>
  );
}
