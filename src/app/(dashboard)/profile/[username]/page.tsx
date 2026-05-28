import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { FriendButton, type FriendStatus } from '@/components/social/friend-button'
import { ACHIEVEMENTS, getLevelFromXP, getXPProgress } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the viewed profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, username, school, level, xp, current_streak, exam_date')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user.id === profile.id

  // Fetch their earned achievements
  const { data: earnedAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, earned_at')
    .eq('user_id', profile.id)

  const earnedSet = new Set((earnedAchievements ?? []).map((a) => a.achievement_id))

  // Determine friend status (only for other users)
  let friendStatus: FriendStatus = 'none'
  let friendshipId: string | undefined

  if (!isOwnProfile) {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (friendship) {
      friendshipId = friendship.id
      if (friendship.status === 'accepted') {
        friendStatus = 'friends'
      } else if (friendship.requester_id === user.id) {
        friendStatus = 'pending_sent'
      } else {
        friendStatus = 'pending_received'
      }
    }
  }

  const xp = profile.xp ?? 0
  const levelInfo = getLevelFromXP(xp)
  const { pct: xpProgress, xpToNext } = getXPProgress(xp)
  const avatarColor = getAvatarColor(profile.id)
  const initials = getInitials(profile.name ?? profile.username ?? '?')

  const earnedCount = earnedSet.size
  const totalAchievements = ACHIEVEMENTS.length

  const daysUntilExam = profile.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86_400_000))
    : null

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Back nav */}
      <Link
        href="/social"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to friends
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 ${avatarColor}`}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{profile.name}</h1>
            <p className="text-sm text-slate-400">@{profile.username}</p>
            {profile.school && (
              <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                {profile.school}
              </p>
            )}
          </div>

          {!isOwnProfile && (
            <div className="flex-shrink-0">
              <FriendButton
                targetUserId={profile.id}
                initialStatus={friendStatus}
                friendshipId={friendshipId}
              />
            </div>
          )}
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-indigo-600">Level {levelInfo.level} — {levelInfo.title}</span>
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          {xpToNext > 0 && (
            <p className="text-xs text-slate-400 mt-1">{xpToNext.toLocaleString()} XP to next level</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">
              🔥 {profile.current_streak ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{earnedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Achievements<br />
              <span className="text-slate-400">of {totalAchievements}</span>
            </p>
          </div>
          <div className="text-center">
            {daysUntilExam !== null ? (
              <>
                <p className="text-2xl font-bold text-indigo-600">{daysUntilExam}</p>
                <p className="text-xs text-slate-500 mt-0.5">Days to DAT</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-300">—</p>
                <p className="text-xs text-slate-400 mt-0.5">No exam set</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Achievements</h2>
          <span className="text-xs text-slate-400">{earnedCount} / {totalAchievements} earned</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const earned = earnedSet.has(a.id)
            return (
              <div
                key={a.id}
                title={earned ? `${a.title}: ${a.description}` : `Locked: ${a.title}`}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                  earned
                    ? 'bg-slate-50 hover:bg-indigo-50'
                    : 'bg-slate-50 grayscale opacity-35'
                }`}
              >
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span className="text-xs text-slate-500 text-center leading-tight">{a.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
