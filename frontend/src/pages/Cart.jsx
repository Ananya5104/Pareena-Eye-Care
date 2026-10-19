import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { EmptyState, ProductImage } from '../components/ui'
import { inr } from '../data/catalog'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

export default function Cart() {
  const { cartLines, framesTotal, lensesTotal, cartTotal, removeFromCart } = useApp()

  return (
    <div className="wrap grid gap-6 pb-32 pt-8 md:gap-8 md:pb-24 md:pt-12">
      <h1 className="display text-[40px] leading-10 md:text-[56px] md:leading-[54px]">Your cart{cartLines.length ? ` (${cartLines.length})` : ''}</h1>

      {cartLines.length === 0 ? (
        <EmptyState title="Your cart is empty" action={<Link className="btn btn-primary" to="/shop">Shop glasses</Link>}>
          Frames you choose show up here, with your lenses and prescription.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-8 md:grid-cols-[1.7fr_1fr] md:gap-10">
          <section aria-label="Items" className="border-t border-ink">
            {cartLines.map((l) => (
              <article key={l.id} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3.5 border-b border-line py-5 md:grid-cols-[180px_minmax(0,1fr)_auto] md:gap-6 md:py-6">
                <Link to={`/shop/${l.product.id}`}><ProductImage src={l.product.image} alt={l.product.name} /></Link>
                <div className="grid content-start gap-1.5">
                  <span className="label text-xs">{l.product.brand}</span>
                  <h2 className="text-[17px] font-semibold leading-6 md:text-xl">{l.product.name}</h2>
                  <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted">Colour</dt><dd>{l.colour}</dd>
                    <dt className="text-muted">Lenses</dt><dd>{l.lens ? l.lens.name : l.product.type === 'sun' ? 'Sun lenses, no power' : 'Frame only'}</dd>
                    {l.lens && <><dt className="text-muted">Prescription</dt><dd>{l.rx ? `${l.rx.name}, ${l.rx.date}` : 'Plain, no power'}</dd></>}
                  </dl>
                  <div className="mt-1.5 flex items-center justify-between gap-5 md:justify-start">
                    <span className="num font-semibold md:hidden">{inr(l.total)}</span>
                    <span className="flex gap-4 text-sm">
                      {l.product.type !== 'sun' && <Link to={`/shop/${l.product.id}`}>Change lenses</Link>}
                      <button type="button" className="font-medium text-danger underline" onClick={() => removeFromCart(l.id)}>Remove</button>
                    </span>
                  </div>
                </div>
                <div className="num hidden content-start gap-0.5 text-right md:grid">
                  <span className="text-lg font-semibold">{inr(l.total)}</span>
                  <span className="help">{l.lens ? `Frame ${inr(l.framePrice)} + lenses ${inr(l.lensPrice)}` : 'Frame only'}</span>
                </div>
              </article>
            ))}
            <Link to="/shop" className="mt-5 inline-block">Keep shopping</Link>
          </section>

          <aside className="grid gap-4 md:card md:sticky md:top-6 md:p-7">
            <h2 className="display hidden text-2xl md:block">Order summary</h2>
            <dl className="num grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2.5">
              <dt className="text-muted">Frames</dt><dd>{inr(framesTotal)}</dd>
              <dt className="text-muted">Lenses</dt><dd>{inr(lensesTotal)}</dd>
              <dt className="text-muted">Fitting</dt><dd>Free</dd>
              <dt className="hidden border-t border-line pt-3 text-lg font-semibold md:block">Total</dt><dd className="hidden border-t border-line pt-3 text-lg font-semibold md:block">{inr(cartTotal)}</dd>
            </dl>
            <p className="help">Pay online, or choose to pay when you collect. No account needed.</p>
            <div className="flex items-start gap-2.5 border-t border-line pt-3.5 text-sm">
              <Icon name="clock" className="text-sky" />
              <span>Ready to collect in {STORE.readyIn}. We check your prescription before making lenses.</span>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-30 grid gap-2.5 border-t border-line bg-card px-4 pb-5 pt-3 md:static md:border-0 md:bg-transparent md:p-0">
              <div className="num flex justify-between md:hidden"><strong>Total</strong><strong>{inr(cartTotal)}</strong></div>
              <Link className="btn btn-primary w-full" to="/checkout">Go to checkout</Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
