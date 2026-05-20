/**
 * LGK Business — Email Service
 * Sends transactional emails via Supabase Edge Functions.
 * All calls are fire-and-forget — email failure must never block order placement.
 */

const EDGE_FN_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1';

async function callEdgeFn(fnName, payload) {
  const res = await fetch(`${EDGE_FN_BASE}/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Edge function ${fnName} returned ${res.status}`);
  return res.json();
}

export async function emailOrderConfirmed(delivery, recipientEmail, companyName) {
  return callEdgeFn('send-order-confirmed', {
    orderId: delivery.id,
    recipientEmail,
    companyName,
    pickupAddress: delivery.pickup_address,
    deliveryAddress: delivery.delivery_address,
    timeWindow: delivery.time_window,
    priceTotal: delivery.price_total,
  });
}

export async function emailNewClient(recipientEmail, companyName) {
  return callEdgeFn('send-welcome', { recipientEmail, companyName });
}
