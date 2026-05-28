import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? 'hours'
  const scope = searchParams.get('scope') ?? 'global'

  const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
    p_category: category,
    p_viewer_id: user.id,
    p_friends_only: scope === 'friends',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
