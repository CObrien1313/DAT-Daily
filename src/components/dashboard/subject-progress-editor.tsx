'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress'
import { SUBJECT_COLORS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import type { SubjectProgress, DATSubject } from '@/lib/types'

interface SubjectProgressEditorProps {
  initialSubjects: SubjectProgress[]
}

export function SubjectProgressEditor({ initialSubjects }: SubjectProgressEditorProps) {
  const [subjects, setSubjects] = useState(initialSubjects)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setProgress(subject: DATSubject, value: number) {
    setSaved(false)
    setSubjects((prev) =>
      prev.map((s) => (s.subject === subject ? { ...s, progress: value } : s))
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await Promise.all(
      subjects.map((s) =>
        supabase
          .from('subject_progress')
          .update({ progress: s.progress })
          .eq('user_id', user.id)
          .eq('subject', s.subject)
      )
    )

    setSaving(false)
    setSaved(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Progress</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Drag each slider to reflect how confident you feel in each subject.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {subjects.map(({ subject, progress }) => (
          <div key={subject}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{subject}</span>
              <span className="text-sm font-semibold text-slate-600 w-10 text-right">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={progress}
              onChange={(e) => setProgress(subject as DATSubject, Number(e.target.value))}
              className="w-full accent-indigo-600 h-2"
            />
            <ProgressBar value={progress} barClassName={SUBJECT_COLORS[subject as DATSubject]} showLabel={false} className="mt-2" />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Progress'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
