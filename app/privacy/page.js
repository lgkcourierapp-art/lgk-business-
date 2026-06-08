import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — LGK Courier',
  description: 'LGK Holdings Sp. z o.o. Privacy Policy, Version 1.0 — June 2026',
}

const EMAIL = 'lgkcourierapp@gmail.com'

const body = {
  color: '#555',
  fontSize: 14,
  lineHeight: 1.8,
  whiteSpace: 'pre-line',
  margin: 0,
}

const h2style = { fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }

const thStyle = {
  textAlign: 'left',
  padding: '6px 10px',
  fontWeight: 700,
  color: '#333',
  borderBottom: '2px solid #E5E5E5',
  fontSize: 12,
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '5px 10px',
  color: '#555',
  borderBottom: '1px solid #F0F0F0',
  fontSize: 12,
}

function S({ h, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={h2style}>{h}</h2>
      {children}
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0A0A0A' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 900, padding: '4px 10px', borderRadius: 20, fontSize: 14 }}>L°</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>LGK Business</span>
          </Link>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>Privacy Policy</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>LGK Holdings Sp. z o.o. (w organizacji)</p>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>Version 1.0 — June 2026</p>

        <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: 8, padding: '14px 16px', marginBottom: 48 }}>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, margin: 0 }}>
            This Privacy Policy explains how LGK Holdings Sp. z o.o. (w organizacji) collects, uses, stores, and protects your personal data when you use the LGK Platform — the LGK Business Portal (lgk-business.vercel.app) and the LGK Courier mobile application. Read this document carefully. It is legally binding. If you do not accept this Policy, you must not use the Platform.
          </p>
        </div>

        <S h="1. Data Controller">
          <p style={body}>{`1.1 The data controller responsible for your personal data is:

LGK Holdings Sp. z o.o. (w organizacji)
Szczecin, Poland
Email: ${EMAIL}

1.2 LGK has not yet appointed a formal Data Protection Officer (DPO). The controller contact for all data protection matters is lgkcourierapp@gmail.com.

Note: When LGK reaches the threshold of large-scale systematic processing of courier GPS data at commercial volume, appointment of a DPO becomes mandatory under GDPR Article 37(1)(b). This will be reviewed as the platform scales.

1.3 This Policy applies to:
— Business Clients: companies and individuals using the LGK Business Portal
— Couriers: independent contractors using the LGK Courier app
— Recipients: individuals who receive deliveries arranged through the Platform
— Website visitors: individuals who visit lgk-business.vercel.app`}</p>
        </S>

        <S h="2. Legal Basis for Processing">
          <p style={body}>{`LGK processes personal data on the following legal bases under GDPR Article 6:

2.1 CONTRACT PERFORMANCE (Article 6(1)(b))
Processing is necessary to provide the services you have requested. This covers: account registration, order processing, delivery coordination, earnings payments, and Proof Photo generation.

2.2 LEGITIMATE INTERESTS (Article 6(1)(f))
LGK processes data where it has a legitimate business interest that is not overridden by your rights. This includes: fraud prevention, platform security, audit logging, performance monitoring, and improving the Platform. We have conducted a Legitimate Interests Assessment for each such use.

2.3 LEGAL OBLIGATION (Article 6(1)(c))
Some processing is required by Polish law: financial record-keeping under the Polish Accounting Act (Ustawa o rachunkowości), tax reporting, and responding to lawful law enforcement requests.

2.4 CONSENT (Article 6(1)(a))
Where we rely on consent — specifically for GPS location processing during shifts — we obtain explicit, freely given, specific, and informed consent before processing begins. You may withdraw consent at any time. Withdrawal of GPS consent means you cannot use the Platform during active shifts.

2.5 We do not process special category data (sensitive data under GDPR Article 9) unless you voluntarily disclose health or disability information for operational reasons, in which case we process it with your explicit consent solely for the purpose disclosed.`}</p>
        </S>

        <S h="3. What Data We Collect and Why">
          <p style={body}>{`3.1 BUSINESS CLIENTS

Data collected:
— Full name or company name
— Email address
— Phone number
— Company registration details (NIP, REGON where provided)
— Billing address
— Payment method details (processed and stored by payment provider — LGK does not store card numbers)
— Order history: pickup addresses, delivery addresses, package details, timestamps
— Login credentials (email and hashed password, or Google OAuth token)
— Platform usage data: pages visited, features used, session timestamps
— Company logo (if uploaded)
— Communication records: support messages, emails with LGK

Why: account management, order processing, invoicing, support, fraud prevention, Polish accounting and tax compliance.

3.2 COURIERS

Data collected:
— Full name
— Email address
— Phone number
— Vehicle type
— Bank account details (IBAN) or Revolut username for earnings payments
— NIP number (where operating commercially)
— GPS location data — DURING ACTIVE SHIFTS ONLY (see Section 3.4)
— Delivery history: stops completed, addresses visited, timestamps
— Proof Photos taken during deliveries
— Karma score and performance metrics
— BRAMA INTEL contributions
— Intel Exchange quota and milestone data
— Login credentials (Google OAuth token or anonymous session)
— Device information: device model, OS version, app version
— Communication records with LGK

Why: account management, order matching, earnings payments, delivery verification, BRAMA INTEL system, platform quality, Polish tax reporting compliance.

3.3 RECIPIENTS

Data collected (provided by the Business Client placing the order):
— Name
— Delivery address
— Phone number (for delivery coordination)
— Any delivery notes provided by the Business Client

Why: solely to coordinate and complete the delivery and to generate GPS-verified Proof Photos as evidence of delivery.

Note: LGK is a data processor for recipient data. The Business Client is the data controller. Recipients who wish to exercise their data rights should contact the Business Client who placed the order in the first instance.

3.4 GPS LOCATION DATA — COURIERS

This is the most privacy-sensitive data LGK processes.

What we collect: GPS coordinates of the Courier's device.
When we collect it: ONLY during an active shift — from the moment a Courier starts a shift to the moment they end it.

What we do NOT do:
— We do not track Courier location outside of active shifts
— We do not store GPS location history after shift completion
— We do not share Courier location with employers, Business Clients, or any third party outside the Platform
— We do not use GPS data for purposes other than those disclosed here

What we use it for:
— BRAMA INTEL reveal: gate codes shown only when a Courier is within 100 metres of a building. Enforced at the database level, not just in app.
— Delivery verification: GPS coordinates embedded in Proof Photos
— Mileage logging: aggregate totals to assist Couriers with tax deduction records
— Passive dwell verification: confirming a Courier remained at a location for the minimum time to verify a BRAMA INTEL code

Legal basis: Explicit consent (GDPR Article 6(1)(a)), obtained via the in-app GPS consent screen before the first shift. Consent may be withdrawn at any time via account settings.

3.5 PROOF PHOTOS

GPS-timestamped photographs taken at the point of delivery. They constitute personal data where they depict identifiable individuals.

Who can access them:
— The Courier who took the photo (via their Vault in the app — permanently)
— The Business Client who placed the Order (via their portal for the duration of the order record)
— LGK for dispute resolution and quality assurance

Who cannot access them:
— Employers of couriers without the Courier's explicit consent
— Third parties

The Proof Photo is the Courier's evidence. LGK stores it but does not transfer ownership.

3.6 BRAMA INTEL DATA

Processed under the legitimate interest of operating a community safety and intelligence system for professional couriers. Upon account deletion, the contributing Courier's personal identifier is removed (anonymisation). The Intel code itself remains for community use as set out in the Terms of Service.

3.7 WEBSITE VISITORS

Data collected automatically:
— IP address (anonymised after 7 days)
— Browser type and version
— Pages visited and time spent
— Referral source
— Device type

Why: website functionality, aggregate analytics, security.
We do not use advertising cookies. We do not track you across other websites.`}</p>
        </S>

        <S h="4. How Long We Keep Your Data">
          <p style={body}>{`We keep personal data only as long as necessary for the purpose it was collected, or as required by Polish law.

4.1 ACCOUNT DATA (name, email, phone, login)
Retained while account is active. Deleted within 30 days of account deletion, subject to 4.4 below.

4.2 DELIVERY RECORDS (addresses, timestamps, order details)
Retained for 5 years from completion. Required by Polish accounting law (Ustawa o rachunkowości). After 5 years: permanently deleted.

4.3 PROOF PHOTOS
Retained for 3 years from the date of delivery. Available to the Courier in their Vault indefinitely unless they delete them. Available to the Business Client for 12 months from delivery.

4.4 FINANCIAL RECORDS (invoices, payments, earnings)
Retained for 5 years as required by Polish accounting law. Cannot be deleted on request during the retention period, but access is restricted to authorised LGK personnel and statutory authorities only.

4.5 GPS LOCATION DATA
Not stored after shift completion. Location data is processed in real-time during shifts only and is not retained in identifiable form after the shift ends.

4.6 AUDIT LOG
Retained for 5 years. The audit log is immutable — it cannot be altered or deleted. Individual audit entries are not accessible to general users.

4.7 BRAMA INTEL
Anonymised (contributor identity removed) on account deletion. The code itself is retained for up to 90 days (active) and then for 3 years in anonymised archive form before permanent deletion.

4.8 SUPPORT COMMUNICATIONS
Retained for 3 years from the date of the communication.

4.9 WAITLIST DATA
Retained until the waitlist is closed or until you request removal.`}</p>
        </S>

        <S h="5. Who We Share Your Data With">
          <p style={body}>{`We do not sell your personal data. We do not share it with advertisers. We share it only as follows:

5.1 BETWEEN PLATFORM USERS (operationally necessary)
Business Clients receive: Courier first name, Proof Photo, delivery status, GPS delivery confirmation. They do not receive: Courier earnings, location history, payment details.
Couriers receive: Pickup address, delivery address, recipient name and phone, package details. They do not receive: Business Client financial details, other couriers' data.

5.2 TECHNOLOGY SERVICE PROVIDERS (data processors)
— Supabase Inc. — database hosting and authentication. Servers in EU (Frankfurt). Data Processing Agreement in place.
— Vercel Inc. — web hosting for the Business Portal and landing pages.
— Payment service providers — earnings disbursement and payment processing handled by licensed providers. LGK does not act as a payment institution.
— Expo / EAS — mobile app build and distribution infrastructure.
— Google LLC — OAuth authentication (if sign-in with Google), Google Play distribution.
— Sentry — anonymised crash reports only, no personal delivery data.
All technology service providers are bound by Data Processing Agreements.

5.3 LAW ENFORCEMENT AND REGULATORY AUTHORITIES
Where required by law or a valid court order. LGK will notify you where legally permitted.

5.4 BUSINESS TRANSFERS
In the event of a merger or acquisition, data may transfer to the acquiring entity. You will be notified before transfer.

5.5 WHAT WE NEVER SHARE
— Courier earnings with employers or any third party
— Courier GPS location history with anyone outside the Platform
— Proof Photos with employers without the Courier's explicit consent
— Personal data to data brokers, advertisers, or marketing companies
— BRAMA INTEL in bulk with any third party`}</p>
        </S>

        <S h="6. International Data Transfers">
          <p style={body}>{`6.1 LGK's primary database is hosted by Supabase on servers in Frankfurt, Germany (EU). Your data remains within the EU/EEA in primary storage.

6.2 Some technology service providers (payment processors, Vercel, Google) may process data in the United States or other countries outside the EU/EEA. Where this occurs, we ensure adequate protection through:
— Standard Contractual Clauses (SCCs) approved by the European Commission
— Data Processing Agreements requiring EU-level protection standards

6.3 You have the right to request information about the safeguards in place for any international transfer of your data. Contact ${EMAIL}.`}</p>
        </S>

        <S h="7. Your Rights Under GDPR">
          <p style={body}>{`We will respond to all requests within 30 days. There is no fee unless a request is manifestly unfounded or excessive.

7.1 RIGHT OF ACCESS (Article 15)
Request a copy of all personal data LGK holds about you, the purposes of processing, who it has been shared with, and how long it will be retained.
Email: ${EMAIL} — Subject: "Data Subject Access Request — [your name]"

7.2 RIGHT TO RECTIFICATION (Article 16)
Request correction of inaccurate data. Most profile information can be updated directly within the Platform.

7.3 RIGHT TO ERASURE / RIGHT TO BE FORGOTTEN (Article 17)
Request deletion where data is no longer necessary, consent is withdrawn, or data was unlawfully processed.
Limitations: financial records (5 years) and audit logs (5 years) cannot be deleted under Polish law. We will tell you exactly what can and cannot be deleted.
The Platform's Delete Account function initiates cascade deletion of all deletable personal data within 30 days.

7.4 RIGHT TO RESTRICTION (Article 18)
Request we store but not use your data where accuracy is contested, processing is unlawful, or you have objected and a decision is pending.

7.5 RIGHT TO DATA PORTABILITY (Article 20)
Receive your data in a structured, machine-readable format (JSON). Request via ${EMAIL}.

7.6 RIGHT TO OBJECT (Article 21)
Object to processing based on legitimate interests. You have an absolute right to object to direct marketing (we do not currently send marketing emails).

7.7 RIGHTS RELATED TO AUTOMATED DECISION-MAKING (Article 22)
LGK uses automated systems for order matching and Karma scoring. You have the right to request human review of any automated decision that significantly affects you. Contact ${EMAIL}.

7.8 RIGHT TO WITHDRAW CONSENT
Withdraw GPS consent at any time via Platform settings. Withdrawal does not affect the lawfulness of prior processing.

7.9 RIGHT TO LODGE A COMPLAINT
Urząd Ochrony Danych Osobowych (UODO)
ul. Stawki 2, 00-193 Warszawa
www.uodo.gov.pl · kancelaria@uodo.gov.pl
Phone: +48 22 531 03 00
You may also lodge a complaint with the supervisory authority in your country of residence within the EU.`}</p>
        </S>

        <S h="8. How We Protect Your Data">
          <p style={body}>{`8.1 TECHNICAL MEASURES
— Encryption in transit: HTTPS/TLS on all Platform communications
— Encryption at rest: AES-256 via Supabase infrastructure
— Row Level Security: database-level access controls enforced at the database layer, not just in application code
— Proof Photo storage: private bucket, time-limited signed URLs
— Session tokens: encrypted device storage (expo-secure-store on mobile), not plain text
— Audit logging: immutable, cannot be modified or deleted by any user including LGK administrators

8.2 ORGANISATIONAL MEASURES
— Access control: staff access restricted to role requirements; admin access logged
— Incident response: UODO notified within 72 hours of a breach posing risk to your rights. Affected individuals notified without undue delay where a breach is likely to result in high risk.
— Data minimisation: we collect only what is necessary and regularly review retention`}</p>
        </S>

        <S h="9. Cookies and Tracking">
          <p style={body}>{`9.1 The LGK Business Portal uses strictly necessary cookies only. Session authentication cookies are required for the Platform to function. Legal basis: contract performance.

9.2 The LGK Courier app does not use browser cookies. Sessions are stored in encrypted device storage.

9.3 LGK landing pages do not use advertising or tracking cookies. Server access logs record IP addresses for security and are deleted after 7 days.`}</p>
        </S>

        <S h="10. Children's Data">
          <p style={body}>{`10.1 The Platform is not intended for persons under 18. LGK does not knowingly collect personal data from children.

10.2 If you believe a person under 18 has registered, contact ${EMAIL} immediately. We will delete the account and all associated data promptly.`}</p>
        </S>

        <S h="11. Record of Processing Activities (RoPA)">
          <p style={{ ...body, marginBottom: 12 }}>Under GDPR Article 30, LGK maintains an internal Record of Processing Activities. The key processing activities are summarised below. The full RoPA is available to UODO on request.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Processing activity</th>
                  <th style={thStyle}>Legal basis</th>
                  <th style={thStyle}>Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>Account registration</td><td style={tdStyle}>Contract</td><td style={tdStyle}>Account + 30 days</td></tr>
                <tr><td style={tdStyle}>Order processing</td><td style={tdStyle}>Contract</td><td style={tdStyle}>5 years</td></tr>
                <tr><td style={tdStyle}>GPS location (shifts)</td><td style={tdStyle}>Consent</td><td style={tdStyle}>Not retained after shift</td></tr>
                <tr><td style={tdStyle}>Proof Photos</td><td style={tdStyle}>Contract / Legitimate interest</td><td style={tdStyle}>3 years</td></tr>
                <tr><td style={tdStyle}>Earnings payments</td><td style={tdStyle}>Contract / Legal obligation</td><td style={tdStyle}>5 years</td></tr>
                <tr><td style={tdStyle}>Audit logging</td><td style={tdStyle}>Legitimate interest / Legal obligation</td><td style={tdStyle}>5 years</td></tr>
                <tr><td style={tdStyle}>Performance monitoring</td><td style={tdStyle}>Legitimate interest</td><td style={tdStyle}>Account duration</td></tr>
                <tr><td style={tdStyle}>BRAMA Intel</td><td style={tdStyle}>Legitimate interest + Consent</td><td style={tdStyle}>90 days active, 3 years archive</td></tr>
              </tbody>
            </table>
          </div>
        </S>

        <S h="12. Changes to This Policy">
          <p style={body}>{`12.1 Material changes — particularly changes to what data we collect, how we use it, or with whom we share it — will be communicated by email at least 30 days before taking effect.

12.2 Updated policies will be published at lgk-business.vercel.app/privacy with a clear "Last updated" date. Continued use of the Platform after the effective date constitutes acceptance.

12.3 For changes affecting the legal basis for processing or introducing new categories of personal data: fresh consent sought where required by law.`}</p>
        </S>

        <S h="13. Contact and Complaints">
          <p style={body}>{`For all data protection queries, access requests, or complaints:

Email: `}<a href={`mailto:${EMAIL}`} style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'underline' }}>{EMAIL}</a>{`
Subject: "Data Protection — [your query]"
Response: within 30 days

If not satisfied with LGK's response, you have the right to escalate to:
Urząd Ochrony Danych Osobowych (UODO)
ul. Stawki 2, 00-193 Warszawa, Poland
www.uodo.gov.pl · Phone: +48 22 531 03 00`}</p>
        </S>

        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: 24, marginTop: 48, textAlign: 'center', color: '#888', fontSize: 12 }}>
          Last updated: June 2026 · Version 1.0{'\n'}LGK Holdings Sp. z o.o. (w organizacji) · Szczecin, Poland
        </div>
      </div>
    </div>
  )
}
