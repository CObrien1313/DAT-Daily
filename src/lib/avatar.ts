const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500',  'bg-cyan-500',   'bg-orange-500',  'bg-teal-500',
]

export function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
