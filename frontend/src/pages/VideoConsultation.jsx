import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon, { Spinner } from '../components/Icon'
import { Alert, Badge, Field, PhotoUpload, Select } from '../components/ui'
import { createConsultation } from '../lib/api'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

const ISSUES = ['Red eyes', 'Dry eyes', 'Itching', 'Irritation', 'Lens discomfort', 'Something else']
const PHONE_RE = /^(\+?91)?[6-9]\d{9}$/

export function EmergencyBox() {
  return (
    <div className="alert alert-warn" role="note">
      <Icon name="warn" size={24} />
      <div className="grid gap-1">
        <strong className="text-[17px]">Emergency? Don't use this form</strong>
        <p>Sudden loss of vision, an injury to the eye, chemicals in the eye, or severe pain need a hospital now. Call <strong>108</strong> or go to the nearest emergency department.</p>
      </div>
    </div>
  )
}

export default function VideoConsultation() {
  const { user, addConsultation } = useApp()
  const [issues, setIssues] = useState([])
  const [form, setForm] = useState({ since: '2 to 3 days', eye: 'Both', desc: '', name: user ? user.name : '', phone: user ? user.phone : '', email: '', when: 'Today, evening (5 to 8 pm)' })
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [sent, setSent] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!issues.length) er.issues = 'Pick at least one, or choose Something else.'
    if (form.desc.trim().length < 20) er.desc = 'A little more, please: which eye, since when, does it hurt?'
    if (!form.name.trim()) er.name = 'Enter your name.'
    if (!PHONE_RE.test(form.phone.replace(/[\s-]/g, ''))) er.phone = 'Enter a 10-digit mobile number. We send the call link here.'
    setErrors(er)
    if (Object.keys(er).length) { window.scrollTo({ top: 0 }); return }
    setSending(true); setFailed(false)
    try {
      const c = await createConsultation({ ...form, issues, photos: files.map((f) => f.name) })
      addConsultation(c)
      setSent(c)
      window.scrollTo({ top: 0 })
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="wrap pb-24 pt-8 md:pt-14">
        <div className="mx-auto grid max-w-[640px] gap-6 md:card md:p-12">
          <Badge tone="pending" className="justify-self-start">Pending review</Badge>
          <div className="grid gap-2">
            <h1 className="display text-[40px] leading-10 md:text-5xl">Request sent</h1>
            <p className="lede">Our optometrist will look at it and message you on WhatsApp at {sent.phone}, usually within {STORE.consultReplyWithin} during opening hours.</p>
          </div>
          <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-3 border-y border-line py-5">
            <dt className="text-muted">Problem</dt><dd>{sent.issues.join(', ')}</dd>
            <dt className="text-muted">Best time</dt><dd>{sent.when}</dd>
            <dt className="text-muted">Photos</dt><dd>{sent.photos.length ? `${sent.photos.length} attached` : 'None'}</dd>
            <dt className="text-muted">Request no.</dt><dd className="num">{sent.id}</dd>
          </dl>
          <Link className="btn btn-primary justify-self-start max-md:w-full" to="/consultations">Track this request</Link>
          <p className="help">If it gets worse, especially sudden blurring or pain, don't wait for our reply. Go to a hospital.</p>
        </div>
      </div>
    )
  }

  const errCount = Object.keys(errors).length
  return (
    <div className="wrap grid gap-7 pb-24 pt-7 md:gap-8 md:pt-12">
      <div className="grid max-w-[46em] gap-2.5">
        <h1 className="display text-[34px] leading-[34px] md:text-[56px] md:leading-[54px]">Request a video consultation</h1>
        <p className="lede text-[17px] md:text-[19px]">For eye problems that aren't an emergency. Tell us what's wrong, and our optometrist will set up a Google Meet call with you.</p>
      </div>
      <EmergencyBox />

      <div className="grid items-start gap-10 md:grid-cols-[1.5fr_1fr]">
        <form onSubmit={submit} noValidate className="grid gap-7 md:card md:p-8">
          {errCount > 0 && <Alert tone="bad" title={`${errCount} ${errCount === 1 ? 'thing' : 'things'} to fix`}>They're marked below.</Alert>}
          {failed && (
            <Alert tone="bad" title="Your request didn't go through">
              The connection dropped. Everything you typed is still here. Try again, or <a href={STORE.whatsappHref} target="_blank" rel="noreferrer">send it on WhatsApp instead</a>.
            </Alert>
          )}

          <fieldset className="grid gap-3">
            <legend className="field-label pb-2">What's the problem? <span className="optional">Pick all that apply</span></legend>
            <div className={`grid grid-cols-2 gap-2.5 md:grid-cols-3 ${errors.issues ? 'rounded-md border-[1.5px] border-danger p-2' : ''}`}>
              {ISSUES.map((i) => (
                <button key={i} type="button" className="choice min-h-[52px] content-center font-medium" aria-pressed={issues.includes(i)} onClick={() => setIssues(issues.includes(i) ? issues.filter((x) => x !== i) : [...issues, i])}>{i}</button>
              ))}
            </div>
            {errors.issues && <span className="field-error">{errors.issues}</span>}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Since when?">{(a) => <Select {...a} value={form.since} onChange={set('since')}><option>Today</option><option>2 to 3 days</option><option>About a week</option><option>Longer</option></Select>}</Field>
            <Field label="Which eye?">{(a) => <Select {...a} value={form.eye} onChange={set('eye')}><option>Both</option><option>Right</option><option>Left</option></Select>}</Field>
          </div>

          <Field label="Describe it in your own words" error={errors.desc}>
            {(a) => (
              <>
                <textarea {...a} className="input min-h-[120px]" maxLength={1000} placeholder="For example: my right eye has been red since Saturday and feels gritty." value={form.desc} onChange={set('desc')} />
                <div className="flex justify-between gap-3"><span className="help">Mention contact lenses, eye drops or any medicine you're using.</span><span className="help num">{form.desc.length} / 1000</span></div>
              </>
            )}
          </Field>

          <div className="grid gap-2.5">
            <p className="field-label">Photo of your eye <span className="optional">(optional, helps a lot)</span></p>
            <PhotoUpload files={files} onChange={setFiles} max={3} label="Add a photo of your eye" hint="Up to 3 photos, 10 MB each. Daylight, close up, no flash." />
          </div>

          <div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>{(a) => <input {...a} className="input" autoComplete="name" value={form.name} onChange={set('name')} />}</Field>
            <Field label="Mobile (WhatsApp)" error={errors.phone}>{(a) => <input {...a} className="input num" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />}</Field>
            <Field label="Email" optional="for the Meet link">{(a) => <input {...a} className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} />}</Field>
            <Field label="Best time for a call">{(a) => <Select {...a} value={form.when} onChange={set('when')}><option>Today, evening (5 to 8 pm)</option><option>Tomorrow, morning</option><option>Tomorrow, evening</option><option>Any time</option></Select>}</Field>
          </div>

          <button type="submit" className="btn btn-primary justify-self-start max-md:w-full" disabled={sending} aria-busy={sending}>
            {sending ? <><Spinner />Sending your request</> : 'Send request'}
          </button>
        </form>

        <aside className="grid content-start gap-6 md:sticky md:top-6">
          <div className="grid gap-4">
            <h2 className="display text-2xl">What happens next</h2>
            <ol className="border-t border-ink">
              {[
                ['You send this request.', 'It shows as Pending in your account.'],
                ['Our optometrist reviews it.', `Usually within ${STORE.consultReplyWithin} during opening hours. If it can wait, we approve a time. If it can't, we'll tell you where to go.`],
                ['You join the call.', 'A "Join Google Meet" button appears in your account and on WhatsApp.'],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-b border-line py-3.5">
                  <span className="display text-2xl leading-[26px] text-sky">{i + 1}</span>
                  <span><strong>{t}</strong><br /><span className="text-muted">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-md bg-soft p-4">
            <dt className="text-muted">Fee</dt><dd className="font-semibold">{STORE.consultFee}</dd>
            <dt className="text-muted">Call length</dt><dd>About 10 minutes</dd>
            <dt className="text-muted">You need</dt><dd>A phone or laptop with a camera</dd>
          </dl>
        </aside>
      </div>
    </div>
  )
}
