import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateOrderNumber } from '@/utils/orderNumber'

function extractApiKey(request) {
  const auth = request.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-lgk-api-key')?.trim() ?? null
}

function formatTimeWindow(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch {
    return null
  }
}

function buildDeliveryAddress(addr) {
  if (!addr) return ''
  const parts = [addr.street, addr.city, addr.zip].filter(Boolean)
  return parts.join(', ')
}

export async function POST(request) {
  // 1. Feature flag check
  const { data: flagRow } = await supabaseAdmin
    .from('feature_flags')
    .select('enabled')
    .eq('name', 'gloriaFood_integration')
    .single()

  if (!flagRow?.enabled) {
    return NextResponse.json({ error: 'Integration disabled' }, { status: 503 })
  }

  // 2. Extract and validate API key
  const rawKey = extractApiKey(request)
  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const { data: keyRow, error: keyErr } = await supabaseAdmin
    .from('api_keys')
    .select('id, client_id')
    .eq('key_hash', keyHash)
    .eq('integration_type', 'gloriaFood')
    .eq('is_active', true)
    .single()

  if (keyErr || !keyRow) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Update last_used_at (non-fatal)
  try {
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRow.id)
  } catch (err) {
    console.error('[GloriaFood] Non-critical error updating last_used_at:', err.message)
    // Don't throw — order processing continues
  }

  const clientId = keyRow.client_id

  // 3. Parse payload
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { order_id, customer, items, total_price, estimated_ready_time } = body

  if (!order_id || !customer?.name || !customer?.phone || !customer?.address?.street || !total_price) {
    return NextResponse.json(
      { error: 'Missing required fields: order_id, customer.name, customer.phone, customer.address.street, total_price' },
      { status: 400 }
    )
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[GloriaFood] Order received:', {
      timestamp: new Date().toISOString(),
      clientId,
      externalOrderId: order_id,
    })
  }

  // 3b. Idempotency — check for existing order before doing any work
  const { data: existing } = await supabaseAdmin
    .from('deliveries')
    .select('id, order_number')
    .eq('external_order_id', String(order_id))
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      success: true,
      order_number: existing.order_number,
      message: 'Order already processed',
      duplicate: true,
    }, { status: 200 })
  }

  // 4. Get client pickup address
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('pickup_address, city, postal_code')
    .eq('id', clientId)
    .single()

  // 5. Generate order number
  const pickupCity = profile?.city ?? 'Szczecin'
  const pickupPostal = profile?.postal_code ?? ''
  let orderNumber
  try {
    orderNumber = await generateOrderNumber(supabaseAdmin, pickupCity, pickupPostal)
  } catch {
    orderNumber = null
  }

  if (!orderNumber) {
    return NextResponse.json({ error: 'Internal error', retry: true }, { status: 500 })
  }

  // 6. Insert delivery
  const deliveryAddress = buildDeliveryAddress(customer.address)
  const deliveryNotes = customer.address?.notes ?? null

  const { data: delivery, error: insertErr } = await supabaseAdmin
    .from('deliveries')
    .insert({
      client_id: clientId,
      order_number: orderNumber,
      status: 'pending',
      pickup_address: profile?.pickup_address ?? '',
      pickup_city: pickupCity,
      pickup_notes: 'GloriaFood: ' + order_id,
      delivery_address: deliveryAddress,
      delivery_notes: deliveryNotes,
      recipient_name: customer.name,
      recipient_phone: customer.phone,
      time_window: formatTimeWindow(estimated_ready_time),
      order_item_count: Array.isArray(items) ? items.length : null,
      amount_pln: Math.round(Number(total_price) * 0.10 * 100) / 100,
      source: 'gloriaFood',
      external_order_id: String(order_id),
    })
    .select('id')
    .single()

  if (insertErr) {
    // Race-condition duplicate — pre-check passed but concurrent insert won
    if (insertErr.code === '23505') {
      return NextResponse.json({
        success: true,
        message: 'Order already processed',
        duplicate: true,
      }, { status: 200 })
    }
    console.error('[GloriaFood] insert error:', insertErr.message)
    return NextResponse.json({ error: 'Internal server error', retry: true }, { status: 500 })
  }

  // 7. Audit log (non-fatal — order already created, don't fail the response)
  try {
    await supabaseAdmin
      .from('audit_log')
      .insert({
        action: 'gloriaFood_order_created',
        actor_id: clientId,
        target_type: 'delivery',
        target_id: delivery.id,
        metadata: { order_id, order_number: orderNumber, source: 'gloriaFood' },
      })
  } catch (auditError) {
    console.error('[GloriaFood] Audit log failed:', { code: auditError.code })
  }

  const origin = request.nextUrl.origin
  const qrUrl = `${origin}/orders/${delivery.id}/qr`

  return NextResponse.json({ success: true, order_number: orderNumber, qr_url: qrUrl })
}
