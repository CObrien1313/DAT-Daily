import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Use service role to bypass RLS — webhooks have no user session
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Stripe requires the raw body to verify webhook signatures
export const dynamic = 'force-dynamic'

async function setPlan(supabaseUserId: string, plan: 'free' | 'pro', subscriptionId?: string, status?: string) {
  const supabase = getAdminClient()
  await supabase
    .from('profiles')
    .update({
      plan,
      stripe_subscription_id: subscriptionId ?? null,
      subscription_status: status ?? 'inactive',
    })
    .eq('id', supabaseUserId)
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const stripe   = getStripe()
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
        ?? await getUserIdFromCustomer(session.customer as string)
      if (userId && session.subscription) {
        await setPlan(userId, 'pro', session.subscription as string, 'active')
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
        ?? await getUserIdFromCustomer(sub.customer as string)
      if (userId) {
        const active = sub.status === 'active' || sub.status === 'trialing'
        await setPlan(userId, active ? 'pro' : 'free', sub.id, sub.status)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
        ?? await getUserIdFromCustomer(sub.customer as string)
      if (userId) {
        await setPlan(userId, 'free', undefined, 'canceled')
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const userId  = await getUserIdFromCustomer(invoice.customer as string)
      if (userId) {
        await setPlan(userId, 'free', undefined, 'past_due')
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
