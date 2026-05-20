'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import { useApp } from '../../utils/appContext';

export default function LoginPage() {
  const router = useRouter();
  const { colors, lang } = useApp();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
      else setCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        ensureProfile(session.user).then(() => router.push('/dashboard'));
      }
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset_password');
        setMessage('Enter your new password below.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfile = async (user) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user['id'])
      .single();

    if (!existing) {
      await supabase.from('profiles').insert({
        id: user['id'],
        email: user.email,
        user_type: 'client',
        is_client: true,
        is_courier: false,
        company_name: company || '',
        country: 'PL',
        market: 'PL',
      });
    } else {
      await supabase.from('profiles').update({
        is_client: true,
        ...(company ? { company_name: company } : {}),
      }).eq('id', user['id']);
    }
  };

  const friendlyError = (err) => {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return 'Email or password is incorrect. Double-check and try again, or use "Send magic link" below to log in without a password.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link first. Or use "Send magic link" to skip this step.';
    }
    if (msg.includes('already registered') || msg.includes('user already registered')) {
      return 'An account with this email already exists. Sign in instead, or use "Send magic link" below.';
    }
    if (msg.includes('password')) {
      return 'Password must be at least 6 characters.';
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Connection error. Check your internet and try again.';
    }
    return err?.message || 'Something went wrong. Please try again.';
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await ensureProfile(data.user);
      router.push('/dashboard');
    } catch (e) {
      setError(friendlyError(e));
      if ((e?.message || '').toLowerCase().includes('invalid')) {
        setShowMagicLink(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://lgk-business.vercel.app/dashboard',
        }
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setError('An account with this email already exists but the password does not match. Try signing in, reset your password, or use the magic link below.');
            setShowMagicLink(true);
            setMode('login');
            return;
          }
          await ensureProfile(signInData.user);
          router.push('/dashboard');
          return;
        }
        throw error;
      }

      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Sign in instead.');
        setMode('login');
        return;
      }

      await ensureProfile(data.user);

      if (data.user && !data.session) {
        setMessage('Account created. Check your email for a confirmation link, or use the magic link option below to log in instantly.');
        setShowMagicLink(true);
      } else if (data.session) {
        router.push('/dashboard');
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://lgk-business.vercel.app/dashboard',
        }
      });
      if (error) throw error;
      setMagicSent(true);
      setMessage(`Magic link sent to ${email}. Check your inbox and click the link to log in instantly. No password needed.`);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://lgk-business.vercel.app/login',
      });
      if (error) throw error;
      setResetSent(true);
      setMessage(`Password reset email sent to ${email}. Check your inbox and click the link. The link expires in 1 hour.`);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%',
    padding: '14px 16px',
    background: '#111111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '16px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    WebkitAppearance: 'none',
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div key={lang} style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#D4FF00', fontWeight: 900, fontSize: '28px', letterSpacing: '3px' }}>LGK</span>
            <span style={{ color: '#666', fontWeight: 300, fontSize: '15px', letterSpacing: '6px', textTransform: 'uppercase' }}>COURIER</span>
          </div>
          <div style={{ color: '#666', fontSize: '13px' }}>{lang === 'pl' ? 'Panel dla firm' : 'Business Portal'}</div>
        </div>

        <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '16px', padding: '32px' }}>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '28px' }}>
            {[
              { m: 'login', label: lang === 'pl' ? 'Zaloguj się' : 'Sign In' },
              { m: 'signup', label: lang === 'pl' ? 'Utwórz konto' : 'Sign Up' }
            ].map(({ m, label }) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                  setMessage('');
                  setShowMagicLink(false);
                  setMagicSent(false);
                  setResetSent(false);
                }}
                style={{
                  padding: '8px 24px',
                  borderRadius: '20px',
                  border: mode === m ? 'none' : '1px solid #333',
                  background: mode === m ? '#D4FF00' : 'transparent',
                  color: mode === m ? '#000' : '#666',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <input
              style={inp}
              type="text"
              placeholder={lang === 'pl' ? 'Nazwa firmy (opcjonalnie)' : 'Company name (optional)'}
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          )}

          <input
            style={inp}
            type="email"
            placeholder={lang === 'pl' ? 'Adres e-mail' : 'Email address'}
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
          />

          {!magicSent && (
            <input
              style={inp}
              type="password"
              placeholder={lang === 'pl' ? 'Hasło (min. 8 znaków)' : 'Password (min 8 characters)'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />
          )}

          {error && (
            <div style={{ background: '#FF3B3015', border: '1px solid #FF3B30', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', color: '#FF6B6B', fontSize: '13px', lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ background: '#00C85315', border: '1px solid #00C853', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', color: '#00C853', fontSize: '13px', lineHeight: 1.6 }}>
              {message}
            </div>
          )}

          {!magicSent && (
            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#555' : '#D4FF00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
            >
              {loading
                ? (lang === 'pl' ? 'Proszę czekać...' : 'Please wait...')
                : mode === 'login'
                  ? (lang === 'pl' ? 'Zaloguj się' : 'Sign In')
                  : (lang === 'pl' ? 'Utwórz konto' : 'Create Account')
              }
            </button>
          )}

          <div style={{ borderTop: '1px solid #333', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {(showMagicLink || mode === 'login') && !magicSent && !resetSent && (
              <button
                onClick={handleMagicLink}
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'transparent', color: '#D4FF00', border: '1px solid #D4FF00', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                {lang === 'pl' ? '✉️ Wyślij magiczny link — zaloguj bez hasła' : '✉️ Send magic link — log in without password'}
              </button>
            )}

            {magicSent && (
              <button
                onClick={handleMagicLink}
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Resend magic link
              </button>
            )}

            {mode === 'login' && !resetSent && (
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline', textAlign: 'center' }}
              >
                {lang === 'pl' ? 'Nie pamiętasz hasła?' : 'Forgot password?'}
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#444' }}>
          {lang === 'pl' ? 'Obsługiwane przez LGK Courier' : 'Powered by LGK Courier'} · lgkcourierapp@gmail.com
        </div>
      </div>
    </div>
  );
}
