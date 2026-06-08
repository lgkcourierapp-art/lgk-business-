import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — LGK Courier',
  description: 'LGK Holdings Sp. z o.o. Terms of Service, Version 1.3 — June 2026',
}

const EMAIL = 'lgkcourierapp@gmail.com'

const body = {
  color: '#555',
  fontSize: 14,
  lineHeight: 1.8,
  whiteSpace: 'pre-line',
  margin: 0,
}

const sub = {
  color: '#555',
  fontSize: 14,
  lineHeight: 1.8,
  margin: 0,
}

const h2style = { fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }
const h3style = { fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#333', marginTop: 20 }

function S({ h, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={h2style}>{h}</h2>
      {children}
    </div>
  )
}

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

export default function TermsPage() {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0A0A0A' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 900, padding: '4px 10px', borderRadius: 20, fontSize: 14 }}>L°</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>LGK Business</span>
          </Link>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>Terms of Service</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>LGK Holdings Sp. z o.o. (w organizacji)</p>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>Version 1.3 — June 2026</p>

        <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: 8, padding: '14px 16px', marginBottom: 48 }}>
          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, margin: 0 }}>
            These Terms of Service form a legally binding agreement between you and LGK Holdings Sp. z o.o. (w organizacji). By registering an account, downloading the LGK Courier app, or placing an order through the LGK Business Portal, you confirm that you have read, understood, and accept these Terms in full. If you do not accept these Terms you must not use the Platform.
          </p>
        </div>

        <S h="1. Parties and Definitions">
          <p style={body}>{`1.1 "LGK", "we", "us", "our" means LGK Holdings Sp. z o.o. (w organizacji), registered in Szczecin, Poland.
Contact: ${EMAIL}
1.2 "Business Client" — company or individual using the LGK Business Portal to place delivery orders.
1.3 "Courier" — independent contractor using the LGK Courier app to fulfil delivery orders.
1.4 "Platform" — LGK Business Portal, LGK Courier app, and all associated APIs and systems.
1.5 "Delivery" — single collection and transportation of goods from Pickup Address to Delivery Address within the Service Area.
1.6 "BRAMA INTEL" — community-sourced building access intelligence database including gate codes, parking tips, building access notes, and warden schedule information.
1.7 "Order" — confirmed delivery request submitted through the Business Portal.
1.8 "Proof Photo" — GPS-timestamped photograph taken by a Courier at point of delivery as evidence of completion.
1.9 "Service Area" — Szczecin, Poland and surrounding area. LGK may extend or reduce the Service Area with reasonable notice.
1.10 "Misconduct" — any behaviour violating these Terms, Polish law, or professional standards expected of Platform participants.`}</p>
        </S>

        <S h="2. Nature of the Service and LGK's Role">
          <p style={body}>{`2.1 LGK operates as a technology intermediary. LGK is not a carrier, freight forwarder, or transport company within the meaning of Polish transport law (Prawo przewozowe, 1984).
2.2 Couriers are independent contractors — not employees, agents, or representatives of LGK.
2.3 LGK does not guarantee Courier availability or Order completion.
2.4 The delivery contract is between the Business Client and the Courier. LGK facilitates this relationship but is not a party to it.
2.5 Nothing in these Terms creates an employment relationship, partnership, or agency between LGK and any Courier.`}</p>
        </S>

        <S h="3. Account Registration and Eligibility">
          <p style={body}>{`3.1 You must be at least 18 years of age and legally capable of entering contracts under Polish law.
3.2 You must provide accurate registration information. LGK reserves the right to verify identity and legal status.
3.3 Couriers operating commercially must provide their NIP number and confirm their legal right to work in Poland.
3.4 You are responsible for your account credentials. Notify ${EMAIL} immediately if you suspect unauthorised access.
3.5 One account per person or entity. Creating multiple accounts to circumvent suspension or restrictions is a material breach and grounds for permanent ban.
3.6 LGK reserves the right to decline registration without reasons.
3.7 Anonymous access to the Platform is permitted for a single device-bound session not exceeding 30 days. After 30 days, registration is required to continue using the Platform. BRAMA INTEL contributions made during anonymous sessions are held in pending status and will not become visible to other users until the Courier registers a full account.`}</p>
        </S>

        <S h="4. Business Client Obligations">
          <p style={body}>{`4.1 By placing an Order, the Business Client warrants that:
a) Goods are legally permitted for transport under Polish law
b) Pickup and delivery addresses are accurate and complete
c) Goods are adequately packaged for normal handling
d) Goods do not require specialist handling not disclosed at ordering
e) The recipient is aware of and available for the delivery
f) The Business Client has informed the recipient that their delivery is being handled by LGK and that a GPS Proof Photo will be taken at the point of delivery

4.2 PROHIBITED GOODS — grounds for immediate account suspension:
— Illegal substances or controlled substances under Polish criminal law
— Weapons, firearms, ammunition, or explosives
— Hazardous materials under ADR regulations
— Live animals of any kind
— Human remains or biological specimens
— Counterfeit or IP-infringing goods
— Cash exceeding PLN 10,000 per delivery
— Any item requiring a specialist carrier licence

4.3 The Business Client is liable for all loss, damage, fines, or legal consequences arising from prohibited or undisclosed goods.

4.4 Business Clients must not contact Couriers outside the Platform for delivery-related purposes, and must not engage Couriers for off-platform work during registration and for 12 months following account termination.`}</p>
        </S>

        <S h="4.5.1 Package Size Categories">
          <p style={body}>{`By placing an Order, the Business Client warrants that the package size category declared at the time of ordering accurately reflects the actual size and weight of the goods to be collected, taking into account both actual weight and volumetric weight as defined in Section 4.5.1a.

A package falls within a category only where BOTH its actual weight AND its maximum dimensions fall within the stated limits, AND its volumetric weight does not exceed the billing weight threshold for that category. The most restrictive criterion governs.`}</p>

          <h3 style={h3style}>KOPERTA / MAŁA</h3>
          <p style={body}>{`Maximum actual weight: 2 kg
Maximum dimensions: 30 cm × 24 cm × 3 cm
Maximum longest single side: 30 cm
Volumetric weight limit: 0.4 kg
Examples: Documents, keys, phone, jewellery, SIM cards, thin envelopes
Price multiplier: 0.80 (discounted from standard)`}</p>

          <h3 style={h3style}>STANDARDOWA</h3>
          <p style={body}>{`Maximum actual weight: 10 kg
Maximum dimensions: 60 cm × 40 cm × 40 cm
Maximum longest single side: 60 cm
Volumetric weight limit: 19.2 kg
Examples: Clothes, shoes, electronics, food orders, books, small appliances
Price multiplier: 1.00 (baseline)`}</p>

          <h3 style={h3style}>DUŻA</h3>
          <p style={body}>{`Maximum actual weight: 30 kg
Maximum dimensions: 120 cm × 60 cm × 60 cm
Maximum longest single side: 120 cm
Volumetric weight limit: 86.4 kg
Examples: Microwave, monitor, large suitcase, bicycle parts, rolled items
Price multiplier: 1.60 (premium)
Vehicle: Cargo bike or car required`}</p>

          <h3 style={h3style}>NIESTANDARDOWA</h3>
          <p style={body}>{`Actual weight exceeds: 30 kg, OR any single dimension exceeds 120 cm, OR volumetric weight exceeds 86.4 kg
Examples: Sofa, pallets, white goods, machinery
Pricing: Individual quote — contact LGK directly
Vehicle: Van required`}</p>
        </S>

        <S h="4.5.1a Volumetric Weight">
          <p style={body}>{`Volumetric weight is a standard logistics calculation that accounts for the space a package occupies regardless of its actual weight. It is calculated as follows:

  Volumetric weight (kg) = Length (cm) × Width (cm) × Height (cm) ÷ 5,000

This is the same volumetric weight divisor used by DPD Poland, InPost, DHL, and GLS. Business Clients familiar with these carriers will recognise this standard.`}</p>

          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Package</th>
                  <th style={thStyle}>Actual weight</th>
                  <th style={thStyle}>Dimensions (cm)</th>
                  <th style={thStyle}>Vol. weight</th>
                  <th style={thStyle}>Category</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>A4 documents</td><td style={tdStyle}>0.3 kg</td><td style={tdStyle}>30 × 24 × 2</td><td style={tdStyle}>0.29 kg</td><td style={tdStyle}>Koperta</td></tr>
                <tr><td style={tdStyle}>Smartphone</td><td style={tdStyle}>0.2 kg</td><td style={tdStyle}>16 × 8 × 2</td><td style={tdStyle}>0.05 kg</td><td style={tdStyle}>Koperta</td></tr>
                <tr><td style={tdStyle}>Laptop</td><td style={tdStyle}>2.5 kg</td><td style={tdStyle}>40 × 30 × 5</td><td style={tdStyle}>1.20 kg</td><td style={tdStyle}>Standardowa</td></tr>
                <tr><td style={tdStyle}>Rolled poster</td><td style={tdStyle}>0.2 kg</td><td style={tdStyle}>100 × 10 × 10</td><td style={tdStyle}>2.00 kg</td><td style={tdStyle}>Standardowa</td></tr>
                <tr><td style={tdStyle}>Cushion</td><td style={tdStyle}>0.8 kg</td><td style={tdStyle}>50 × 50 × 20</td><td style={tdStyle}>10.00 kg</td><td style={tdStyle}>Standardowa</td></tr>
                <tr><td style={tdStyle}>Microwave</td><td style={tdStyle}>12.0 kg</td><td style={tdStyle}>60 × 50 × 40</td><td style={tdStyle}>24.00 kg</td><td style={tdStyle}>Duża (vol)</td></tr>
                <tr><td style={tdStyle}>Suitcase</td><td style={tdStyle}>8.0 kg</td><td style={tdStyle}>70 × 50 × 30</td><td style={tdStyle}>21.00 kg</td><td style={tdStyle}>Duża (vol)</td></tr>
                <tr><td style={tdStyle}>Monitor</td><td style={tdStyle}>7.0 kg</td><td style={tdStyle}>80 × 50 × 15</td><td style={tdStyle}>12.00 kg</td><td style={tdStyle}>Duża (vol)</td></tr>
                <tr><td style={tdStyle}>Bicycle</td><td style={tdStyle}>12.0 kg</td><td style={tdStyle}>180 × 60 × 30</td><td style={tdStyle}>64.80 kg</td><td style={tdStyle}>Niestandardowa</td></tr>
              </tbody>
            </table>
          </div>

          <p style={{ ...sub, marginTop: 12 }}>{`The "Rolled poster" example illustrates the importance of volumetric weight: at 0.2 kg actual weight it appears to be a Koperta item, but its 100 cm length means it physically cannot be carried as a Koperta. The volumetric weight (2.0 kg) correctly classifies it as Standardowa.

The "Cushion" example illustrates the same principle: 0.8 kg actual weight would suggest Koperta, but the volumetric weight (10.0 kg) correctly classifies it as Standardowa.`}</p>
        </S>

        <S h="4.5.1b Billing Weight">
          <p style={body}>{`The "billing weight" for any package is the higher of:

  (a) The actual weight in kilograms; or
  (b) The volumetric weight calculated under Section 4.5.1a

The billing weight determines the applicable size category and therefore the applicable price multiplier for that Order.

Where a Business Client declares dimensions via the Platform's optional dimension input fields, the Platform will calculate the volumetric weight automatically and display the billing weight and suggested size category before the Order is placed.

Where a Business Client does not declare dimensions, the Business Client nonetheless warrants that the actual package dimensions do not exceed the limits for the declared size category and that the volumetric weight does not exceed the billing weight threshold for that category.`}</p>
        </S>

        <S h="4.5.2 Material Inaccuracies">
          <p style={body}>{`The following constitute material inaccuracies for the purposes of the size mismatch procedure in Section 4.6:

a) Declaring a smaller size category than the actual package as determined by actual weight, dimensions, or volumetric weight under Sections 4.5.1, 4.5.1a, and 4.5.1b

b) Failing to disclose that a package requires two-person handling due to weight or unwieldy dimensions

c) Declaring actual weight that understates the true weight by more than 20% of the declared category maximum

d) Declaring dimensions that understate the true dimensions such that the correct billing weight would place the package in a higher size category

e) Failing to disclose that a package is a rolled, folded, or irregularly shaped item whose longest dimension exceeds the maximum for the declared category`}</p>
        </S>

        <S h="4.5.5 Platform Dimension Tool">
          <p style={body}>{`The Platform provides an optional dimension and weight input tool within the Order creation flow. Where a Business Client enters package dimensions and weight, the Platform will:

a) Calculate the volumetric weight automatically
b) Calculate the billing weight (higher of actual and volumetric)
c) Display the suggested size category based on billing weight
d) Automatically update the selected size category to reflect the correct classification

The Platform's suggested size category is advisory. The Business Client remains responsible for accurate declaration under Section 4.5.1. Use of the dimension tool does not limit LGK's right to apply the mismatch procedure under Section 4.6 where the Courier finds a material discrepancy at the point of collection.

Where a Business Client uses the dimension tool and the Platform auto-selects a size category, this constitutes the Business Client's declaration for the purposes of Section 4.5.1.`}</p>
        </S>

        <S h="4.7.1 Size Mismatch Surcharge">
          <p style={body}>{`Where the Business Client approves the mismatch under Section 4.6.2 Step 3 Option A, a surcharge is applied automatically to the Order total.

The surcharge is calculated as follows:

  Surcharge = Correct price (actual size) − Original price (declared size)

Where the correct price is calculated using the actual size category's price multiplier applied to the same base delivery cost (distance and base rate) as the original Order. Insurance and processing fees (embedded in all prices) are not duplicated in the surcharge calculation.

Example:
  Original Order: Standardowa, 3 km road distance — PLN 23.95
  Actual size: Duża (multiplier 1.6)
  Correct price: PLN 23.95 ÷ 1.0 × 1.6 = PLN 38.32 → PLN 38.95
  Surcharge: PLN 38.95 − PLN 23.95 = PLN 15.00

The surcharge is added to the Business Client's account balance and settled via the next payment cycle or via immediate payment as shown in the portal.`}</p>
        </S>

        <S h="4.8 Distance-Based Pricing">
          <p style={body}>{`4.8.1 ROAD DISTANCE CALCULATION

All delivery prices are calculated using the actual road distance between the pickup address and the delivery address, as determined by LGK's routing system at the time of Order placement.

Road distance is calculated for the bicycle route between the two addresses, reflecting the actual route a Courier would travel. Road distance is consistently longer than straight-line (as-the-crow-flies) distance due to road networks, one-way systems, and urban geography.

LGK uses HERE Technologies routing data for distance calculation. The road distance is displayed to the Business Client during the Order creation process before the Order is confirmed.

4.8.2 PRICING FORMULA

The delivery price for an Order is calculated as follows:

  Base delivery cost = PLN 12.00 (base) + (road distance km × PLN 2.50)
  Adjusted cost     = Base delivery cost × size multiplier
  Add-ons           = Fragile handling (PLN 5.00) + Refrigerated (PLN 10.00) where applicable
  Final price       = Adjusted cost + add-ons + embedded fees

Note: The Final price includes embedded insurance and platform processing fees which are not itemised separately on the Order summary.

4.8.3 MINIMUM DISTANCE

A minimum billing distance of 0.1 kilometres applies to all Orders regardless of the actual distance between pickup and delivery addresses.

4.8.4 DISTANCE DISPLAYED

The road distance in kilometres is displayed to the Business Client on the Order summary screen (Steps 3 and 4 of the Order creation flow) before the Order is confirmed. The Business Client's confirmation of the Order constitutes acceptance of the displayed distance and price.

4.8.5 PRICE DISPLAYED

All prices displayed to Business Clients on the Platform are inclusive of all applicable fees and are expressed in Polish złoty (PLN).`}</p>
        </S>

        <S h="5. Courier Obligations and Standards of Conduct">
          <p style={body}>{`5.1 Couriers confirm and warrant that they:
a) Are legally entitled to work in Poland
b) Operate as an independent contractor, not an LGK employee
c) Are solely responsible for their own tax obligations and ZUS
d) Hold valid personal liability insurance
e) Hold valid driving licence and vehicle OC insurance (motor vehicles)
f) Are physically capable of performing accepted deliveries
g) Are free to accept or decline any Order at their discretion and are not penalised by LGK for declining Orders

5.2 During each working session, Couriers must:
a) Collect and deliver only to confirmed Platform addresses
b) Take a GPS-timestamped Proof Photo before marking each delivery complete
c) Handle goods with reasonable professional care
d) Contact the Business Client promptly if delivery cannot be completed
e) Report traffic incidents, damage, or safety concerns to LGK within 2 hours

5.3 Couriers must never:
a) Deliver to an address different from the confirmed Platform address without explicit written instruction via the Platform
b) Open, tamper with, or inspect package contents
c) Accept payment for a delivery outside the Platform
d) Share BRAMA INTEL codes outside the Platform
e) Operate an unroadworthy, uninsured, or illegally operated vehicle
f) Operate the Platform while under the influence of alcohol, drugs, or any impairing substance
g) Represent themselves as LGK employees or agents

5.4 MISCONDUCT — grounds for immediate suspension and permanent removal:
a) Theft, fraud, or dishonesty in any form
b) Physical or verbal abuse of recipients, Business Clients, or LGK staff
c) Harassment, discrimination, or threatening behaviour
d) Falsifying Proof Photos, delivery confirmations, or any Platform data
e) Sharing account credentials with any third party
f) Operating multiple accounts or accounts on behalf of others
g) Any activity bringing LGK into disrepute
h) Relevant criminal conviction during registration period
i) Providing false information during registration or at any time
j) Systematic failure to meet delivery standards resulting in sustained negative client feedback

5.5 LGK operates a rating and performance monitoring system. Couriers consistently below platform standards may face reduced job prioritisation, suspension, or removal.

5.6 KARMA AND INTEL DATA — Karma scores, BRAMA INTEL contributions, milestone status, and platform reputation are properties of the Platform. They cannot be transferred, sold, or claimed upon termination. Contributed BRAMA INTEL is anonymised on account deletion but remains in the community database.`}</p>
        </S>

        <S h="6. Pricing, Payment, and Invoicing">
          <p style={body}>{`6.1 Pricing published at lgk-business.vercel.app. LGK may amend pricing with 14 days' written notice.
6.2 Subscription tiers (Starter, Business, Fleet) as published at registration. Tier changes require 30 days' notice.
6.3 Payment processing and earnings disbursement are handled by licensed financial institutions and payment service providers. LGK does not store card numbers, IBAN details, or payment credentials on its own servers.
6.4 All prices are net of Polish VAT (23%). VAT invoices issued on request.
6.5 Courier earnings are paid weekly every Monday. LGK may:
a) Withhold payment for deliveries under active dispute investigation
b) Deduct confirmed losses directly caused by Courier breach
c) Suspend earnings payments to suspended or investigated accounts
6.6 Couriers are solely responsible for declaring and paying income tax and ZUS contributions on all Platform earnings.
6.7 LGK's platform commission is deducted from gross delivery fee before Courier payout.`}</p>
        </S>

        <S h="7. Limitation of Liability">
          <p style={body}>{`7.1 LGK'S MAXIMUM FINANCIAL LIABILITY per party is limited to:
a) Per individual Delivery: PLN 500
b) Aggregate per Business Client per calendar month: PLN 5,000
c) Aggregate per Courier per calendar month: PLN 2,000

7.2 LGK accepts no liability for:
a) Loss of business, revenue, profit, or any indirect loss
b) Damage where adequate packaging was not provided
c) Delays from incorrect addresses, inaccessible locations, or unavailable recipients
d) Loss from prohibited goods
e) Accuracy or reliability of BRAMA INTEL codes
f) Any act or omission of a Courier as independent contractor
g) Platform downtime where reasonable precautions were taken
h) Force majeure events

7.3 Nothing limits liability for death or personal injury from negligence, fraud, or any liability that cannot be excluded under Polish law.`}</p>
        </S>

        <S h="8. Claims Procedure">
          <p style={body}>{`8.1 LGK's maximum financial liability per delivery is PLN 500. This is a contractual liability cap, not a regulated insurance product. Business Clients requiring insurance for higher-value items must arrange their own commercial insurance.
8.2 To make a claim:
a) Submit to ${EMAIL} within 24 hours of scheduled delivery time
b) Provide photographic evidence of damage
c) Retain damaged goods for inspection for 14 days
8.3 Claims declined where: goods inadequately packaged, goods prohibited, Proof Photo confirms correct delivery, claim submitted outside 24-hour window, damage from inherent nature of undeclared goods.
8.4 Enhanced coverage available on request.`}</p>
        </S>

        <S h="9. BRAMA INTEL">
          <p style={body}>{`9.1 BRAMA INTEL is a community intelligence system contributed voluntarily by Couriers.
9.2 By contributing Intel, the Courier:
a) Grants LGK a perpetual, irrevocable, royalty-free licence to store, verify, display, and share that Intel
b) Confirms the Intel was lawfully obtained
c) Acknowledges Intel is anonymised but not deleted on account deletion
d) Confirms in-app consent was provided at submission
9.3 LGK makes no warranty as to accuracy or reliability of BRAMA INTEL. Use is at Courier's own risk.
9.4 BRAMA INTEL is proprietary to the Platform. It may not be extracted, exported, shared, sold, or disclosed outside the Platform.
9.5 Codes expire automatically after 90 days.
9.6 Any Courier using building access codes for purposes other than professional delivery — including unauthorised building entry — is in breach of Polish criminal law (Article 193 Kodeks Karny — naruszenie miru domowego) and will be permanently removed from the Platform. LGK will cooperate fully with law enforcement in any such investigation.`}</p>
        </S>

        <S h="10. Suspension and Termination">
          <p style={body}>{`10.1 LGK may immediately suspend any account without notice where:
a) Reasonable suspicion of fraud, theft, or criminal activity
b) Active dispute or investigation involving the account
c) Breach posing risk to other Platform users or LGK
d) Pattern of serious complaints (Couriers)
e) Outstanding unpaid invoices (Business Clients)
f) Law enforcement request requiring suspension
10.2 Suspended accounts notified by email. Investigation concluded within 14 business days unless referred to law enforcement.
10.3 Following investigation LGK may: reinstate, permanently terminate, or refer to Polish law enforcement.
10.4 PERMANENT TERMINATION where:
a) Misconduct in Section 5.4 confirmed
b) Relevant criminal conviction received
c) False registration information confirmed
d) Systematic fraud or Platform abuse confirmed
e) Business Client repeatedly submits prohibited goods
f) Required by law or court order
10.5 Upon permanent termination: all Platform access immediately revoked; pending earnings may be withheld; account holder may not re-register without LGK's explicit written consent.
10.6 VOLUNTARY TERMINATION — via Settings → Delete Account. 4-step confirmation process. Data processed per Privacy Policy.
10.7 APPEAL — written appeal to ${EMAIL} within 14 days. LGK will provide written reasons for appeal outcome within 14 business days. LGK's appeal decision is final within the Platform.`}</p>
        </S>

        <S h="11. Data Protection">
          <p style={body}>{`11.1 Data processed per GDPR (EU 2016/679) and Polish Act on Personal Data Protection (2018). Full details at lgk-business.vercel.app/privacy.
11.2 GPS location data processed during active working sessions only. Not stored historically after session completion. Explicit consent obtained before first working session.
11.3 Business Clients submitting recipient personal data are data controllers for that data. LGK processes it as data processor under Article 28 GDPR. A Data Processing Agreement (Umowa Powierzenia) is available on request and must be executed before commercial volume use.
11.4 Proof Photos processed solely for delivery verification and dispute resolution.`}</p>
        </S>

        <S h="12. Intellectual Property">
          <p style={body}>{`12.1 All Platform IP — software, design, branding, algorithms, BRAMA INTEL database — is the exclusive property of LGK Holdings Sp. z o.o.
12.2 You receive a limited, personal, non-exclusive, non-transferable, revocable licence to use the Platform for its intended purpose. Terminates immediately on account termination.
12.3 You must not copy, reverse engineer, decompile, distribute, or create derivative works from any Platform element.`}</p>
        </S>

        <S h="13. Platform Availability">
          <p style={body}>{`13.1 LGK operates on a best-efforts basis. No guarantee of uninterrupted availability.
13.2 Material feature changes communicated with reasonable notice.
13.3 Updated Terms published on Platform and communicated by email. Continued use after effective date constitutes acceptance.
13.4 Changes materially affecting Courier earnings: 60 days' notice.`}</p>
        </S>

        <S h="14. Google Play">
          <p style={body}>{`14.1 Google LLC is not a party to these Terms and has no obligations to Couriers regarding the LGK Courier app. Google Play's terms govern the relationship between you and Google LLC separately.`}</p>
        </S>

        <S h="15. Prohibited Uses">
          <p style={body}>{`You must not use the Platform to:
a) Engage in unlawful activity under Polish or EU law
b) Transmit malicious code or disrupt Platform infrastructure
c) Attempt unauthorised access to any Platform system
d) Scrape, harvest, or systematically collect Platform data
e) Impersonate any person or entity
f) Facilitate money laundering, tax evasion, or financial crime`}</p>
        </S>

        <S h="16. Dispute Resolution">
          <p style={body}>{`16.1 Direct resolution first: ${EMAIL} — LGK responds within 5 business days.
16.2 Unresolved after 30 days: jurisdiction of courts competent for Szczecin, Poland.
16.3 Governed by Polish law. CISG does not apply.
16.4 EU consumers may use the ODR platform: ec.europa.eu/consumers/odr
16.5 LGK may seek urgent injunctive relief from competent courts at any time.`}</p>
        </S>

        <S h="17. General Provisions">
          <p style={body}>{`17.1 SEVERABILITY — invalid provisions severed; remainder continues.
17.2 WAIVER — failure to enforce does not waive future enforcement.
17.3 ENTIRE AGREEMENT — these Terms, Privacy Policy, and any DPA constitute the full agreement.
17.4 ASSIGNMENT — LGK may assign on corporate restructuring. Users may not assign without written consent.
17.5 LANGUAGE — published in English and Polish. Polish version prevails for disputes under Polish law.
17.6 CONTACT — legal notices to `}<a href={`mailto:${EMAIL}`} style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'underline' }}>{EMAIL}</a>{`. Deemed received next business day.`}</p>
        </S>

        <div style={{ borderTop: '1px solid #E5E5E5', paddingTop: 24, marginTop: 48, textAlign: 'center', color: '#888', fontSize: 12 }}>
          Last updated: June 2026 · Version 1.3{'\n'}LGK Holdings Sp. z o.o. (w organizacji) · Szczecin, Poland
        </div>
      </div>
    </div>
  )
}
