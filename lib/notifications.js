const TEMPLATES = {
  order_created: {
    pl: (num) => `Zamówienie ${num} przyjęte. Szukamy kuriera...`,
    en: (num) => `Order ${num} placed. Finding a courier...`,
  },
  courier_assigned: {
    pl: (name, eta) => `Kurier ${name} odbierze paczkę ~${eta}. Śledź: lgk.pl`,
    en: (name, eta) => `Courier ${name} collects at ~${eta}. Track: lgk.pl`,
  },
  picked_up: {
    pl: (eta) => `Paczka odebrana! Kurier jedzie do Ciebie. Dostawa ~${eta}.`,
    en: (eta) => `Package collected! Courier en route. Delivery ~${eta}.`,
  },
  nearby: {
    pl: () => `Kurier jest blisko! Przygotuj się na odbiór paczki.`,
    en: () => `Courier is nearby! Get ready to receive your package.`,
  },
  delivered: {
    pl: (biz) => `Paczka od ${biz} dostarczona. Dziękujemy za korzystanie z LGK!`,
    en: (biz) => `Package from ${biz} delivered. Thank you for using LGK!`,
  },
  failed: {
    pl: (reason) => `Nie udało się dostarczyć paczki. Powód: ${reason}. Skontaktuj się z nadawcą.`,
    en: (reason) => `Delivery failed. Reason: ${reason}. Contact the sender.`,
  },
}

export const logNotification = async ({
  supabase,
  type,
  deliveryId,
  recipientPhone,
  lang = 'pl',
  params = [],
}) => {
  const template = TEMPLATES[type]
  if (!template) return

  const message = (template[lang] || template.pl)(...params)

  await supabase.from('notifications').insert({
    delivery_id: deliveryId,
    type: 'sms',
    recipient_phone: recipientPhone,
    message,
    status: 'pending',
    created_at: new Date().toISOString(),
  }).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS to ${recipientPhone}]: ${message}`)
      console.error('[Notification log error]', err.message)
    }
  })
}
