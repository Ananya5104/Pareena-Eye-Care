import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Badge, EmptyState } from '../components/ui'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

// Status comes from the backend: pending -> approved (with meetUrl + time) -> completed (with notes), or rejected (with reason).
const EXAMPLES = [
  { id: 'VC-0117', status: 'approved', issues: ['Red eyes', 'Itching'], sentLabel: 'Sent today, 2:10 pm', callLabel: 'today at 6:30 pm', meetUrl: 'https://meet.google.com/', opensLabel: '6:25 pm' },
  { id: 'VC-0121', status: 'pending', issues: ['Lens discomfort'], sentLabel: 'Sent today, 2:40 pm' },
  { id: 'VC-0088', status: 'completed', issues: ['Dry eyes'], sentLabel: 'Call on 22 Sep', notes: "[The optometrist's advice from the call, for example which drops to use and for how long.]" },
  { id: 'VC-0042', status: 'rejected', issues: ['Something else'], sentLabel: '14 Aug', reason: '[Reason, for example: flashes of light need a dilated eye exam. Please visit us or an eye hospital today.]' },
]

const TONE = { pending: ['pending', 'Pending'], approved: ['info', 'Approved'], completed: ['ok', 'Completed'], rejected: ['bad', 'Rejected'] }

export function ConsultationCard({ c }) {
  const [tone, label] = TONE[c.status]
  const sent = c.sentLabel || `Sent ${new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
  const doc = STORE.optometrist.name
  return (
    <article className={`card grid gap-4 p-5 md:p-7 ${c.status === 'approved' ? 'border-2 border-navy' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3"><Badge tone={tone}>{label}</Badge><span className="num text-sm text-muted">{c.id} · {sent}</span></div>
        <span className="text-sm text-muted">{c.issues.join(', ')}</span>
      </div>

      {c.status === 'approved' && (
        <>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
            <div className="grid gap-1.5">
              <h2 className="display text-2xl">Your call is {c.callLabel}</h2>
              <p className="text-muted">With {doc} on Google Meet. About 10 minutes. Sit somewhere bright, and keep your glasses, lens case or eye drops nearby.</p>
            </div>
            <div className="grid justify-items-stretch gap-2 md:justify-items-center">
              <a className="btn btn-primary btn-lg" href={c.meetUrl} target="_blank" rel="noreferrer"><Icon name="video" />Join Google Meet</a>
              <span className="help text-center">Opens from {c.opensLabel}. The link is also on WhatsApp.</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 border-t border-line pt-3.5 text-sm">
            <a href={STORE.whatsappHref} target="_blank" rel="noreferrer">Ask for another time</a>
            <a href={STORE.phoneHref} className="text-danger">Cancel</a>
          </div>
        </>
      )}
      {c.status === 'pending' && (
        <>
          <h2 className="display text-xl">Waiting for the optometrist to review</h2>
          <p className="text-muted">Usually within {STORE.consultReplyWithin} during opening hours. We'll message you on WhatsApp with a time.</p>
        </>
      )}
      {c.status === 'completed' && (
        <>
          <h2 className="display text-xl">Notes from your call</h2>
          <p className="rounded-md bg-soft px-4 py-3.5">{c.notes}</p>
          <div className="flex flex-wrap items-center gap-3"><Link className="btn btn-secondary btn-sm" to="/book">Book a follow-up eye test</Link><Link className="text-sm" to="/video-consultation">Still having trouble? Request another call</Link></div>
        </>
      )}
      {c.status === 'rejected' && (
        <>
          <h2 className="display text-xl">This needs an in-person check</h2>
          <p className="text-muted">From {doc}: "{c.reason}"</p>
          <p className="text-sm">You have not been charged.</p>
          <div className="flex flex-wrap gap-3"><Link className="btn btn-primary btn-sm" to="/book">Book a visit</Link><a className="btn btn-ghost btn-sm" href={STORE.phoneHref}>Call the store</a></div>
        </>
      )}
    </article>
  )
}

export default function Consultations() {
  const { consultations } = useApp()
  const [demo, setDemo] = useState(false)
  const list = demo ? EXAMPLES : consultations
  return (
    <div className="wrap grid max-w-[1000px] gap-6 pb-24 pt-8 md:gap-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-2"><p className="text-sm text-muted"><Link to="/account">My account</Link> / Consultations</p><h1 className="display text-[36px] leading-9 md:text-[56px] md:leading-[54px]">Your video consultations</h1></div>
        <Link className="btn btn-secondary max-md:w-full" to="/video-consultation">New request</Link>
      </div>
      {list.length === 0 ? (
        <EmptyState icon="video" title="No consultations yet" action={<><Link className="btn btn-primary" to="/video-consultation">Request a video call</Link><button type="button" className="btn btn-ghost" onClick={() => setDemo(true)}>See example statuses</button></>}>
          Requests you send show up here, with the Google Meet link once we approve a time.
        </EmptyState>
      ) : list.map((c) => <ConsultationCard key={c.id} c={c} />)}
      {demo && <button type="button" className="btn-text justify-self-start p-0" onClick={() => setDemo(false)}>Hide examples</button>}
    </div>
  )
}
