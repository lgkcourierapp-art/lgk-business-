'use client'
import { useState } from 'react'
import Link from 'next/link'

const STRINGS = {
  pl: {
    toggle: 'EN',
    title: 'Polityka Prywatności',
    company: 'LGK Holdings Sp. z o.o. (w organizacji)',
    updated: 'Zaktualizowano: 27 maja 2026',
    s1_h: '1. Administrator danych',
    s1_b: 'LGK Holdings Sp. z o.o. (w organizacji), Szczecin, Polska.',
    s2_h: '2. Jakie dane zbieramy',
    s2_b: `• Konto: imię i nazwisko, e-mail, nazwa firmy\n• Dostawa: adresy odbioru i dostawy, imię i telefon odbiorcy\n• GPS: lokalizacja kuriera wyłącznie podczas zmiany\n• Zdjęcia z dowodem: zdjęcia z GPS i znacznikiem czasu przy każdej dostawie\n• Rozliczenia: historia zamówień, kwoty płatności\n• Techniczne: IP, typ urządzenia, logi aplikacji`,
    s3_h: '3. Cel przetwarzania',
    s3_b: `• Wykonanie umowy (art. 6 ust. 1 lit. b RODO)\n• Powiadomienia o statusie (prawnie uzasadniony interes)\n• Rozpatrywanie reklamacji (prawnie uzasadniony interes)\n• Zgodność podatkowa (art. 6 ust. 1 lit. c RODO)`,
    s4_h: '4. Przechowywanie danych',
    s4_b: `• Dane konta: do momentu usunięcia\n• GPS kuriera: 90 dni, automatyczne usunięcie\n• Zdjęcia z dowodem: bezterminowo (własność kuriera, Vault)\n• Historia zamówień: 5 lat (prawo podatkowe)\n• Rozliczenia: 5 lat (polskie prawo podatkowe)`,
    s5_h: '5. Twoje prawa (RODO)',
    s5_b_pre: `• Art. 15: prawo dostępu do danych\n• Art. 16: prawo do sprostowania\n• Art. 17: prawo do bycia zapomnianym\n  → realizowane w ciągu 30 dni\n  → zanonimizowane dane statystyczne mogą pozostać\n• Art. 20: prawo do przenoszenia danych (CSV na żądanie)\n• Art. 21: prawo sprzeciwu\n\nKontakt: `,
    s5_b_post: '',
    s6_h: '6. Ochrona danych kurierów',
    s6_b: `• Zarobki NIGDY nie są udostępniane pracodawcom (ograniczenie na poziomie bazy danych)\n• Historia lokalizacji poza zmianą: niedostępna dla nikogo\n• Zdjęcia z dowodem: własność kuriera, dostępne tylko dla kuriera\n• Pracodawcy widzą wyłącznie: status dostawy i znaczniki czasu`,
    s7_h: '7. Podmioty przetwarzające',
    s7_b: `• Supabase Inc. (UE Frankfurt, DPA w miejscu)\n• Stripe Inc. (certyfikat PCI-DSS)\n• Vercel Inc. (serwery UE)\n• Twilio Inc. (SMS, opcjonalnie, wyłącznie za zgodą)`,
    s8_h: '8. Pliki cookie',
    s8_b: 'Wyłącznie niezbędne sesyjne pliki cookie.\nBrak analitycznych ani marketingowych plików cookie bez zgody.',
    s9_h: '9. Przekazywanie danych poza EOG',
    s9_b: 'Supabase UE Frankfurt (EOG).\nStripe / Vercel: standardowe klauzule umowne zatwierdzone przez Komisję Europejską.',
    s10_h: '10. Zmiany polityki',
    s10_b: '30 dni powiadomienia e-mailem przed istotnymi zmianami.',
    s11_h: '11. Kontakt i skargi',
    s11_b_pre: 'E-mail: ',
    s11_b_post: `\nUODO: ul. Stawki 2, 00-193 Warszawa`,
    footer: 'L° LGK Holdings · Szczecin · lgkcourierapp@gmail.com',
  },
  en: {
    toggle: 'PL',
    title: 'Privacy Policy',
    company: 'LGK Holdings Sp. z o.o. (w organizacji)',
    updated: 'Updated: 27 May 2026',
    s1_h: '1. Data Controller',
    s1_b: 'LGK Holdings Sp. z o.o. (w organizacji), Szczecin, Poland.',
    s2_h: '2. What We Collect',
    s2_b: `• Account: name, email, business name\n• Delivery: pickup/delivery addresses, recipient name and phone\n• GPS: courier location during shift only\n• Proof photos: GPS-stamped and timestamped delivery photos\n• Billing: order history, payment amounts\n• Technical: IP address, device type, app logs`,
    s3_h: '3. Purpose',
    s3_b: `• Contract performance (Art. 6(1)(b) GDPR)\n• Status notifications (legitimate interest)\n• Dispute resolution (legitimate interest)\n• Tax compliance (Art. 6(1)(c) GDPR)`,
    s4_h: '4. Retention',
    s4_b: `• Account data: until deletion\n• Courier GPS: 90 days, auto-deleted\n• Proof photos: indefinitely (courier-owned, Vault)\n• Order history: 5 years (tax law)\n• Billing: 5 years (Polish tax law)`,
    s5_h: '5. Your Rights (GDPR)',
    s5_b_pre: `• Art. 15: right of access\n• Art. 16: right to rectification\n• Art. 17: right to erasure ("right to be forgotten")\n  → fulfilled within 30 days\n  → anonymised community intel may remain\n• Art. 20: right to portability (CSV on request)\n• Art. 21: right to object\n\nContact: `,
    s5_b_post: '',
    s6_h: '6. Courier Data Protection',
    s6_b: `• Earnings NEVER shared with employers (database-level constraint)\n• Location history outside shift: inaccessible to anyone\n• Proof photos: courier-owned, accessible only to courier\n• Employers see: delivery status and timestamps only`,
    s7_h: '7. Data Processors',
    s7_b: `• Supabase Inc. (EU Frankfurt, DPA in place)\n• Stripe Inc. (PCI-DSS certified)\n• Vercel Inc. (EU servers)\n• Twilio Inc. (SMS, optional, consent only)`,
    s8_h: '8. Cookies',
    s8_b: 'Strictly necessary session cookies only.\nNo analytics or marketing cookies without consent.',
    s9_h: '9. International Transfers',
    s9_b: 'Supabase EU Frankfurt (EEA).\nStripe / Vercel: Standard Contractual Clauses approved by the European Commission.',
    s10_h: '10. Policy Changes',
    s10_b: '30 days notice by email before material changes.',
    s11_h: '11. Contact & Complaints',
    s11_b_pre: 'Email: ',
    s11_b_post: `\nUODO: ul. Stawki 2, 00-193 Warszawa`,
    footer: 'L° LGK Holdings · Szczecin · lgkcourierapp@gmail.com',
  },
}

const EMAIL = 'lgkcourierapp@gmail.com'

const bodyStyle = {
  color: '#555',
  fontSize: 14,
  lineHeight: 1.8,
  whiteSpace: 'pre-line',
  margin: 0,
}

const linkStyle = {
  color: '#0A0A0A',
  fontWeight: 600,
  textDecoration: 'underline',
}

export default function PrivacyPage() {
  const [lang, setLang] = useState('pl')
  const s = STRINGS[lang]

  const sections = [
    { h: s.s1_h, b: s.s1_b },
    { h: s.s2_h, b: s.s2_b },
    { h: s.s3_h, b: s.s3_b },
    { h: s.s4_h, b: s.s4_b },
    {
      h: s.s5_h,
      raw: true,
      custom: (
        <p style={bodyStyle}>
          {s.s5_b_pre}
          <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>
          {s.s5_b_post}
        </p>
      ),
    },
    { h: s.s6_h, b: s.s6_b },
    { h: s.s7_h, b: s.s7_b },
    { h: s.s8_h, b: s.s8_b },
    { h: s.s9_h, b: s.s9_b },
    { h: s.s10_h, b: s.s10_b },
    {
      h: s.s11_h,
      raw: true,
      custom: (
        <p style={bodyStyle}>
          {s.s11_b_pre}
          <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>
          {s.s11_b_post}
        </p>
      ),
    },
  ]

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0A0A0A' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 900, padding: '4px 10px', borderRadius: 20, fontSize: 14 }}>L°</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>LGK Business</span>
          </Link>
          <button
            onClick={() => setLang(l => l === 'pl' ? 'en' : 'pl')}
            style={{ background: 'transparent', border: '1px solid #E5E5E5', color: '#555', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
          >
            {s.toggle}
          </button>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{s.title}</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{s.company}</p>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 48 }}>{s.updated}</p>

        {/* Sections */}
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }}>{sec.h}</h2>
            {sec.raw ? sec.custom : <p style={bodyStyle}>{sec.b}</p>}
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: 24, marginTop: 48, textAlign: 'center', color: '#888', fontSize: 12 }}>
          {s.footer}
        </div>
      </div>
    </div>
  )
}
