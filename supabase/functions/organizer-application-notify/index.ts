/**
 * Database Webhook → email (Resend) when a shooter self-applies as match organizer.
 *
 * Deploy with JWT verification OFF (webhook has no user JWT):
 *   npx supabase functions deploy organizer-application-notify --no-verify-jwt
 *
 * Secrets: RESEND_API_KEY, RESEND_FROM, ORGANIZER_NOTIFY_EMAILS, ORGANIZER_NOTIFY_WEBHOOK_SECRET
 * Optional: PORTAL_BASE_URL (e.g. https://example.com) — link in the email body.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.includes('@'))
}

type DbWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const expectedSecret = Deno.env.get('ORGANIZER_NOTIFY_WEBHOOK_SECRET') ?? ''
  const got = req.headers.get('x-organizer-notify-secret') ?? ''
  if (!expectedSecret || got !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: DbWebhookPayload
  try {
    payload = (await req.json()) as DbWebhookPayload
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const schema = payload.schema ?? 'public'
  const table = payload.table ?? ''
  const eventType = payload.type ?? ''

  if (schema !== 'public' || table !== 'match_admin_profiles' || eventType !== 'INSERT') {
    return Response.json({ ok: true, skipped: 'not_target_event' })
  }

  const rec = payload.record ?? {}
  if (rec.organizer_status !== 'pending') {
    return Response.json({ ok: true, skipped: 'not_pending' })
  }
  const modNote =
    typeof rec.organizer_moderation_note === 'string' ? rec.organizer_moderation_note.trim() : ''
  if (modNote.length > 0) {
    return Response.json({ ok: true, skipped: 'has_moderation_note' })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  const from = Deno.env.get('RESEND_FROM') ?? ''
  const toList = normalizeEmails(Deno.env.get('ORGANIZER_NOTIFY_EMAILS') ?? '')
  const baseUrl = (Deno.env.get('PORTAL_BASE_URL') ?? '').replace(/\/$/, '')

  if (!resendKey || !from || toList.length === 0) {
    console.error('[organizer-application-notify] Missing RESEND_API_KEY, RESEND_FROM, or ORGANIZER_NOTIFY_EMAILS')
    return new Response('Server Misconfigured', { status: 500 })
  }

  const userId = rec.user_id != null ? String(rec.user_id) : '—'
  const contactRaw = typeof rec.organizer_application_contact === 'string' ? rec.organizer_application_contact.trim() : ''
  const pastRaw =
    typeof rec.organizer_application_past_matches === 'string' ? rec.organizer_application_past_matches.trim() : ''

  const adminHref = baseUrl ? `${baseUrl}/uk/admin/organizers` : ''

  const textLines = [
    'Нова заявка на роль організатора матчів (pending).',
    '',
    `Applicant user_id: ${userId}`,
    contactRaw ? `Контакт: ${contactRaw}` : 'Контакт: (не вказано)',
    pastRaw ? `Минулі матчі / коментар: ${pastRaw}` : 'Минулі матчі / коментар: (не вказано)',
    '',
    adminHref ? `Адмінка: ${adminHref}` : 'Відкрийте /uk/admin/organizers у порталі.',
  ]
  const textBody = textLines.join('\n')

  const htmlBody = `
  <div style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#111">
    <h2 style="font-size:1.1rem;margin:0 0 0.75rem">Нова заявка на організатора</h2>
    <p style="margin:0 0 0.75rem">${escapeHtml('Статус у БД: pending. Перевірте кабінет платформи.')}</p>
    <table style="border-collapse:collapse;font-size:0.9rem">
      <tr><td style="padding:0.2rem 0.75rem 0.2rem 0;vertical-align:top"><strong>user_id</strong></td><td><code>${escapeHtml(userId)}</code></td></tr>
      <tr><td style="padding:0.2rem 0.75rem 0.2rem 0;vertical-align:top"><strong>Контакт</strong></td><td>${contactRaw ? escapeHtml(contactRaw) : '<span style="opacity:.7">не вказано</span>'}</td></tr>
      <tr><td style="padding:0.2rem 0.75rem 0.2rem 0;vertical-align:top"><strong>Минулі матчі</strong></td><td>${pastRaw ? escapeHtml(pastRaw) : '<span style="opacity:.7">не вказано</span>'}</td></tr>
    </table>
    ${adminHref ? `<p style="margin:1rem 0 0"><a href="${escapeHtml(adminHref)}">Відкрити адмінку організаторів</a></p>` : ''}
  </div>
`.trim()

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: toList,
      subject: '[Портал матчів] Нова заявка на організатора',
      text: textBody,
      html: htmlBody,
    }),
  })

  if (!resendRes.ok) {
    const errText = await resendRes.text()
    console.error('[organizer-application-notify] Resend error', resendRes.status, errText)
    return new Response(`Resend error: ${resendRes.status}`, { status: 502 })
  }

  return Response.json({ ok: true, sent_to: toList.length })
})
