import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Badge, EmptyState, ErrorState, Loading } from '../components/ui'
import { ConsultationCard } from './Consultations'
import { hasAdd, useApp } from '../state/AppState'
import { inr } from '../data/catalog'
import { getMyAppointments, getMyConsultations, getMyOrders, getMyPrescriptions, getOrder, lookupConsultations } from '../lib/api'
import useAsync from '../lib/useAsync'

const byId = (list) => [...new Map(list.map((x) => [x.id, x])).values()]

// Records on the account, plus anything done as a guest on this device before signing in.
async function loadRecords({ orderRefs, appointments, prescriptions, consultationRefs }) {
  const [orders, appts, rxs, consults] = await Promise.all([getMyOrders(), getMyAppointments(), getMyPrescriptions(), getMyConsultations()])
  const known = new Set(orders.map((o) => o.id))
  const guestOrders = await Promise.all(orderRefs.filter((r) => !known.has(r)).map((r) => getOrder(r).catch(() => null)))
  const knownC = new Set(consults.map((c) => c.id))
  const guestConsults = await lookupConsultations(consultationRefs.filter((r) => !knownC.has(r)))
  return {
    orders: [...orders, ...guestOrders.filter(Boolean)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    appointments: byId([...appts, ...appointments]),
    prescriptions: byId([...rxs, ...prescriptions]),
    consultations: [...consults, ...guestConsults],
  }
}

const ORDER_BADGE = { paid: ['ok', 'Paid'], store: ['pending', 'Pay at store'], failed: ['bad', 'Payment failed'] }
const PROGRESS_TONE = { placed: 'neutral', confirmed: 'info', in_progress: 'info', ready: 'ok', completed: 'neutral', cancelled: 'bad' }

function RxTable({ rx }) {
  return (
    <table className="num w-full border-collapse text-center text-sm">
      <thead><tr className="text-muted"><td /><th className="font-normal">SPH</th><th className="font-normal">CYL</th><th className="font-normal">Axis</th><th className="font-normal">ADD</th></tr></thead>
      <tbody>
        {[['R', rx.right], ['L', rx.left]].map(([k, e]) => (
          <tr key={k} className="border-t border-line"><td className="py-1.5 text-left font-semibold">{k}</td><td>{e.sph}</td><td>{e.cyl}</td><td>{e.cyl !== '0.00' ? e.axis : ''}</td><td>{e.add || 'None'}</td></tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Account() {
  const app = useApp()
  const { user, signOut, setActiveRx } = app
  const [tab, setTab] = useState('orders')
  const { data, error, reload } = useAsync(() => (user ? loadRecords(app) : null), [user && user.id])
  if (!user) return <Navigate to="/login?next=/account" replace />
  if (error) return <div className="wrap py-16"><ErrorState title="We couldn't load your account" onRetry={reload} /></div>
  if (!data) return <Loading>Loading your account</Loading>
  const { orders, appointments, prescriptions, consultations } = data

  const TABS = [['orders', 'Orders', orders.length], ['appts', 'Appointments', appointments.length], ['rx', 'Prescriptions', prescriptions.length], ['consults', 'Video consultations', consultations.length]]

  return (
    <div className="wrap grid gap-7 pb-24 pt-8 md:gap-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-1.5"><h1 className="display text-[36px] leading-9 md:text-[56px] md:leading-[54px]">Hello{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1><p className="num text-muted">{[user.email, user.phone].filter(Boolean).join(' · ')}</p></div>
        <button type="button" className="btn-text p-0 text-muted" onClick={signOut}>Sign out</button>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
        <nav aria-label="Account sections" className="-mx-4 flex overflow-x-auto border-b border-line px-4 md:mx-0 md:grid md:border-b-0 md:border-t md:border-ink md:px-0">
          {TABS.map(([id, label, n]) => (
            <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}
              className={`flex min-h-[52px] flex-none items-center justify-between gap-3 whitespace-nowrap px-3 text-left font-semibold md:border-b md:border-line ${tab === id ? 'bg-sky-soft text-navy max-md:border-b-2 max-md:border-navy max-md:bg-transparent' : 'text-ink'}`}>
              <span>{label}</span><span className="num font-medium text-muted">{n}</span>
            </button>
          ))}
        </nav>

        <section className="grid min-w-0 gap-4">
          {tab === 'orders' && (
            <>
              <h2 className="display hidden text-2xl md:block">Orders</h2>
              {orders.length === 0 ? (
                <EmptyState title="No orders yet" action={<Link className="btn btn-primary" to="/shop">Shop glasses</Link>}>Orders you place show up here, with their status.</EmptyState>
              ) : orders.map((o) => {
                const [tone, label] = ORDER_BADGE[o.status]
                return (
                  <article key={o.id} className="card grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5 md:px-6 md:py-5">
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2.5"><strong>{o.number}</strong><Badge tone={PROGRESS_TONE[o.progress] || 'info'}>{o.progressLabel}</Badge>{o.progress !== 'cancelled' && <Badge tone={tone}>{label}</Badge>}</div>
                      <span className="text-muted">{o.items.map((i) => i.name + (i.lens ? ` with ${i.lens}` : '')).join(', ')}</span>
                      <span className="help">Placed {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:grid md:justify-items-end md:gap-1.5">
                      <span className="num font-semibold">{inr(o.total)}</span><Link className="text-sm" to={`/order/${o.id}`}>Details</Link>
                    </div>
                  </article>
                )
              })}
            </>
          )}

          {tab === 'appts' && (
            <>
              <div className="flex items-center justify-between"><h2 className="display text-2xl">Appointments</h2><Link className="btn btn-secondary btn-sm" to="/book">Book an eye test</Link></div>
              {appointments.length === 0 ? (
                <EmptyState icon="calendar" title="No appointments yet" action={<Link className="btn btn-primary" to="/book">Book an eye test</Link>}>Eye tests you book show up here.</EmptyState>
              ) : appointments.map((a) => {
                const d = new Date(`${a.date}T00:00`)
                const past = d < new Date(new Date().toDateString())
                return (
                  <article key={a.id} className={`card grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4 p-4 md:grid-cols-[80px_minmax(0,1fr)_auto] md:px-6 md:py-5 ${past ? '' : 'border-2 border-navy'}`}>
                    <div className="grid text-center"><span className="label">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span><span className={`display num text-4xl leading-[38px] ${past ? 'text-muted' : ''}`}>{d.getDate()}</span><span className="help">{d.toLocaleDateString('en-IN', { month: 'short' })}</span></div>
                    <div className="grid gap-1"><div className="flex flex-wrap items-center gap-2.5"><strong>Eye test, {a.time}</strong><Badge tone={past ? 'neutral' : 'info'}>{past ? 'Past' : 'Upcoming'}</Badge></div><span className="text-muted">{a.name} · {a.reason}</span></div>
                    <span className="help col-span-2 md:col-span-1">Booking {a.id}</span>
                  </article>
                )
              })}
            </>
          )}

          {tab === 'rx' && (
            <>
              <div className="flex items-center justify-between"><h2 className="display text-2xl">Saved prescriptions</h2><Link className="btn btn-secondary btn-sm" to="/prescription">Add one</Link></div>
              {prescriptions.length === 0 ? (
                <EmptyState icon="doc" title="No prescriptions saved yet" action={<><Link className="btn btn-primary" to="/prescription">Add a prescription</Link><Link className="btn btn-ghost" to="/book">Book an eye test</Link></>}>
                  Save one and your next order takes a minute. You can add family members too.
                </EmptyState>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {prescriptions.map((p) => (
                    <article key={p.id} className="card grid gap-2.5 p-5">
                      <div className="flex justify-between gap-3"><strong>{p.name}</strong>{p.date && <span className="help">{p.date}</span>}</div>
                      <RxTable rx={p} />
                      {!hasAdd(p) && <p className="help">No ADD, so progressive lenses aren't available with this one.</p>}
                      <Link className="text-sm" to="/shop" onClick={() => setActiveRx(p.id)}>Shop with this prescription</Link>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'consults' && (
            <>
              <div className="flex items-center justify-between"><h2 className="display text-2xl">Video consultations</h2><Link className="btn btn-secondary btn-sm" to="/video-consultation">New request</Link></div>
              {consultations.length === 0 ? (
                <EmptyState icon="video" title="No consultations yet" action={<Link className="btn btn-primary" to="/video-consultation">Request a video call</Link>}>Requests you send show up here, with the Google Meet link once we approve a time.</EmptyState>
              ) : consultations.map((c) => <ConsultationCard key={c.id} c={c} />)}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
