import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner } from '../components/Icon'
import { Alert, Field } from '../components/ui'
import { errorMessage, requestCode, updateMe, verifyCode } from '../lib/api'
import { useApp } from '../state/AppState'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function CodeInput({ value, onChange, invalid }) {
  const refs = useRef([])
  const digits = value.padEnd(6, ' ').split('')
  const setAt = (i, d) => {
    const next = digits.map((x, j) => (j === i ? d : x)).join('').replace(/\s+$/, '')
    onChange(next)
  }
  return (
    <div role="group" aria-label="6-digit code" className="grid grid-cols-6 gap-2">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} className="input num min-h-14 text-center text-[22px] font-semibold" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={6}
          aria-label={`Digit ${i + 1}`} aria-invalid={invalid ? 'true' : undefined} value={d.trim()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            if (v.length > 1) { onChange(v.slice(0, 6)); refs.current[Math.min(5, v.length - 1)]?.focus(); return }
            setAt(i, v || ' ')
            if (v && i < 5) refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !d.trim() && i > 0) refs.current[i - 1]?.focus() }} />
      ))}
    </div>
  )
}

export default function Login() {
  const { signIn, user } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/account'
  const [step, setStep] = useState('email') // email | code | name
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [locked, setLocked] = useState(false)
  const [wait, setWait] = useState(0)

  useEffect(() => { if (user && step === 'email') navigate(next, { replace: true }) }, [user]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!wait) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const address = email.trim().toLowerCase()

  const send = async (e) => {
    e && e.preventDefault()
    if (!EMAIL_RE.test(address)) { setError('Enter your email address, for example you@example.com.'); return }
    setError(''); setBusy(true)
    try {
      const res = await requestCode(address)
      setStep('code'); setCode(''); setLocked(false); setWait(res.resend_in || 30)
    } catch (err) {
      const data = err.response && err.response.data
      if (data && data.resend_in) { setStep('code'); setWait(data.resend_in) }
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    if (code.length < 6) { setError('Enter all 6 digits.'); return }
    setBusy(true)
    try {
      const res = await verifyCode(address, code)
      setError('')
      if (res.isNew || !res.user.name) { signIn(res.user); setStep('name') } else { signIn(res.user); navigate(next) }
    } catch (err) {
      const data = err.response && err.response.data
      if (data && data.tries_left === 0) setLocked(true)
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const finish = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Enter your name.'); return }
    setBusy(true)
    try {
      signIn(await updateMe({ name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) }))
      navigate(next)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wrap grid max-w-[1080px] items-start gap-10 pb-24 pt-8 md:grid-cols-2 md:gap-16 md:pt-[72px]">
      <section className="grid gap-5 md:card md:p-9">
        {step === 'email' && (
          <form onSubmit={send} noValidate className="grid gap-5">
            <div className="grid gap-2">
              <h1 className="display text-4xl leading-9 md:text-[44px] md:leading-[44px]">Sign in or create an account</h1>
              <p className="text-muted">One step for both. We'll email you a 6-digit code.</p>
            </div>
            <Field label="Email" error={error}>
              {(a) => <input {...a} className="input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? <><Spinner />Sending code</> : 'Send code'}</button>
            <p className="help">New here? Entering your email creates your account. We only email you about your orders and appointments.</p>
          </form>
        )}
        {step === 'code' && (
          <form onSubmit={verify} noValidate className="grid gap-5">
            <div className="grid gap-2">
              <h1 className="display text-4xl leading-9">Enter the code</h1>
              <p className="text-muted">Sent to <strong>{address}</strong>. <button type="button" className="text-link underline" onClick={() => { setStep('email'); setError('') }}>Change</button></p>
            </div>
            <CodeInput value={code} onChange={setCode} invalid={Boolean(error)} />
            {error && <span className="field-error" role="alert">{error}</span>}
            {!locked && <button type="submit" className="btn btn-primary w-full" disabled={busy || code.length < 6}>{busy ? <><Spinner />Checking</> : 'Verify'}</button>}
            {wait > 0 ? <p className="help num">Didn't get it? Check your spam folder, or resend in 0:{String(wait).padStart(2, '0')}</p> : <button type="button" className="btn btn-secondary w-full" onClick={() => send()} disabled={busy}>Send a new code</button>}
          </form>
        )}
        {step === 'name' && (
          <form onSubmit={finish} noValidate className="grid gap-5">
            <Alert tone="ok" title="Email verified" role="status" />
            <h1 className="display text-4xl leading-9">Welcome. What's your name?</h1>
            <Field label="Full name" error={error}>{(a) => <input {...a} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}</Field>
            <Field label="Mobile number" optional help="Fills in your bookings and orders for you.">{(a) => <input {...a} className="input num" type="tel" autoComplete="tel" placeholder="98450 12345" value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? <><Spinner />Saving</> : 'Create my account'}</button>
          </form>
        )}
      </section>

      <aside className="grid gap-6 md:pt-3">
        <div className="grid gap-2.5">
          <h2 className="display text-[28px] leading-[30px] md:text-[32px] md:leading-[34px]">You don't need an account</h2>
          <p className="text-[17px] leading-[27px] text-muted md:text-lg">Shopping, booking an eye test and requesting a video call all work without one. We just ask for your name and mobile number.</p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link className="btn btn-secondary" to="/shop">Shop as a guest</Link>
          <Link className="btn btn-ghost" to="/book">Book without an account</Link>
        </div>
        <div className="grid gap-3 border-t border-line pt-5">
          <p className="field-label">What an account adds</p>
          <dl className="grid gap-3">
            <div><dt className="font-semibold">Saved prescriptions</dt><dd className="text-muted">For you and your family, ready for the next order.</dd></div>
            <div><dt className="font-semibold">Order and appointment history</dt><dd className="text-muted">Track glasses being made, and see past eye tests.</dd></div>
            <div><dt className="font-semibold">Your video consultations</dt><dd className="text-muted">Status, the Google Meet link, and the optometrist's notes.</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  )
}
