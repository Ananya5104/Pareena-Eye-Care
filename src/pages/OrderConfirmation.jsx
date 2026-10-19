import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '../components/Icon'
import { Alert, Badge, ProductImage } from '../components/ui'
import { payOnline } from '../lib/api'
import { inr } from '../data/catalog'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'
import NotFound from './NotFound'

const COPY = {
  paid: { tone: 'ok', badge: 'Paid', title: 'Order confirmed', lede: (o) => `Thanks, ${o.name.split(' ')[0]}. We have your payment of ${inr(o.total)}. A receipt is on its way to WhatsApp.`, step1: ['We check your prescription.', 'If anything looks off, we call you before making lenses.'], step3: 'Bring the order number. We adjust the fit on your face.', payLine: 'Paid online' },
  store: { tone: 'pending', badge: 'Pay at store', title: 'Order placed', lede: (o) => `Thanks, ${o.name.split(' ')[0]}. You pay ${inr(o.total)} when you collect. Cash, UPI or card are all fine.`, step1: ['We call to confirm your order.', 'Within 1 working day. Then we check your prescription.'], step3: 'Pay at the counter, and we adjust the fit on your face. Uncollected orders are cancelled after 14 days.', payLine: 'Due at collection' },
  failed: { tone: 'bad', badge: 'Payment failed', title: "Payment didn't go through", lede: () => 'Your order is saved. Try again, or pay when you collect instead.', payLine: 'Not paid' },
}

export default function OrderConfirmation() {
  const { id } = useParams()
  const { orders, updateOrder, clearCart } = useApp()
  const [retrying, setRetrying] = useState(false)
  const order = orders.find((o) => o.id === id)
  if (!order) return <NotFound />
  const c = COPY[order.status]

  const retry = async () => {
    setRetrying(true)
    const res = await payOnline(order)
    setRetrying(false)
    if (res.ok) { updateOrder(order.id, { status: 'paid' }); clearCart() }
  }
  const payAtStore = () => { updateOrder(order.id, { status: 'store', payment: 'store' }); clearCart() }

  return (
    <div className="wrap pb-24 pt-8 md:pt-14">
      <div className="grid items-start gap-10 md:grid-cols-[1.3fr_1fr] md:gap-12">
        <section className="grid gap-6">
          <Badge tone={c.tone} className="justify-self-start">{c.badge}</Badge>
          <div className="grid gap-2.5">
            <h1 className="display text-[40px] leading-10 md:text-[56px] md:leading-[54px]">{c.title}</h1>
            <p className="lede">{c.lede(order)}</p>
          </div>

          {order.status === 'failed' ? (
            <div className="grid gap-4">
              <Alert tone="bad" title="Your bank declined the payment">You have not been charged. We're holding your order for 30 minutes.</Alert>
              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <button type="button" className="btn btn-primary btn-lg" onClick={retry} disabled={retrying} aria-busy={retrying}>{retrying ? <><Spinner />Waiting for payment</> : 'Try paying again'}</button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={payAtStore} disabled={retrying}>Pay at store instead</button>
                <Link className="btn btn-text justify-center" to="/checkout">Use another method</Link>
              </div>
              <p className="help">Money taken but this page says failed? Your bank usually refunds it within 5 to 7 days. Call us on {STORE.phoneDisplay} and we'll check.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <h2 className="display text-2xl">What happens next</h2>
              <ol className="border-t border-ink">
                {[c.step1, ['Your lenses are made and fitted.', `About ${STORE.readyIn}.`], ['We message you on WhatsApp to collect.', c.step3]].map(([t, d], i) => (
                  <li key={t} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-b border-line py-3.5">
                    <span className="display text-2xl leading-[26px] text-sky">{i + 1}</span>
                    <span><strong>{t}</strong><br /><span className="text-muted">{d}</span></span>
                  </li>
                ))}
              </ol>
              <div className="grid gap-3 sm:flex sm:flex-wrap">
                {order.status === 'store'
                  ? <a className="btn btn-primary" href={STORE.directionsHref} target="_blank" rel="noreferrer">Get directions</a>
                  : <Link className="btn btn-primary" to="/account">View my orders</Link>}
                <Link className="btn btn-ghost" to="/shop">Keep shopping</Link>
              </div>
            </div>
          )}
        </section>

        <aside className="card grid gap-3.5 p-5 md:p-7">
          <div className="flex items-baseline justify-between"><h2 className="display text-xl">Order {order.id}</h2><span className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          {order.items.map((it, i) => (
            <div key={i} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3">
              <ProductImage ratio="h-12" />
              <span className="grid min-w-0"><strong className="truncate">{it.name}</strong><span className="help">{it.colour} · {it.lens || 'frame only'}</span></span>
              <span className="num">{inr(it.total)}</span>
            </div>
          ))}
          <dl className="num grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-t border-line pt-3.5">
            <dt className="font-semibold">Total</dt><dd className="font-semibold">{inr(order.total)}</dd>
            <dt className="text-muted">Payment</dt><dd>{c.payLine}</dd>
            <dt className="text-muted">Collect from</dt><dd className="text-right">{STORE.name}</dd>
          </dl>
        </aside>
      </div>
    </div>
  )
}
