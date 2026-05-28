'use client'

import { useState } from 'react'
import { Loader2, UserPlus, UserCheck, UserX, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

interface FriendButtonProps {
  targetUserId: string
  initialStatus: FriendStatus
  friendshipId?: string
}

export function FriendButton({ targetUserId, initialStatus, friendshipId: initialFriendshipId }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus)
  const [friendshipId, setFriendshipId] = useState(initialFriendshipId)
  const [loading, setLoading] = useState(false)

  async function sendRequest() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: targetUserId, status: 'pending' })
      .select('id')
      .single()
    if (data) { setFriendshipId(data.id); setStatus('pending_sent') }
    setLoading(false)
  }

  async function acceptRequest() {
    if (!friendshipId) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    setStatus('friends')
    setLoading(false)
  }

  async function removeFriendship() {
    if (!friendshipId) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriendshipId(undefined)
    setStatus('none')
    setLoading(false)
  }

  if (status === 'none') {
    return (
      <button
        onClick={sendRequest}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Add Friend
      </button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={removeFriendship}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
        Request Sent
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={acceptRequest}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Accept
        </button>
        <button
          onClick={removeFriendship}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <UserX className="w-4 h-4" />
          Decline
        </button>
      </div>
    )
  }

  // friends
  return (
    <button
      onClick={removeFriendship}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50',
        'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
      Friends
    </button>
  )
}
