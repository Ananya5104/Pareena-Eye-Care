import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Badge, EmptyState, ErrorState, Loading } from '../components/ui'
import { getMyConsultations, lookupConsultations } from '../lib/api'
import useAsync from '../lib/useAsync'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

// Status comes from the backend: pending -> approved (with Meet link + time) -> completed (with notes), or rejected (with reason).
const TONE = { pending: ['pending', 'Pending'], approved: ['info', 'Approved'], completed: ['ok', 'Completed'], rejected: ['bad', 'Rejected'] }

export function ConsultationCard({ c }) {
  const [tone, label] = TONE[c.status]
  const sent = `Sent ${new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
  const doc = STORE.optometrist.name
  return (
    <article className={`card grid gap-4 p-5 md:p-7 ${c.status === 'approved' ? 'border-2 border-navy' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3"><Badge tone={tone}>{label}</Badge><span className="num text-sm text-muted">{c.shortId} · {sent}</span></div>
        <span className="text-sm text-muted">{c.issues.join(', ')}</span>
      </div>

      {c.status === 'approved' && (
        <>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
            <div className="grid gap-1.5">
              <h2 className="display text-2xl">{c.callLabel ? `Your call is ${c.callLabel}` : 'Your call link is ready'}</h2>
              <p className="text-muted">With {doc} on Google Meet. About 10 minutes. Sit somewhere bright, and keep your glasses, lens case or eye drops nearby.</p>
            </div>
            <div className="grid justify-items-stretch gap-2 md:justify-items-center">
              <a className="btn btn-primary btn-lg" href={c.meetUrl} target="_blank" rel="noreferrer"><Icon name="video" />Join Google Meet</a>
              <span className="help text-center">{c.opensLabel ? `Opens from ${c.opensLabel}. ` : ''}We also send the link on WhatsApp or email.</span>
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
          <p className="text-muted">Usually within {STORE.consultReplyWithin} during opening hours. We'll send you a time and a Google Meet link.</p>
        </>
      )}
      {c.status === 'completed' && (
        <>
          <h2 className="display text-xl">Notes from your call</h2>
          {c.notes ? <p className="rounded-md bg-soft px-4 py-3.5">{c.notes}</p> : <p className="text-muted">Your call is done. If anything changes, request another call or book an eye test.</p>}
          <div className="flex flex-wrap items-center gap-3"><Link className="btn btn-secondary btn-sm" to="/book">Book a follow-up eye test</Link><Link className="text-sm" to="/video-consultation">Still having trouble? Request another call</Link></div>
        </>
      )}
      {c.status === 'rejected' && (
        <>
          <h2 className="display text-xl">This needs an in-person check</h2>
          <p className="text-muted">{c.reason ? <>From {doc}: "{c.reason}"</> : 'Our optometrist would like to see you in person for this.'}</p>
          <p className="text-sm">You have not been charged.</p>
          <div className="flex flex-wrap gap-3"><Link className="btn btn-primary btn-sm" to="/book">Book a visit</Link><a className="btn btn-ghost btn-sm" href={STORE.phoneHref}>Call the store</a></div>
        </>
      )}
    </article>
  )
}

export default function Consultations() {
  const { consultationRefs, user } = useApp()
  const { data: list, error, reload } = useAsync(
    () => (user ? getMyConsultations() : lookupConsultations(consultationRefs)),
    [user && user.id, consultationRefs.join()],
  )
  return (
    <div className="wrap grid max-w-[1000px] gap-6 pb-24 pt-8 md:gap-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-2"><p className="text-sm text-muted"><Link to="/account">My account</Link> / Consultations</p><h1 className="display text-[36px] leading-9 md:text-[56px] md:leading-[54px]">Your video consultations</h1></div>
        <Link className="btn btn-secondary max-md:w-full" to="/video-consultation">New request</Link>
      </div>
      {error ? (
        <ErrorState title="We couldn't load your consultations" onRetry={reload} />
      ) : !list ? (
        <Loading>Loading your consultations</Loading>
      ) : list.length === 0 ? (
        <EmptyState icon="video" title="No consultations yet" action={<Link className="btn btn-primary" to="/video-consultation">Request a video call</Link>}>
          Requests you send show up here, with the Google Meet link once we approve a time.
        </EmptyState>
      ) : list.map((c) => <ConsultationCard key={c.id} c={c} />)}
    </div>
  )
}
