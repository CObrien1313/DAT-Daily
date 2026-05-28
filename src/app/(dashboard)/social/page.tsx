'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Search, UserCheck, Loader2, UserPlus, Clock, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  name: string
  username: string
  school: string | null
  level: number
  current_streak: number
}

interface FriendRequest {
  id: string
  requester: UserRow
}

interface FriendshipRow {
  id: string
  friend: UserRow
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md' }: { user: Pick<UserRow, 'id' | 'name'>; size?: 'sm' | 'md' | 'lg' }) {
  const color = getAvatarColor(user.id)
  const initials = getInitials(user.name)
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', color, sizeClass)}>
      {initials}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [myProfile, setMyProfile] = useState<{ username: string | null } | null>(null)
  const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends')
  const [friends, setFriends] = useState<FriendshipRow[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserRow[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingSent, setPendingSent] = useState<Set<string>>(new Set())

  // Load current user + friends + requests
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUser(user)

      // Fetch own profile (check username)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      setMyProfile(profile)

      // Fetch accepted friendships
      const { data: rawFriendships } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (rawFriendships) {
        const friendIds = rawFriendships.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        )
        if (friendIds.length > 0) {
          const { data: friendProfiles } = await supabase
            .from('profiles')
            .select('id, name, username, school, level, current_streak')
            .in('id', friendIds)
          if (friendProfiles) {
            setFriends(rawFriendships.map((f) => {
              const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id
              return { id: f.id, friend: friendProfiles.find((p) => p.id === friendId)! }
            }).filter((f) => f.friend))
          }
        }
      }

      // Fetch incoming pending requests
      const { data: rawRequests } = await supabase
        .from('friendships')
        .select('id, requester_id')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      if (rawRequests && rawRequests.length > 0) {
        const requesterIds = rawRequests.map((r) => r.requester_id)
        const { data: requesters } = await supabase
          .from('profiles')
          .select('id, name, username, school, level, current_streak')
          .in('id', requesterIds)
        if (requesters) {
          setRequests(rawRequests.map((r) => ({
            id: r.id,
            requester: requesters.find((p) => p.id === r.requester_id)!,
          })).filter((r) => r.requester))
        }
      }

      // Track sent pending requests
      const { data: sentRequests } = await supabase
        .from('friendships')
        .select('addressee_id')
        .eq('requester_id', user.id)
        .eq('status', 'pending')
      if (sentRequests) {
        setPendingSent(new Set(sentRequests.map((r) => r.addressee_id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  // Search users
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username, school, level, current_streak')
      .not('username', 'is', null)
      .or(`username.ilike.%${q}%,name.ilike.%${q}%,school.ilike.%${q}%`)
      .neq('id', currentUser?.id ?? '')
      .limit(12)
    setSearchResults((data ?? []) as UserRow[])
    setSearching(false)
  }, [currentUser])

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, doSearch])

  async function sendRequest(targetId: string) {
    if (!currentUser) return
    const supabase = createClient()
    await supabase.from('friendships').insert({ requester_id: currentUser.id, addressee_id: targetId, status: 'pending' })
    setPendingSent((prev) => new Set([...prev, targetId]))
  }

  async function acceptRequest(friendshipId: string, requesterId: string) {
    const supabase = createClient()
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    const accepted = requests.find((r) => r.id === friendshipId)
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
    if (accepted) {
      setFriends((prev) => [...prev, { id: friendshipId, friend: accepted.requester }])
    }
  }

  async function declineRequest(friendshipId: string) {
    const supabase = createClient()
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
  }

  async function removeFriend(friendshipId: string, friendId: string) {
    const supabase = createClient()
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriends((prev) => prev.filter((f) => f.id !== friendshipId))
  }

  const friendIds = new Set(friends.map((f) => f.friend?.id))

  // ── No username prompt ───────────────────────────────────────────────────────
  if (!loading && myProfile?.username === null) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Study Friends</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-4xl mb-4">👋</p>
          <p className="text-base font-semibold text-slate-900 mb-2">Set a username to get started</p>
          <p className="text-sm text-slate-500 mb-5">
            You need a username before you can search for friends, appear on leaderboards, or share your profile.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Set username in Settings →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Study Friends</h1>
        </div>
        {myProfile?.username && (
          <Link
            href={`/profile/${myProfile.username}`}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            View my profile →
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
        {([
          { id: 'friends', label: `Friends${friends.length > 0 ? ` (${friends.length})` : ''}` },
          { id: 'requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}` },
          { id: 'find', label: 'Find People' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* ── Friends tab ──────────────────────────────────────────────────────── */}
      {!loading && tab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">No friends yet. Find study partners in the &ldquo;Find People&rdquo; tab.</p>
            </div>
          ) : (
            friends.map(({ id: fid, friend }) => friend && (
              <div key={fid} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                <Link href={`/profile/${friend.username}`}>
                  <Avatar user={friend} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${friend.username}`} className="hover:underline">
                    <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                  </Link>
                  <p className="text-xs text-slate-400">@{friend.username} {friend.school ? `· ${friend.school}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                  <span>Lv.{friend.level}</span>
                  <span>🔥 {friend.current_streak ?? 0}</span>
                </div>
                <button
                  onClick={() => removeFriend(fid, friend.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1"
                  title="Remove friend"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Requests tab ─────────────────────────────────────────────────────── */}
      {!loading && tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <UserCheck className="w-8 h-8 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">No pending friend requests.</p>
            </div>
          ) : (
            requests.map(({ id: rid, requester }) => requester && (
              <div key={rid} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-indigo-200">
                <Link href={`/profile/${requester.username}`}>
                  <Avatar user={requester} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{requester.name}</p>
                  <p className="text-xs text-slate-400">@{requester.username}{requester.school ? ` · ${requester.school}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(rid, requester.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(rid)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Find People tab ───────────────────────────────────────────────────── */}
      {!loading && tab === 'find' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, name, or school…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>

          {searching && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}

          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-center py-8 text-sm text-slate-400">No users found for &ldquo;{searchQuery}&rdquo;</p>
          )}

          {!searching && searchQuery.length < 2 && (
            <p className="text-sm text-slate-400 text-center py-4">Type at least 2 characters to search</p>
          )}

          <div className="space-y-3">
            {searchResults.map((user) => {
              const isFriend = friendIds.has(user.id)
              const isPending = pendingSent.has(user.id)
              return (
                <div key={user.id} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                  <Link href={`/profile/${user.username}`}>
                    <Avatar user={user} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.username}`} className="hover:underline">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    </Link>
                    <p className="text-xs text-slate-400">@{user.username}{user.school ? ` · ${user.school}` : ''} · Lv.{user.level}</p>
                  </div>
                  {isFriend ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <UserCheck className="w-3.5 h-3.5" />
                      Friends
                    </span>
                  ) : isPending ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => sendRequest(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
