'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STRINGS = {
  pl: {
    nav_login: 'Zaloguj się',
    nav_lang_pl: 'PL',
    nav_lang_en: 'EN',
    eyebrow: '📍 Szczecin · Dostawy w Twoim mieście',
    hero_h1_line1: 'Większość platform bierze 25–30% od każdego zamówienia.',
    hero_h1_line2: 'My bierzemy 10%.',
    hero_h1_line3: 'Reszta zostaje w Twojej restauracji.',
    hero_sub_restaurant: 'Twoje jedzenie dociera gorące. Nie dlatego że kurierzy jeżdżą szybciej — dlatego że przyjeżdżają gdy kuchnia jest gotowa. Czas odbioru ustala restauracja, nie algorytm.',
    hero_sub_business: 'Wyślij paczkę w Szczecinie za PLN 28. Dostajesz zdjęcie GPS kiedy dociera. Nie ma co do tego pytań.',
    hero_cta: 'Zacznij oszczędzać — rejestracja gratis →',
    hero_cta_business: 'Wyślij pierwszą paczkę gratis →',
    hero_login_link: 'Masz już konto? Zaloguj się →',
    tab_restaurant: '🍽 Restauracja',
    tab_business: '📦 Firma',
    mock_status: '✓ Dostarczone',
    mock_gps_btn: 'Zdjęcie GPS dostępne',
    calc_title: 'Ile oszczędzasz miesięcznie?',
    calc_slider_label: 'Zamówień dziennie / Orders per day',
    calc_monthly_label: 'Oszczędzasz miesięcznie',
    calc_annual_label: 'Oszczędzasz rocznie',
    calc_fine_print: 'Przy średniej prowizji 28% vs 10% i PLN 45/zamówienie',
    calc_cta: 'Zacznij oszczędzać →',
    how_title: 'Jak to działa?',
    how_sub: 'Trzy kroki. Żadnej papierologii.',
    step1_title: 'Składasz zamówienie.',
    step1_body: 'Formularz online. 2 minuty. Adres odbioru, adres dostawy, kiedy gotowe.',
    step2_title: 'Kurier przyjeżdża gdy kuchnia gotowa.',
    step2_body: 'Nie 20 minut za wcześnie. Nie 10 minut za późno. Czas ustala restauracja.',
    step3_title: 'Klient dostaje zdjęcie GPS.',
    step3_body: 'Każda dostawa sfotografowana z koordynatami GPS i znacznikiem czasu. Koniec sporów.',
    biz_title: 'Dla każdej firmy w Szczecinie.',
    biz_sub: 'Nie musisz być restauracją. Jeśli wysyłasz paczki w Szczecinie — LGK to obsługuje.',
    biz_retail_title: 'Sklep',
    biz_retail_body: 'Wyślij zakupy do klienta tego samego dnia. Zdjęcie GPS potwierdza dostawę.',
    biz_pharmacy_title: 'Apteka',
    biz_pharmacy_body: 'Pilne dostawy leków z GPS i znacznikiem czasu. Dokumentacja dla każdej przesyłki.',
    biz_ecommerce_title: 'E-commerce',
    biz_ecommerce_body: 'Obsługuj dostawy lokalne bez własnej floty. PLN 28 od dostawy, faktura automatyczna.',
    biz_cta: 'Wyślij pierwszą paczkę gratis →',
    proof_title: 'Prawdziwy portal. Prawdziwe dane.',
    proof_dashboard_caption: 'Wszystkie zamówienia w jednym miejscu',
    proof_gps_caption: 'Dowód GPS przy każdej dostawie',
    proof_gps_badge: 'GPS zweryfikowane',
    proof_gps_status: '✓ Dostarczone',
    pricing_title: 'Przejrzyste ceny. Bez niespodzianek.',
    pricing_highlight: 'Pierwsza dostawa GRATIS · Bez umowy · Anuluj kiedy chcesz',
    tier_starter_title: 'Starter',
    tier_starter_price: 'PLN 0',
    tier_starter_period: '/ miesiąc',
    tier_starter_sub: 'Płacisz tylko za dostawy',
    tier_starter_r1: 'PLN 32 — do 3km',
    tier_starter_r2: 'PLN 38 — 3–6km',
    tier_starter_r3: 'PLN 48 — 6–10km',
    tier_starter_commission: '12% od zamówienia restauracyjnego',
    tier_starter_for: 'Mniej niż 30 zamówień miesięcznie',
    tier_starter_feats: 'GPS proof ✓ · Portal ✓ · Faktury ✓',
    tier_starter_cta: 'Zacznij za darmo →',
    tier_business_title: 'Business',
    tier_business_badge: 'Najpopularniejszy',
    tier_business_price: 'PLN 169',
    tier_business_period: '/ miesiąc',
    tier_business_sub: 'Zwraca się po ~43 zamówieniach',
    tier_business_r1: 'PLN 28 — do 3km',
    tier_business_r2: 'PLN 35 — 3–6km',
    tier_business_r3: 'PLN 42 — 6–10km',
    tier_business_commission: '10% od zamówienia restauracyjnego',
    tier_business_for: '30+ zamówień miesięcznie',
    tier_business_feats: 'Wszystko ze Starter ✓ + Priorytet ✓ + Zapisane adresy ✓',
    tier_business_cta: 'Zacznij →',
    tier_fleet_title: 'Fleet',
    tier_fleet_price: 'PLN 429',
    tier_fleet_period: '/ miesiąc / lokalizacja',
    tier_fleet_sub: 'Dla firm z własną flotą kierowców',
    tier_fleet_r1: 'PLN 28 — do 3km',
    tier_fleet_r2: 'PLN 35 — 3–6km',
    tier_fleet_r3: 'PLN 42 — 6–10km',
    tier_fleet_commission: '10% od zamówienia restauracyjnego',
    tier_fleet_for: 'Własni kierowcy + duży wolumen',
    tier_fleet_feats: 'Wszystko z Business ✓ + Kierowcy ✓ + Dispatch ✓ + Overflow ✓',
    tier_fleet_cta: 'Skontaktuj się z nami',
    tier_fleet_note: 'Nasz zespół aktywuje opcje Fleet w ciągu 24h',
    trust_local_title: 'Szczecin',
    trust_local_body: 'Jesteśmy z Szczecina. Dowozimy w Szczecinie. Możesz do nas zadzwonić.',
    trust_gdpr_title: 'GDPR',
    trust_gdpr_body: 'Twoje dane klientów należą do Ciebie. Nie sprzedajemy ich, nie analizujemy, nie budujemy na nich własnych produktów.',
    trust_gps_title: 'GPS',
    trust_gps_body: 'Każda dostawa ma zdjęcie GPS. Nie potwierdzenie statusu. Zdjęcie. Z koordynatami. Z godziną. Dowód który jest dowodem.',
    trust_nocontract_title: 'Bez umowy',
    trust_nocontract_body: 'Żadnej umowy. Żadnych minimalnych zamówień. Zacznij kiedy chcesz. Skończ kiedy chcesz.',
    final_h1: 'Pierwsza dostawa gratis.',
    final_sub: 'Nie okres próbny. Pierwsza prawdziwa dostawa, do prawdziwego klienta, z prawdziwym zdjęciem GPS. Gratis. Rejestracja zajmuje 3 minuty.',
    final_input_placeholder: 'twoj@email.com',
    final_cta_btn: 'Zacznij →',
    final_login_link: 'Masz już konto? Zaloguj się →',
    footer_company: 'L° LGK Courier · Szczecin, Polska',
    footer_privacy: 'Prywatność',
    footer_terms: 'Regulamin',
    footer_email: 'lgkcourierapp@gmail.com',
  },
  en: {
    nav_login: 'Sign in',
    nav_lang_pl: 'PL',
    nav_lang_en: 'EN',
    eyebrow: '📍 Szczecin · Delivery in your city',
    hero_h1_line1: 'Most platforms take 25–30% on every order.',
    hero_h1_line2: 'We take 10%.',
    hero_h1_line3: 'The rest stays in your restaurant.',
    hero_sub_restaurant: 'Your food arrives hot. Not because couriers drive faster — because they arrive when your kitchen is ready. The pickup time is set by the restaurant, not an algorithm.',
    hero_sub_business: 'Send a parcel in Szczecin from PLN 28. You get a GPS photo when it arrives. No questions about it.',
    hero_cta: 'Start saving — get started free →',
    hero_cta_business: 'Send your first parcel free →',
    hero_login_link: 'Already have an account? Sign in →',
    tab_restaurant: '🍽 Restaurant',
    tab_business: '📦 Business',
    mock_status: '✓ Delivered',
    mock_gps_btn: 'GPS photo available',
    calc_title: 'How much do you save per month?',
    calc_slider_label: 'Orders per day',
    calc_monthly_label: 'You save per month',
    calc_annual_label: 'You save per year',
    calc_fine_print: 'Based on average commission 28% vs 10% and PLN 45 per order',
    calc_cta: 'Start saving →',
    how_title: 'How it works',
    how_sub: 'Three steps. No paperwork.',
    step1_title: 'You place an order.',
    step1_body: "Online form. 2 minutes. Pickup, delivery, when it's ready.",
    step2_title: 'Courier arrives when the kitchen is ready.',
    step2_body: 'Not 20 minutes early. Not 10 minutes late. The timing is set by the restaurant.',
    step3_title: 'Customer gets a GPS photo.',
    step3_body: 'Every delivery photographed with GPS coordinates and timestamp. End of disputes.',
    biz_title: 'For every business in Szczecin.',
    biz_sub: "You don't have to be a restaurant. If you send packages in Szczecin — LGK handles it.",
    biz_retail_title: 'Retail shop',
    biz_retail_body: 'Same-day delivery to your customer. GPS photo confirms delivery.',
    biz_pharmacy_title: 'Pharmacy',
    biz_pharmacy_body: 'Urgent medication delivery with GPS and timestamp. Full documentation.',
    biz_ecommerce_title: 'E-commerce',
    biz_ecommerce_body: 'Handle local deliveries without your own fleet. PLN 28 per delivery.',
    biz_cta: 'Send your first parcel free →',
    proof_title: 'Real portal. Real data.',
    proof_dashboard_caption: 'All orders in one place',
    proof_gps_caption: 'GPS proof with every delivery',
    proof_gps_badge: 'GPS verified',
    proof_gps_status: '✓ Delivered',
    pricing_title: 'Transparent pricing. No surprises.',
    pricing_highlight: 'First delivery FREE · No contract · Cancel any time',
    tier_starter_title: 'Starter',
    tier_starter_price: 'PLN 0',
    tier_starter_period: '/ month',
    tier_starter_sub: 'Pay only for deliveries',
    tier_starter_r1: 'PLN 32 — up to 3km',
    tier_starter_r2: 'PLN 38 — 3–6km',
    tier_starter_r3: 'PLN 48 — 6–10km',
    tier_starter_commission: '12% on restaurant orders',
    tier_starter_for: 'Fewer than 30 orders per month',
    tier_starter_feats: 'GPS proof ✓ · Portal ✓ · Invoices ✓',
    tier_starter_cta: 'Get started free →',
    tier_business_title: 'Business',
    tier_business_badge: 'Most popular',
    tier_business_price: 'PLN 169',
    tier_business_period: '/ month',
    tier_business_sub: 'Pays for itself after ~43 orders',
    tier_business_r1: 'PLN 28 — up to 3km',
    tier_business_r2: 'PLN 35 — 3–6km',
    tier_business_r3: 'PLN 42 — 6–10km',
    tier_business_commission: '10% on restaurant orders',
    tier_business_for: '30+ orders per month',
    tier_business_feats: 'Everything in Starter ✓ + Priority ✓ + Saved addresses ✓',
    tier_business_cta: 'Get started →',
    tier_fleet_title: 'Fleet',
    tier_fleet_price: 'PLN 429',
    tier_fleet_period: '/ month / location',
    tier_fleet_sub: 'For businesses with their own driver fleet',
    tier_fleet_r1: 'PLN 28 — up to 3km',
    tier_fleet_r2: 'PLN 35 — 3–6km',
    tier_fleet_r3: 'PLN 42 — 6–10km',
    tier_fleet_commission: '10% on restaurant orders',
    tier_fleet_for: 'Own drivers + high volume',
    tier_fleet_feats: 'Everything in Business ✓ + Drivers ✓ + Dispatch ✓ + Overflow ✓',
    tier_fleet_cta: 'Contact us',
    tier_fleet_note: 'Our team activates Fleet features within 24h',
    trust_local_title: 'Szczecin',
    trust_local_body: "We're from Szczecin. We deliver in Szczecin. You can call us.",
    trust_gdpr_title: 'GDPR',
    trust_gdpr_body: "Your customer data belongs to you. We don't sell it, we don't analyse it, we don't build other products on it.",
    trust_gps_title: 'GPS',
    trust_gps_body: 'Every delivery has a GPS photo. Not a status confirmation. A photo. With coordinates. With a timestamp. Proof that is actually proof.',
    trust_nocontract_title: 'No contract',
    trust_nocontract_body: 'No contract. No minimum orders. Start when you want. Stop when you want.',
    final_h1: 'First delivery free.',
    final_sub: 'Not a trial period. The first real delivery, to a real customer, with a real GPS photo. Free. Registration takes 3 minutes.',
    final_input_placeholder: 'your@email.com',
    final_cta_btn: 'Get started →',
    final_login_link: 'Already have an account? Sign in →',
    footer_company: 'L° LGK Courier · Szczecin, Poland',
    footer_privacy: 'Privacy',
    footer_terms: 'Terms',
    footer_email: 'lgkcourierapp@gmail.com',
  },
}

const C = {
  bg: '#FFFFFF', cardBg: '#F8F8F8', border: '#E8E8E8',
  text: '#0A0A0A', textSecondary: '#555555', textMuted: '#999999',
  accent: '#D4FF00', accentBg: '#0A0A0A',
  success: '#00C853', danger: '#FF3B30',
}

export default function HomePage() {
  const router = useRouter()
  const [lang, setLang] = useState('pl')
  const [segment, setSegment] = useState('restaurant')
  const [dailyOrders, setDailyOrders] = useState(50)
  const [heroEmail, setHeroEmail] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    if (navigator.language?.startsWith('en')) setLang('en')
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else setCheckingSession(false)
    }).catch(() => setCheckingSession(false))
  }, [router])

  const s = STRINGS[lang]
  // 28% industry average − 10% LGK = 18% saving per order
  const monthlySaving = Math.round(dailyOrders * 45 * 0.18 * 30)
  const annualSaving = Math.round(monthlySaving * 12)

  if (checkingSession) return <div style={{ minHeight: '100vh', background: C.bg }} />

  const ctaStyle = {
    display: 'inline-block', background: C.accent, color: C.text,
    fontWeight: 700, padding: '14px 28px', borderRadius: 8,
    textDecoration: 'none', fontSize: 15, cursor: 'pointer', border: 'none',
  }

  const cardStyle = {
    background: C.cardBg, border: '1px solid ' + C.border,
    borderRadius: 12, padding: 28,
  }

  const outlineBtnStyle = {
    display: 'block', textAlign: 'center', padding: '10px 16px',
    borderRadius: 8, border: '1px solid ' + C.border, color: C.text,
    textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: C.bg, color: C.text, overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hero-mockup-col { display: none !important; }
          .hero-h1 { font-size: 34px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .proof-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .trust-grid { grid-template-columns: 1fr 1fr !important; }
          .final-row { flex-direction: column !important; }
          .final-row input, .final-row button { width: 100% !important; min-width: unset !important; }
          .sec-pad { padding: 52px 20px !important; }
          .final-h1 { font-size: 32px !important; }
          .calc-h2 { font-size: 28px !important; }
          .calc-boxes { grid-template-columns: 1fr !important; }
          .calc-amount { font-size: 28px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid ' + C.border,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: C.accent, color: C.text, fontWeight: 900, padding: '4px 10px', borderRadius: 20, fontSize: 14 }}>L°</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>LGK Business</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setLang(l => l === 'pl' ? 'en' : 'pl')}
            style={{ background: 'transparent', border: '1px solid ' + C.border, color: C.textSecondary, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {lang === 'pl' ? s.nav_lang_en : s.nav_lang_pl}
          </button>
          <a href="/login" style={{ background: 'transparent', border: '1px solid ' + C.border, color: C.text, padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            {s.nav_login}
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'flex', gap: 64, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D4FF0015', border: '1px solid #D4FF0040', borderRadius: 24, padding: '6px 16px', marginBottom: 24, fontSize: 13, color: C.textSecondary }}>
              {s.eyebrow}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['restaurant', 'business'].map(seg => (
                <button
                  key={seg}
                  onClick={() => setSegment(seg)}
                  style={{
                    padding: '8px 18px', borderRadius: 20, fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', border: '1px solid ' + (segment === seg ? C.accent : C.border),
                    background: segment === seg ? C.accent : 'transparent',
                    color: segment === seg ? C.text : C.textSecondary,
                    fontFamily: 'inherit',
                  }}
                >
                  {seg === 'restaurant' ? s.tab_restaurant : s.tab_business}
                </button>
              ))}
            </div>

            <h1 className="hero-h1" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, color: C.text, marginBottom: 20, letterSpacing: '-1px' }}>
              {s.hero_h1_line1}<br />
              {s.hero_h1_line2}<br />
              <span style={{ background: C.accentBg, color: C.accent, padding: '2px 6px', borderRadius: 4 }}>{s.hero_h1_line3}</span>
            </h1>

            <p style={{ fontSize: 18, color: C.textSecondary, lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
              {segment === 'restaurant' ? s.hero_sub_restaurant : s.hero_sub_business}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
              <a
                href="/register"
                style={ctaStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                {segment === 'restaurant' ? s.hero_cta : s.hero_cta_business}
              </a>
              <a
                href="/login"
                style={{ fontSize: 14, color: C.textSecondary, textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >
                {s.hero_login_link}
              </a>
            </div>
          </div>

          <div className="hero-mockup-col" style={{ flex: '0 0 320px' }}>
            <div style={{ background: C.accentBg, borderRadius: 16, padding: 24 }}>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: '#555', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Order</div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.accent, fontWeight: 700, marginBottom: 14 }}>SZ-CEN-261231-00001-3</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: '#00C85320', color: C.success, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{s.mock_status}</span>
              </div>
              <div style={{ color: '#555', fontSize: 12, marginBottom: 16, fontFamily: "'Fira Code', monospace" }}>52.4064°N 14.5529°E · 14:48</div>
              <button style={{ background: 'transparent', border: '1px solid #333', color: '#777', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
                {s.mock_gps_btn}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR (dark) ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', background: C.accentBg }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="calc-h2" style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 32, lineHeight: 1.2 }}>{s.calc_title}</h2>

          <label style={{ display: 'block', color: '#999', fontSize: 14, marginBottom: 14, textAlign: 'left', maxWidth: 480, margin: '0 auto 14px' }}>
            {s.calc_slider_label}: <strong style={{ color: C.accent }}>{dailyOrders}</strong>
          </label>
          <input
            type="range" min={10} max={200} step={5} value={dailyOrders}
            onChange={e => setDailyOrders(Number(e.target.value))}
            style={{ width: '100%', maxWidth: 480, accentColor: C.accent, cursor: 'pointer', marginBottom: 32 }}
          />

          <div className="calc-boxes" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 480, margin: '0 auto 16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ color: '#999', fontSize: 13, marginBottom: 10 }}>{s.calc_monthly_label}</div>
              <div className="calc-amount" style={{ fontFamily: "'Fira Code', monospace", fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                PLN {monthlySaving.toLocaleString('pl-PL')}
              </div>
            </div>
            <div style={{ background: C.accent, borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 10 }}>{s.calc_annual_label}</div>
              <div className="calc-amount" style={{ fontFamily: "'Fira Code', monospace", fontSize: 36, fontWeight: 700, color: C.accentBg, lineHeight: 1 }}>
                PLN {annualSaving.toLocaleString('pl-PL')}
              </div>
            </div>
          </div>

          <div style={{ color: '#555', fontSize: 13, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>{s.calc_fine_print}</div>

          <a href="/register" style={ctaStyle}>{s.calc_cta}</a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>{s.how_title}</h2>
            <p style={{ color: C.textSecondary, fontSize: 17 }}>{s.how_sub}</p>
          </div>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: '📝', title: s.step1_title, body: s.step1_body },
              { icon: '🛵', title: s.step2_title, body: s.step2_body },
              { icon: '📷', title: s.step3_title, body: s.step3_body },
            ].map((step) => (
              <div key={step.title} style={cardStyle}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{step.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10, color: C.text }}>{step.title}</div>
                <div style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.7 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', background: C.cardBg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>{s.proof_title}</h2>
          </div>
          <div className="proof-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ background: C.accentBg, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 16, fontWeight: 700, letterSpacing: 0.5 }}>Panel · Aktywne dostawy (3)</div>
                {[
                  { id: 'SZ-001', status: 'In transit' },
                  { id: 'SZ-002', status: 'Collected' },
                  { id: 'SZ-003', status: 'Pending' },
                ].map((row, i) => (
                  <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid #1A1A1A' : 'none' }}>
                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.accent }}>{row.id}</span>
                    <span style={{ fontSize: 12, color: '#555' }}>{row.status}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16, fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.accent, fontWeight: 700 }}>PLN 892 · ten miesiąc</div>
              </div>
              <p style={{ textAlign: 'center', color: C.textSecondary, fontSize: 13, marginTop: 12 }}>{s.proof_dashboard_caption}</p>
            </div>
            <div>
              <div style={{ background: C.accentBg, borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
                <div style={{ color: '#555', fontSize: 13, marginBottom: 10, fontFamily: "'Fira Code', monospace" }}>📍 52.4064°N 14.5529°E</div>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 20 }}>{s.proof_gps_status} · 14:48:33</div>
                <span style={{ background: '#00C85320', color: C.success, fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20 }}>{s.proof_gps_badge}</span>
              </div>
              <p style={{ textAlign: 'center', color: C.textSecondary, fontSize: 13, marginTop: 12 }}>{s.proof_gps_caption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS SECTION — visible when segment === 'business' ── */}
      {segment === 'business' && (
        <section className="sec-pad" style={{ padding: '80px 24px', background: C.bg }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>{s.biz_title}</h2>
              <p style={{ color: C.textSecondary, fontSize: 17, maxWidth: 560, margin: '0 auto' }}>{s.biz_sub}</p>
            </div>
            <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
              {[
                { icon: '🛒', title: s.biz_retail_title, body: s.biz_retail_body },
                { icon: '💊', title: s.biz_pharmacy_title, body: s.biz_pharmacy_body },
                { icon: '📦', title: s.biz_ecommerce_title, body: s.biz_ecommerce_body },
              ].map(item => (
                <div key={item.title} style={cardStyle}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{item.title}</div>
                  <div style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.7 }}>{item.body}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <a href="/register" style={ctaStyle}>{s.biz_cta}</a>
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING — Starter / Business / Fleet ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>{s.pricing_title}</h2>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>

            {/* STARTER */}
            <div style={{ background: C.cardBg, border: '1px solid ' + C.border, borderRadius: 12, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{s.tier_starter_title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{s.tier_starter_price}</span>
                <span style={{ color: C.textSecondary, fontSize: 14 }}>{s.tier_starter_period}</span>
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid ' + C.border }}>{s.tier_starter_sub}</div>
              <div style={{ marginBottom: 12 }}>
                {[s.tier_starter_r1, s.tier_starter_r2, s.tier_starter_r3].map((r, i) => (
                  <div key={i} style={{ color: C.textSecondary, fontSize: 13, padding: '5px 0', borderBottom: i < 2 ? '1px solid ' + C.border : 'none' }}>{r}</div>
                ))}
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 6 }}>{s.tier_starter_commission}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>{s.tier_starter_for}</div>
              <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 20 }}>{s.tier_starter_feats}</div>
              <a href="/register" style={outlineBtnStyle}>{s.tier_starter_cta}</a>
            </div>

            {/* BUSINESS */}
            <div style={{ background: '#D4FF0008', border: '2px solid ' + C.accent, borderRadius: 12, padding: 28, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: C.accent, color: C.text, fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {s.tier_business_badge}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{s.tier_business_title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{s.tier_business_price}</span>
                <span style={{ color: C.textSecondary, fontSize: 14 }}>{s.tier_business_period}</span>
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid ' + C.border }}>{s.tier_business_sub}</div>
              <div style={{ marginBottom: 12 }}>
                {[s.tier_business_r1, s.tier_business_r2, s.tier_business_r3].map((r, i) => (
                  <div key={i} style={{ color: C.textSecondary, fontSize: 13, padding: '5px 0', borderBottom: i < 2 ? '1px solid ' + C.border : 'none' }}>{r}</div>
                ))}
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 6 }}>{s.tier_business_commission}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>{s.tier_business_for}</div>
              <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 20 }}>{s.tier_business_feats}</div>
              <a href="/register" style={{ display: 'block', textAlign: 'center', padding: '10px 16px', borderRadius: 8, background: C.accent, color: C.text, textDecoration: 'none', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                {s.tier_business_cta}
              </a>
            </div>

            {/* FLEET */}
            <div style={{ background: C.cardBg, border: '1px solid ' + C.border, borderRadius: 12, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{s.tier_fleet_title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{s.tier_fleet_price}</span>
                <span style={{ color: C.textSecondary, fontSize: 14 }}>{s.tier_fleet_period}</span>
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid ' + C.border }}>{s.tier_fleet_sub}</div>
              <div style={{ marginBottom: 12 }}>
                {[s.tier_fleet_r1, s.tier_fleet_r2, s.tier_fleet_r3].map((r, i) => (
                  <div key={i} style={{ color: C.textSecondary, fontSize: 13, padding: '5px 0', borderBottom: i < 2 ? '1px solid ' + C.border : 'none' }}>{r}</div>
                ))}
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 6 }}>{s.tier_fleet_commission}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>{s.tier_fleet_for}</div>
              <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 20 }}>{s.tier_fleet_feats}</div>
              <a href="/register?tier=fleet" style={outlineBtnStyle}>{s.tier_fleet_cta}</a>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>{s.tier_fleet_note}</div>
            </div>

          </div>
          <div style={{ background: '#D4FF0010', border: '1px solid #D4FF0040', borderRadius: 10, padding: '16px 24px', textAlign: 'center' }}>
            <span style={{ color: C.textSecondary, fontWeight: 600, fontSize: 14 }}>{s.pricing_highlight}</span>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', background: C.cardBg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
              { icon: '🏙️', title: s.trust_local_title, body: s.trust_local_body },
              { icon: '🔒', title: s.trust_gdpr_title, body: s.trust_gdpr_body },
              { icon: '📷', title: s.trust_gps_title, body: s.trust_gps_body },
              { icon: '✕', title: s.trust_nocontract_title, body: s.trust_nocontract_body },
            ].map(item => (
              <div key={item.title} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.text }}>{item.title}</div>
                <div style={{ color: C.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (dark) ── */}
      <section className="sec-pad" style={{ padding: '80px 24px', background: C.accentBg }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="final-h1" style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 14 }}>{s.final_h1}</h2>
          <p style={{ color: '#999', fontSize: 18, marginBottom: 44 }}>{s.final_sub}</p>
          <div className="final-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            <input
              type="email"
              placeholder={s.final_input_placeholder}
              value={heroEmail}
              onChange={e => setHeroEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && heroEmail) router.push('/register?email=' + encodeURIComponent(heroEmail)) }}
              style={{ padding: '14px 18px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 15, minWidth: 280, flex: 1, maxWidth: 340, fontFamily: 'inherit' }}
            />
            <button
              onClick={() => router.push('/register' + (heroEmail ? '?email=' + encodeURIComponent(heroEmail) : ''))}
              style={{ ...ctaStyle, whiteSpace: 'nowrap' }}
            >
              {s.final_cta_btn}
            </button>
          </div>
          <a href="/login" style={{ color: '#fff', fontSize: 13, opacity: 0.6, textDecoration: 'none' }}>{s.final_login_link}</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.accentBg, padding: '24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: '#555', fontSize: 12 }}>{s.footer_company}</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/privacy" style={{ color: '#555', fontSize: 12, textDecoration: 'none' }}>{s.footer_privacy}</a>
            <a href="/terms" style={{ color: '#555', fontSize: 12, textDecoration: 'none' }}>{s.footer_terms}</a>
          </div>
          <div style={{ color: '#555', fontSize: 12 }}>{s.footer_email}</div>
        </div>
      </footer>

      {/* ── JSON-LD SCHEMAS ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"LocalBusiness",
        "name":"LGK Business",
        "description":"Lokalna dostawa kurierska dla restauracji i firm w Szczecinie. GPS potwierdzenie. 10% prowizji.",
        "url":"https://lgk-business.vercel.app",
        "email":"lgkcourierapp@gmail.com",
        "address":{"@type":"PostalAddress","addressLocality":"Szczecin","addressRegion":"Zachodniopomorskie","addressCountry":"PL"},
        "geo":{"@type":"GeoCoordinates","latitude":53.4285,"longitude":14.5528},
        "areaServed":{"@type":"City","name":"Szczecin"},
        "priceRange":"PLN 28 - PLN 429","openingHours":"Mo-Su 06:00-22:00",
        "sameAs":["https://lgk-landing.vercel.app"]
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"Service",
        "name":"Dostawa kurierska dla restauracji i firm",
        "provider":{"@type":"Organization","name":"LGK Holdings Sp. z o.o.","url":"https://lgk-business.vercel.app"},
        "description":"Lokalna dostawa kurierska w Szczecinie. 10% prowizji dla restauracji zamiast 25-30%.",
        "areaServed":{"@type":"City","name":"Szczecin"},
        "offers":{"@type":"AggregateOffer","lowPrice":"28","highPrice":"429","priceCurrency":"PLN"},
        "serviceType":"Courier Delivery Service",
        "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://lgk-business.vercel.app/register"}
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"FAQPage",
        "mainEntity":[
          {"@type":"Question","name":"Ile kosztuje dostawa przez LGK?",
           "acceptedAnswer":{"@type":"Answer","text":"PLN 28 do 3km, PLN 35 za 3-6km, PLN 42 za 6-10km. Dla restauracji dodatkowo 10% prowizji od wartości zamówienia zamiast branżowych 25-30%."}},
          {"@type":"Question","name":"Czy muszę podpisać umowę z LGK?",
           "acceptedAnswer":{"@type":"Answer","text":"Nie. Żadnej umowy, żadnych minimalnych zamówień. Pierwsza dostawa gratis. Anuluj kiedy chcesz."}},
          {"@type":"Question","name":"Jak wygląda potwierdzenie dostawy?",
           "acceptedAnswer":{"@type":"Answer","text":"Każda dostawa jest fotografowana z GPS i znacznikiem czasu. Zdjęcie dostępne w Twoim panelu od razu po dostawie."}},
          {"@type":"Question","name":"Czy LGK dostarcza w całej Polsce?",
           "acceptedAnswer":{"@type":"Answer","text":"Aktualnie działamy w Szczecinie. Rozszerzamy do kolejnych polskich miast w 2026 roku."}}
        ]
      })}} />
    </div>
  )
}
