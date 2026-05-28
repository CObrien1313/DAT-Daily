import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

const SUPPORT_EMAIL = 'obrienconor632@gmail.com'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, message } = await request.json() as {
    category: string
    message: string
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Fetch sender's name/email for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, username')
    .eq('id', user.id)
    .single()

  // Save to Supabase regardless of email outcome
  await supabase.from('feedback').insert({
    user_id: user.id,
    category,
    message: message.trim(),
  })

  // Send email notification if Gmail credentials are configured
  if (process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SUPPORT_EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      await transporter.sendMail({
        from: `"DAT Daily Feedback" <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[${category}] New feedback from ${profile?.name ?? user.email}`,
        text: [
          `From: ${profile?.name ?? 'Unknown'} (@${profile?.username ?? 'no username'})`,
          `Email: ${user.email}`,
          `Category: ${category}`,
          ``,
          `Message:`,
          message.trim(),
        ].join('\n'),
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="color: #4f46e5;">New DAT Daily Feedback</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 4px 8px; color: #64748b; width: 100px;">From</td><td style="padding: 4px 8px; font-weight: bold;">${profile?.name ?? 'Unknown'} (@${profile?.username ?? 'no username'})</td></tr>
              <tr><td style="padding: 4px 8px; color: #64748b;">Email</td><td style="padding: 4px 8px;">${user.email}</td></tr>
              <tr><td style="padding: 4px 8px; color: #64748b;">Category</td><td style="padding: 4px 8px;">${category}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
              <p style="margin: 0; white-space: pre-wrap;">${message.trim()}</p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      // Email failed — feedback is already saved to Supabase, so this is non-fatal
      console.error('Email notification failed:', err)
    }
  }

  return NextResponse.json({ success: true })
}
