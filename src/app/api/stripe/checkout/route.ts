import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

// Promo ends July 1 2026 — after that, use regular price
const PROMO_END = new Date('2026-07-01T00:00:00Z')

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  const stripe    = getStripe()
  let customerId  = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Choose price: promo or regular
  const promoActive = new Date() < PROMO_END
  const priceId = promoActive
    ? process.env.STRIPE_PROMO_PRICE_ID!
    : process.env.STRIPE_PRICE_ID!

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dat-daily.vercel.app'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/upgrade?success=1`,
    cancel_url:  `${origin}/upgrade?canceled=1`,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
