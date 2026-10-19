import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon, { Spinner } from '../components/Icon'
import { Alert, Field, ProductImage } from '../components/ui'
import { createOrder, errorMessage, getClinic, payOnline } from '../lib/api'
import useAsync from '../lib/useAsync'
import { inr } from '../data/catalog'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

const PHONE_RE = /^(\+?91)?[6-9]\d{9}$/

function Radio({ on }) {
  return <span aria-hidden="true" className={`h-5 w-5 flex-none rounded-full ${on ? 'border-[6px] border-navy bg-card' : 'border-[1.5px] border-line-strong'}`} />
}

export default function Checkout() {
  const { cartLines, cartTotal, user, addOrderRef, clearCart } = useApp()
  const navigate = useNavigate()
  const { data: clinic } = useAsync(getClinic, [])
  const onlineOk = Boolean(clinic && clinic.online_payments_available)
  const [form, setForm] = useState({ name: user ? user.name : '', phone: user ? user.phone : '', email: user ? user.email : '' })
  const [pay, setPay] = useState(null)
  const [errors, setErrors] = useState({})
  const [stage, setStage] = useState('form') // form | saving | paying
  const [failed, setFailed] = useState('')

  if (!cartLines.length && stage === 'form') return <Navigate to="/cart" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!form.name.trim()) er.name = 'Enter your name.'
    if (!PHONE_RE.test(form.phone.replace(/[\s-]/g, ''))) er.phone = 'We need a 10-digit mobile number to tell you when your glasses are ready.'
    if (!pay) er.pay = "Choose how you'd like to pay."
    setErrors(er)
    if (Object.keys(er).length) return
    setFailed('')
    try {
      setStage('saving')
      const { order, payment } = await createOrder(form, cartLines, pay)
      // The order exists now (stock is held), so the cart is done either way.
      addOrderRef(order.id)
      clearCart()
      if (pay === 'online') {
        setStage('paying')
        await payOnline(order, payment)
      }
      navigate(`/order/${order.id}`)
    } catch (err) {
      setFailed(errorMessage(err))
      setStage('form')
    }
  }

  if (stage === 'paying') {
    return (
      <div role="status" className="wrap grid max-w-[480px] justify-items-center gap-4 py-32 text-center">
        <Spinner size={36} className="text-navy" />
        <h1 className="display text-2xl">Waiting for your payment</h1>
        <p className="text-muted">Approve {inr(cartTotal)} in your UPI app or the payment window. Please keep this page open.</p>
        <p className="help">This usually takes under a minute.</p>
      </div>
    )
  }

  const busy = stage !== 'form'
  const errCount = Object.keys(errors).length
  return (
    <div className="wrap grid gap-6 pb-32 pt-8 md:gap-8 md:pb-24 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[40px] leading-10 md:text-[56px] md:leading-[54px]">Checkout</h1>
        <span className="inline-flex items-center gap-2 text-sm text-muted"><Icon name="lock" />Secure checkout</span>
      </div>
      <form onSubmit={submit} noValidate className="grid items-start gap-8 md:grid-cols-[1.5fr_1fr] md:gap-10">
        <div className="grid gap-8 md:card md:p-8">
          {errCount > 0 && <Alert tone="bad" title={`${errCount} ${errCount === 1 ? 'thing' : 'things'} to fix`}>Then try again.</Alert>}
          {failed && <Alert tone="bad" title="We couldn't place your order">{failed} You have not been charged.</Alert>}

          <section className="grid gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="display text-xl md:text-2xl">1. Your details</h2>
              {!user && <span className="text-sm text-muted">No account needed. <Link to="/login?next=/checkout">Sign in</Link> to fill these in.</span>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}>{(a) => <input {...a} className="input" autoComplete="name" value={form.name} onChange={set('name')} disabled={busy} />}</Field>
              <Field label="Mobile number" error={errors.phone} help="So we can tell you when your glasses are ready.">{(a) => <input {...a} className="input num" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} disabled={busy} />}</Field>
              <Field label="Email" optional="optional, for the receipt" className="sm:col-span-2">{(a) => <input {...a} className="input" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} disabled={busy} />}</Field>
            </div>
          </section>

          <section className="grid gap-3 border-t border-line pt-7">
            <h2 className="display text-xl md:text-2xl">2. Collection</h2>
            <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-md bg-soft p-4">
              <Icon name="pin" size={24} className="text-sky" />
              <div className="grid gap-0.5"><strong>Collect from {STORE.name}</strong><span className="text-muted">{STORE.addressLines.join(', ')}</span><span className="help">We fit and adjust them on your face when you collect. Ready in {STORE.readyIn}.</span></div>
            </div>
          </section>

          <section className="grid gap-3 border-t border-line pt-7">
            <h2 className="display text-xl md:text-2xl">3. How would you like to pay?</h2>
            <div role="radiogroup" aria-label="Payment" className={`grid gap-3 sm:grid-cols-2 ${errors.pay ? 'rounded-md border-[1.5px] border-danger p-2' : ''}`}>
              {[['online', 'Pay online', onlineOk ? 'UPI, cards or net banking. Your order goes straight to the lab.' : 'Not available right now. Please pay at the store.'], ['store', 'Pay at store', 'Pay when you collect. Cash, UPI or card.']].map(([v, t, d]) => (
                <button key={v} type="button" role="radio" aria-checked={pay === v} className="choice gap-1.5" onClick={() => setPay(v)} disabled={busy || (v === 'online' && !onlineOk)}>
                  <span className="flex items-center justify-between"><strong className="text-[17px]">{t}</strong><Radio on={pay === v} /></span>
                  <span className="help">{d}</span>
                </button>
              ))}
            </div>
            {errors.pay && <span className="field-error">{errors.pay}</span>}
            {pay === 'store' && <Alert tone="info">We'll call to confirm before making your lenses. Orders not collected within 14 days are cancelled.</Alert>}
          </section>

          <div className="fixed inset-x-0 bottom-0 z-30 grid gap-2 border-t border-line bg-card px-4 pb-5 pt-3 md:static md:border-0 md:bg-transparent md:p-0">
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy} aria-busy={busy}>
              {busy ? <><Spinner />Placing your order</> : pay === 'store' ? 'Place order, pay at store' : pay === 'online' ? `Pay ${inr(cartTotal)}` : 'Continue'}
            </button>
            <p className="help hidden text-center md:block">You can cancel free of charge until we start making your lenses.</p>
          </div>
        </div>

        <aside className="card grid gap-4 p-5 md:sticky md:top-6 md:p-7">
          <h2 className="display text-xl md:text-2xl">Order summary</h2>
          {cartLines.map((l) => (
            <div key={l.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3">
              <ProductImage src={l.product.image} ratio="h-12" />
              <span className="grid min-w-0"><strong className="truncate">{l.product.name}</strong><span className="help">{l.colour} · {l.lens ? l.lens.name : 'frame only'}</span></span>
              <span className="num">{inr(l.total)}</span>
            </div>
          ))}
          <dl className="num grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-t border-line pt-3.5">
            <dt className="text-muted">Subtotal</dt><dd>{inr(cartTotal)}</dd>
            <dt className="text-muted">Fitting and collection</dt><dd>Free</dd>
            <dt className="text-lg font-semibold">Total</dt><dd className="text-lg font-semibold">{inr(cartTotal)}</dd>
          </dl>
          <p className="help">Prices include GST.</p>
        </aside>
      </form>
    </div>
  )
}
