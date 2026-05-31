'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/utils/supabase'

const REG_STRINGS = {
  pl: {
    page_title: 'Utwórz konto',
    page_sub: 'Pierwsza dostawa gratis. Bez karty kredytowej.',
    field_business: 'Nazwa firmy / restauracji',
    field_business_placeholder: 'np. Pizzeria Roma',
    field_email: 'Adres e-mail',
    field_email_placeholder: 'twoj@email.com',
    field_password: 'Hasło',
    field_password_helper: 'Minimum 8 znaków',
    field_password_show: 'Pokaż',
    field_password_hide: 'Ukryj',
    btn_submit: 'Utwórz konto →',
    btn_submitting: 'Tworzenie konta...',
    link_login: 'Masz już konto? Zaloguj się →',
    legal: 'Rejestrując się akceptujesz nasz',
    legal_terms: 'Regulamin',
    legal_and: 'i',
    legal_privacy: 'Politykę Prywatności',
    error_duplicate: 'Ten adres e-mail jest już zarejestrowany.',
    error_duplicate_link: 'Zaloguj się →',
    error_weak_password: 'Hasło musi mieć minimum 8 znaków.',
    error_network: 'Błąd połączenia. Spróbuj ponownie.',
    error_generic: 'Coś poszło nie tak. Spróbuj ponownie.',
    error_required_business: 'Podaj nazwę firmy.',
    error_required_email: 'Podaj adres e-mail.',
    error_invalid_email: 'Nieprawidłowy adres e-mail.',
    success_title: 'Sprawdź swoją skrzynkę e-mail',
    success_sub: 'Wysłaliśmy link aktywacyjny na',
    success_resend: 'Wyślij ponownie →',
    success_resent: 'Wysłano ponownie ✓',
  },
  en: {
    page_title: 'Create your account',
    page_sub: 'First delivery free. No credit card required.',
    field_business: 'Business / restaurant name',
    field_business_placeholder: 'e.g. Roma Restaurant',
    field_email: 'Email address',
    field_email_placeholder: 'your@email.com',
    field_password: 'Password',
    field_password_helper: 'Minimum 8 characters',
    field_password_show: 'Show',
    field_password_hide: 'Hide',
    btn_submit: 'Create account →',
    btn_submitting: 'Creating account...',
    link_login: 'Already have an account? Sign in →',
    legal: 'By registering you accept our',
    legal_terms: 'Terms',
    legal_and: 'and',
    legal_privacy: 'Privacy Policy',
    error_duplicate: 'This email is already registered.',
    error_duplicate_link: 'Sign in →',
    error_weak_password: 'Password must be at least 8 characters.',
    error_network: 'Connection error. Please try again.',
    error_generic: 'Something went wrong. Please try again.',
    error_required_business: 'Please enter your business name.',
    error_required_email: 'Please enter your email address.',
    error_invalid_email: 'Invalid email address.',
    success_title: 'Check your email',
    success_sub: 'We sent an activation link to',
    success_resend: 'Resend →',
    success_resent: 'Sent ✓',
  },
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lang, setLang] = useState('pl')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (navigator.language?.startsWith('en')) setLang('en')
    const prefill = searchParams.get('email')
    if (prefill) setEmail(prefill)
  }, [searchParams])

  const r = REG_STRINGS[lang]

  const validate = () => {
    if (!businessName.trim()) return r.error_required_business
    if (!email.trim()) return r.error_required_email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return r.error_invalid_email
    if (password.length < 8) return r.error_weak_password
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError({ message: validationError }); return }

    setSubmitting(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered') ||
            signUpError.message?.toLowerCase().includes('already exists') ||
            signUpError.status === 422) {
          setError({ type: 'duplicate' })
        } else if (signUpError.message?.toLowerCase().includes('password') ||
                   signUpError.message?.toLowerCase().includes('weak')) {
          setError({ message: r.error_weak_password })
        } else {
          setError({ message: r.error_generic })
        }
        setSubmitting(false)
        return
      }

      const user = data?.user
      if (user) {
        await supabase.from('profiles').upsert({
          id: user['id'],
          email: email,
          company_name: businessName,
          business_type: 'general',
          user_type: 'client',
          is_client: true,
          is_courier: false,
          country: 'PL',
          market: 'PL',
          account_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }

      if (data?.session) {
        router.push('/dashboard')
      } else {
        setSuccess(true)
      }
    } catch {
      setError({ message: r.error_network })
    }
    setSubmitting(false)
  }

  const handleResend = async () => {
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
    } catch {
      // silently ignore
    }
  }

  const inp = {
    width: '100%', padding: '12px 14px', background: '#F5F5F5',
    border: '1px solid #E5E5E5', borderRadius: 8, color: '#0A0A0A',
    fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit',
    outline: 'none',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✉️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }}>{r.success_title}</h1>
          <p style={{ color: '#555', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            {r.success_sub} <strong>{email}</strong>
          </p>
          <button
            onClick={handleResend}
            disabled={resent}
            style={{ background: 'transparent', border: '1px solid #E5E5E5', color: resent ? '#00C853' : '#555', padding: '10px 24px', borderRadius: 8, cursor: resent ? 'default' : 'pointer', fontSize: 14, fontFamily: 'inherit' }}
          >
            {resent ? r.success_resent : r.success_resend}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', background: '#D4FF00', color: '#0A0A0A', fontWeight: 900, padding: '6px 14px', borderRadius: 20, fontSize: 16, marginBottom: 16 }}>L°</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#0A0A0A' }}>{r.page_title}</h1>
          <p style={{ color: '#555', fontSize: 14 }}>{r.page_sub}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="reg-business" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>{r.field_business}</label>
            <input
              id="reg-business"
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="organization"
              placeholder={r.field_business_placeholder}
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              style={inp}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="reg-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>{r.field_email}</label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              placeholder={r.field_email_placeholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inp}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="reg-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>{r.field_password}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inp, paddingRight: 72 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              >
                {showPassword ? r.field_password_hide : r.field_password_show}
              </button>
            </div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 5 }}>{r.field_password_helper}</div>
          </div>

          {error && (
            <div style={{ background: '#FF3B3010', border: '1px solid #FF3B3030', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              {error.type === 'duplicate' ? (
                <span style={{ color: '#FF3B30' }}>
                  {r.error_duplicate}{' '}
                  <a href="/login" style={{ color: '#FF3B30', fontWeight: 700 }}>{r.error_duplicate_link}</a>
                </span>
              ) : (
                <span style={{ color: '#FF3B30' }}>{error.message}</span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '14px 0', background: submitting ? '#E5E5E5' : '#D4FF00',
              color: submitting ? '#999' : '#0A0A0A', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginBottom: 16,
            }}
          >
            {submitting ? r.btn_submitting : r.btn_submit}
          </button>

          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <a href="/login" style={{ color: '#555', fontSize: 14, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
              {r.link_login}
            </a>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#999', lineHeight: 1.6 }}>
            {r.legal}{' '}
            <a href="/terms" style={{ color: '#555', textDecoration: 'underline' }}>{r.legal_terms}</a>
            {' '}{r.legal_and}{' '}
            <a href="/privacy" style={{ color: '#555', textDecoration: 'underline' }}>{r.legal_privacy}</a>.
          </p>

        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFFFF' }} />}>
      <RegisterForm />
    </Suspense>
  )
}
