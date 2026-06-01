export const emailTemplates = {

  // Order confirmation — sent to Business Client
  orderConfirmation: {
    pl: {
      subject: 'Zlecenie #{orderNumber} przyjęte — LGK Courier',
      heading: 'Zlecenie przyjęte',
      body: `Twoje zlecenie #{orderNumber} zostało przyjęte i trafiło do puli zleceń dla kurierów w Szczecinie.

Odbiór: {pickupAddress}
Dostawa: {deliveryAddress}
Odbiorca: {recipientName}

Średni czas przyjęcia zlecenia przez kuriera: 3–8 minut.

Śledź dostawę w portalu: {portalLink}`,
      footer: 'LGK Courier · lgk-business.vercel.app · lgkcourierapp@gmail.com',
    },
    en: {
      subject: 'Order #{orderNumber} received — LGK Courier',
      heading: 'Order received',
      body: `Your order #{orderNumber} has been received and added to the courier pool in Szczecin.

Pickup: {pickupAddress}
Delivery: {deliveryAddress}
Recipient: {recipientName}

Average time for a courier to claim: 3–8 minutes.

Track your delivery in the portal: {portalLink}`,
      footer: 'LGK Courier · lgk-business.vercel.app · lgkcourierapp@gmail.com',
    },
  },

  // Delivery confirmed — sent to Business Client when delivered
  deliveryConfirmed: {
    pl: {
      subject: 'Dostarczone ✓ — Zlecenie #{orderNumber}',
      heading: 'Dostawa zakończona',
      body: `Zlecenie #{orderNumber} zostało dostarczone.

Adres: {deliveryAddress}
Godzina dostawy: {deliveredAt}
Kurier: {courierName}

Zdjęcie GPS jest dostępne w portalu: {proofPhotoLink}`,
      footer: 'LGK Courier · lgk-business.vercel.app',
    },
    en: {
      subject: 'Delivered ✓ — Order #{orderNumber}',
      heading: 'Delivery complete',
      body: `Order #{orderNumber} has been delivered.

Address: {deliveryAddress}
Delivery time: {deliveredAt}
Courier: {courierName}

GPS proof photo available in the portal: {proofPhotoLink}`,
      footer: 'LGK Courier · lgk-business.vercel.app',
    },
  },

  // Welcome email — sent on registration
  welcome: {
    pl: {
      subject: 'Witaj w LGK Business — Pierwsza dostawa gratis',
      heading: 'Witaj w LGK Business',
      body: `Twoje konto zostało utworzone.

Złóż pierwsze zlecenie przez portal:
{portalLink}

Pierwsza dostawa jest całkowicie gratis.
GPS potwierdzenie dołączone do każdej dostawy.

Masz pytania? Napisz: lgkcourierapp@gmail.com`,
      footer: 'LGK Courier · lgk-business.vercel.app',
    },
    en: {
      subject: 'Welcome to LGK Business — First delivery free',
      heading: 'Welcome to LGK Business',
      body: `Your account has been created.

Place your first order through the portal:
{portalLink}

Your first delivery is completely free.
GPS proof included with every delivery.

Questions? Email: lgkcourierapp@gmail.com`,
      footer: 'LGK Courier · lgk-business.vercel.app',
    },
  },

  // Account deleted — GDPR confirmation
  accountDeleted: {
    pl: {
      subject: 'Twoje konto LGK zostało usunięte',
      heading: 'Konto usunięte',
      body: `Potwierdzamy usunięcie Twojego konta LGK Business zgodnie z żądaniem.

Twoje dane osobowe zostały usunięte w ciągu 30 dni zgodnie z RODO Art. 17.

Dane finansowe są przechowywane przez 5 lat zgodnie z wymogami polskiego prawa rachunkowego.

Jeśli masz pytania: lgkcourierapp@gmail.com`,
      footer: 'LGK Holdings Sp. z o.o. (w organizacji) · Szczecin',
    },
    en: {
      subject: 'Your LGK account has been deleted',
      heading: 'Account deleted',
      body: `We confirm deletion of your LGK Business account as requested.

Your personal data has been deleted within 30 days in accordance with GDPR Art. 17.

Financial records are retained for 5 years as required by Polish accounting law.

Questions: lgkcourierapp@gmail.com`,
      footer: 'LGK Holdings Sp. z o.o. (w organizacji) · Szczecin',
    },
  },

  // Courier weekly earnings summary
  courierWeeklyEarnings: {
    pl: {
      subject: 'Twoje zarobki z tego tygodnia — LGK Courier',
      heading: 'Podsumowanie tygodnia',
      body: `Cześć {courierName},

Zarobki za tydzień {weekStart}–{weekEnd}:

Dostawy: {deliveryCount}
Łączne zarobki: PLN {totalEarnings}
Przebieg: {mileageKm} km

Kody BRAMA dodane: {intelCount}

Wypłata: poniedziałek na Twoje konto {paymentAccount}

Śledź zarobki w aplikacji.`,
      footer: 'LGK Courier · Szczecin',
    },
    en: {
      subject: 'Your earnings this week — LGK Courier',
      heading: 'Weekly summary',
      body: `Hi {courierName},

Earnings for week {weekStart}–{weekEnd}:

Deliveries: {deliveryCount}
Total earnings: PLN {totalEarnings}
Mileage: {mileageKm} km

BRAMA codes added: {intelCount}

Payout: Monday to your account {paymentAccount}

Track earnings in the app.`,
      footer: 'LGK Courier · Szczecin',
    },
    uk: {
      subject: 'Ваш заробіток цього тижня — LGK Courier',
      heading: 'Підсумок тижня',
      body: `Привіт {courierName},

Заробіток за тиждень {weekStart}–{weekEnd}:

Доставки: {deliveryCount}
Загальний заробіток: PLN {totalEarnings}
Пробіг: {mileageKm} км

Коди BRAMA додано: {intelCount}

Виплата: понеділок на ваш рахунок {paymentAccount}

Відстежуйте заробіток у додатку.`,
      footer: 'LGK Courier · Щецін',
    },
  },
}

export const getEmailTemplate = (templateName, lang = 'pl', vars = {}) => {
  const template = emailTemplates[templateName]
  if (!template) return null

  const l = template[lang] || template.pl
  let body = l.body
  Object.entries(vars).forEach(([k, v]) => {
    body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  })

  return { subject: l.subject, heading: l.heading, body, footer: l.footer }
}

export default emailTemplates
