import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import Icon, { Spinner } from '../components/Icon'
import { Alert, Field, Loading, Select } from '../components/ui'
import { createAppointment, getSlots } from '../lib/api'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a, b) => a && b && a.getTime() === b.getTime()
const label = (d) => `${DAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`
const PHONE_RE = /^(\+?91)?[6-9]\d{9}$/

function MonthCalendar({ month, setMonth, selected, onPick, minDate, maxDate }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  const canPrev = first > minDate
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDate
  return (
    <div className="hidden gap-4 md:grid">
      <div className="flex items-center justify-between gap-4">
        <h2 className="display text-2xl">1. Pick a day</h2>
        <div className="flex items-center gap-1">
          <button type="button" className="icon-btn disabled:text-line-strong" aria-label="Previous month" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="back" /></button>
          <span className="min-w-[120px] text-center font-semibold">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          <button type="button" className="icon-btn disabled:text-line-strong" aria-label="Next month" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="next" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="label py-1.5">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />
          const off = d < minDate || d > maxDate
          const on = sameDay(d, selected)
          return (
            <button key={d.toISOString()} type="button" disabled={off} onClick={() => onPick(d)} aria-pressed={on} aria-label={`${label(d)}${off ? ', not available' : ''}`}
              className={clsx('num h-12 rounded-sm text-base font-medium', off ? 'cursor-default text-[#a3abbb]' : on ? 'border border-navy bg-navy font-semibold text-[#fcfdff]' : 'border border-line-strong bg-card text-ink hover:border-ink', sameDay(d, minDate) && !on && 'underline decoration-sky decoration-2 underline-offset-[6px]')}>
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <p className="help">Sundays close early. You can book up to 30 days ahead.</p>
    </div>
  )
}

function DayStrip({ days, selected, onPick }) {
  return (
    <div className="grid gap-3 md:hidden">
      <h2 className="display text-xl">1. Pick a day</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {days.map((d) => {
          const on = sameDay(d, selected)
          return (
            <button key={d.toISOString()} type="button" aria-pressed={on} onClick={() => onPick(d)}
              className={clsx('grid h-[72px] w-16 flex-none content-center justify-items-center gap-0.5 rounded-md', on ? 'border border-navy bg-navy text-[#fcfdff]' : 'border border-line-strong bg-card text-ink')}>
              <span className={clsx('text-sm', on ? 'text-[#d9e2f3]' : 'text-muted')}>{DAY[d.getDay()]}</span>
              <span className="num text-xl font-semibold">{d.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Book() {
  const { addAppointment, user } = useApp()
  const today = startOfDay(new Date())
  const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
  const strip = useMemo(() => Array.from({ length: 14 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)), [today.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps

  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [day, setDay] = useState(today)
  const [slots, setSlots] = useState(null)
  const [slotsError, setSlotsError] = useState(false)
  const [reload, setReload] = useState(0)
  const [time, setTime] = useState(null)
  const [form, setForm] = useState({ name: user ? user.name : '', phone: user ? user.phone : '', email: '', who: 'Myself', reason: 'Routine check-up', notes: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    let live = true
    setSlots(null); setSlotsError(false); setTime(null)
    getSlots(day).then((s) => live && setSlots(s)).catch(() => live && setSlotsError(true))
    return () => { live = false }
  }, [day, reload])

  const pick = (d) => { setDay(d); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }
  const free = slots ? slots.filter((s) => !s.taken) : []
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!time) er.time = 'Pick a time.'
    if (!form.name.trim()) er.name = 'Enter your name.'
    const digits = form.phone.replace(/[\s-]/g, '')
    if (!PHONE_RE.test(digits)) er.phone = digits ? `Mobile numbers have 10 digits. This one has ${digits.replace(/^\+?91/, '').length}.` : 'We need a mobile number to send your reminder.'
    setErrors(er)
    if (Object.keys(er).length) return
    setSending(true); setSendError(false)
    try {
      const a = await createAppointment({ ...form, date: day.toISOString(), dateLabel: label(day), time })
      addAppointment(a)
      setDone(a)
      window.scrollTo({ top: 0 })
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="wrap pb-24 pt-8 md:pt-14">
        <div className="mx-auto grid max-w-[640px] gap-6 md:card md:p-12">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success"><Icon name="tick" size={28} /></div>
          <div className="grid gap-2">
            <h1 className="display text-[40px] leading-10 md:text-5xl">You're booked</h1>
            <p className="lede">We'll send a reminder to {done.phone} on WhatsApp the day before.</p>
          </div>
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-3 border-y border-line py-5">
            <dt className="text-muted">When</dt><dd className="font-semibold">{done.dateLabel}, {done.time}</dd>
            <dt className="text-muted">Where</dt><dd>{STORE.name}<br />{STORE.addressLines.join(', ')}</dd>
            <dt className="text-muted">For</dt><dd>{done.name} · {done.reason}</dd>
            <dt className="text-muted">Booking no.</dt><dd className="num">{done.id}</dd>
          </dl>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <a className="btn btn-primary" href={STORE.directionsHref} target="_blank" rel="noreferrer">Get directions</a>
            <Link className="btn btn-ghost" to="/account">See my bookings</Link>
          </div>
          <p className="help">Bring your current glasses and any old prescription. Need to change the time? Call {STORE.phoneDisplay}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap grid gap-7 pb-32 pt-7 md:gap-8 md:pb-24 md:pt-14">
      <div className="grid gap-2.5">
        <h1 className="display text-[40px] leading-10 md:text-[56px] md:leading-[54px]">Book an eye test</h1>
        <p className="lede text-[17px] md:text-[19px]">About 20 minutes at the store, with our optometrist. No payment needed to book.</p>
      </div>

      <form onSubmit={submit} noValidate className="grid items-start gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-7 md:card md:gap-8 md:p-8">
          <MonthCalendar month={month} setMonth={setMonth} selected={day} onPick={pick} minDate={today} maxDate={maxDate} />
          <DayStrip days={strip} selected={day} onPick={pick} />
          <hr className="hidden border-line md:block" />
          <div className="grid gap-3 md:gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="display text-xl md:text-2xl">2. Pick a time</h2>
              <span className="text-sm text-muted md:text-base">{label(day)}</span>
            </div>
            {slotsError ? (
              <div className="card grid justify-items-start gap-3 p-6">
                <Icon name="warn" size={28} className="text-danger" />
                <h3 className="text-xl font-semibold">We couldn't load the times</h3>
                <p className="text-muted">Check your internet connection and try again. You can also book by phone.</p>
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReload((n) => n + 1)}>Try again</button>
                  <a className="btn btn-ghost btn-sm" href={STORE.phoneHref}>Call the store</a>
                </div>
              </div>
            ) : !slots ? (
              <Loading className="py-10">Loading free times</Loading>
            ) : free.length === 0 ? (
              <div className="dashed-box grid justify-items-center gap-3 px-5 py-7 text-center">
                <Icon name="calendar" size={36} className="text-sky" />
                <h3 className="text-xl font-semibold">No times left on {DAY[day.getDay()]}</h3>
                <p className="text-muted">This day is fully booked. Try the next day, or call and we'll try to fit you in.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => pick(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1))}>Try the next day</button>
              </div>
            ) : (
              <>
                <div className={clsx('grid grid-cols-3 gap-2 md:grid-cols-4', errors.time && 'rounded-md border-[1.5px] border-danger p-2')} role="radiogroup" aria-label="Time">
                  {slots.map((s) => {
                    const on = s.time === time
                    return (
                      <button key={s.time} type="button" role="radio" aria-checked={on} disabled={s.taken} onClick={() => setTime(s.time)} aria-label={`${s.time}${s.taken ? ', taken' : ''}`}
                        className={clsx('num min-h-11 rounded-sm text-[15px] font-medium', s.taken ? 'cursor-not-allowed border border-dashed border-[#c3ccd9] bg-soft text-[#6f7686] line-through' : on ? 'border border-navy bg-navy font-semibold text-[#fcfdff]' : 'border border-line-strong bg-card text-ink hover:border-ink')}>
                        {s.time}
                      </button>
                    )
                  })}
                </div>
                {errors.time && <span className="field-error">{errors.time}</span>}
                <div className="flex flex-wrap gap-5 text-sm text-muted">
                  <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-sm border border-line-strong bg-card" />Available</span>
                  <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-sm bg-navy" />Selected</span>
                  <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-sm border border-dashed border-[#c3ccd9] bg-soft" />Taken</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-5 border-t border-line pt-7 md:card md:border-t md:p-8">
          <h2 className="display text-xl md:text-2xl">3. Your details</h2>
          {Object.keys(errors).length > 0 && <Alert tone="bad" title={`Please fix ${Object.keys(errors).length} ${Object.keys(errors).length === 1 ? 'thing' : 'things'}`}>Then press Confirm booking again.</Alert>}
          {sendError && <Alert tone="bad" title="Your booking didn't go through">The connection dropped. Everything you typed is still here, so try again.</Alert>}
          <Field label="Full name" error={errors.name}>{(a) => <input {...a} className="input" autoComplete="name" value={form.name} onChange={set('name')} disabled={sending} />}</Field>
          <Field label="Mobile number" error={errors.phone} help="We'll send a reminder on WhatsApp the day before.">{(a) => <input {...a} className="input num" type="tel" autoComplete="tel" placeholder="98450 12345" value={form.phone} onChange={set('phone')} disabled={sending} />}</Field>
          <Field label="Email" optional>{(a) => <input {...a} className="input" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} disabled={sending} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Who is the test for?">{(a) => <Select {...a} value={form.who} onChange={set('who')} disabled={sending}><option>Myself</option><option>My child</option><option>A parent</option><option>Someone else</option></Select>}</Field>
            <Field label="Reason">{(a) => <Select {...a} value={form.reason} onChange={set('reason')} disabled={sending}><option>Routine check-up</option><option>New glasses</option><option>Blurry vision</option><option>Headaches</option><option>Contact lens fitting</option></Select>}</Field>
          </div>
          <Field label="Anything we should know?" optional>{(a) => <textarea {...a} className="input" placeholder="For example: I wear progressive lenses, or my last test was 2 years ago." value={form.notes} onChange={set('notes')} disabled={sending} />}</Field>

          <div className="fixed inset-x-0 bottom-0 z-30 grid gap-2.5 border-t border-line bg-card px-4 pb-5 pt-3 md:static md:border-0 md:bg-transparent md:p-0">
            <div className="flex justify-between gap-2 text-sm md:grid md:gap-1.5 md:rounded-md md:bg-soft md:p-4">
              <span className="text-muted md:label">Your booking</span>
              <span className="font-semibold md:text-lg">{label(day)}, {time || 'pick a time'}</span>
              <span className="hidden text-sm text-muted md:block">{STORE.name}, Ameerpet</span>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={sending} aria-busy={sending}>
              {sending ? <><Spinner />Booking your time</> : 'Confirm booking'}
            </button>
          </div>
          <p className="help text-center">You can change or cancel by calling {STORE.phoneDisplay}.</p>
        </div>
      </form>
    </div>
  )
}
