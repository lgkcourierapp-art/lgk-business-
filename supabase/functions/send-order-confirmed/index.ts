import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lgk-business.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      orderId,
      recipientEmail,
      companyName,
      pickupAddress,
      deliveryAddress,
      timeWindow,
      priceTotal,
    } = await req.json()

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'recipientEmail is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;letter-spacing:3px;color:#D4FF00;background:#0A0A0A;padding:6px 12px;border-radius:6px">LGK</span>
        </div>
        <h1 style="font-size:20px;font-weight:700;color:#0A0A0A;margin:0 0 8px">
          Order confirmed
        </h1>
        <p style="color:#6B7280;font-size:14px;margin:0 0 24px">
          Hi ${companyName || 'there'}, your order has been placed.
        </p>
        <div style="background:#F9FAFB;border-radius:10px;padding:20px;margin-bottom:20px">
          <div style="margin-bottom:12px">
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Order ID</div>
            <div style="font-size:13px;font-family:monospace;color:#0A0A0A">${orderId}</div>
          </div>
          <div style="margin-bottom:12px">
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Pickup</div>
            <div style="font-size:13px;color:#0A0A0A">${pickupAddress || '—'}</div>
          </div>
          <div style="margin-bottom:12px">
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Delivery</div>
            <div style="font-size:13px;color:#0A0A0A">${deliveryAddress || '—'}</div>
          </div>
          ${timeWindow ? `<div style="margin-bottom:12px">
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Time window</div>
            <div style="font-size:13px;color:#0A0A0A">${timeWindow}</div>
          </div>` : ''}
          ${priceTotal ? `<div>
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Amount due</div>
            <div style="font-size:18px;font-weight:700;color:#0A0A0A">PLN ${Number(priceTotal).toFixed(2)}</div>
          </div>` : ''}
        </div>
        <p style="font-size:12px;color:#9CA3AF;margin:0">
          LGK Courier · lgk.pl
        </p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LGK Courier <noreply@lgk.pl>',
        to: recipientEmail,
        subject: `Order confirmed — ${orderId?.slice(-8)?.toUpperCase() || 'LGK'}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
