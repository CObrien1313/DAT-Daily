export type DATSubject =
  | 'Biology'
  | 'General Chemistry'
  | 'Organic Chemistry'
  | 'PAT'
  | 'Reading Comprehension'
  | 'Quantitative Reasoning'

export const DAT_SUBJECTS: DATSubject[] = [
  'Biology',
  'General Chemistry',
  'Organic Chemistry',
  'PAT',
  'Reading Comprehension',
  'Quantitative Reasoning',
]

export const SUBJECT_COLORS: Record<DATSubject, string> = {
  Biology: 'bg-emerald-500',
  'General Chemistry': 'bg-blue-500',
  'Organic Chemistry': 'bg-violet-500',
  PAT: 'bg-orange-500',
  'Reading Comprehension': 'bg-cyan-500',
  'Quantitative Reasoning': 'bg-rose-500',
}

export interface User {
  id: string
  email: string
  name: string
  examDate: string | null
  weeklyHoursGoal: number
}

export interface StudyTask {
  id: string
  userId: string
  title: string
  subject: DATSubject
  completed: boolean
  date: string
  estimatedMinutes: number
}

export interface SubjectProgress {
  subject: DATSubject
  progress: number // 0–100
}

export interface WeakTopic {
  id: string
  subject: DATSubject
  topic: string
  priority: 'high' | 'medium' | 'low'
}

export interface StudySession {
  id: string
  userId: string
  date: string
  durationMinutes: number
  subject: DATSubject
}
