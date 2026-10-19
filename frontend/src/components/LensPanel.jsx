import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import Icon from './Icon'
import { Alert, ProductImage } from './ui'
import { LENSES, inr } from '../data/catalog'
import { hasAdd, useApp } from '../state/AppState'

function rxSummary(rx) {
  const eye = (e) => [e.sph, e.cyl && e.cyl !== '0.00' ? `${e.cyl} × ${e.axis || '?'}` : null].filter(Boolean).join(' / ')
  return `R ${eye(rx.right)} · L ${eye(rx.left)}${hasAdd(rx) ? ` · ADD ${rx.right.add || rx.left.add}` : ' · no ADD'}`
}

function unavailableReason(lens, product, rx, noPower) {
  if (noPower && !lens.worksWithoutPower) return 'Needs a prescription power.'
  if (lens.needsAdd && !product.progressive) return 'This frame is too small for progressive lenses.'
  if (lens.needsAdd && !hasAdd(rx)) return 'Needs an ADD value. Your prescription has none.'
  return null
}

// Step 2 of buying glasses: choose the lens type and see the total.
// A panel from the right on desktop, a sheet from the bottom on phones.
export default function LensPanel({ product, colour, onClose }) {
  const { activeRx, noPower, prescriptions, setActiveRx, setNoPower, addToCart, cartCount } = useApp()
  const [lensId, setLensId] = useState(null)
  const [added, setAdded] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current && closeRef.current.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const needsRx = !activeRx && !noPower
  const options = LENSES.map((l) => ({ ...l, reason: unavailableReason(l, product, activeRx, noPower) }))
  const firstOk = options.find((o) => !o.reason)
  const chosen = options.find((o) => o.id === lensId && !o.reason) || firstOk
  const total = product.price + (chosen ? chosen.price : 0)

  const add = () => {
    addToCart({ productId: product.id, colour: colour.name, lensId: chosen ? chosen.id : null, rxId: activeRx ? activeRx.id : null })
    setAdded(true)
  }

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Choose your lenses"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-md bg-card md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[520px] md:rounded-none md:border-l md:border-line"
      >
        <div className="grid place-items-center pt-2 md:hidden"><span className="h-1 w-10 rounded-sm bg-[#c3ccd9]" /></div>
        <div className="flex items-center justify-between border-b border-line py-2 pl-4 pr-2 md:py-4 md:pl-7 md:pr-4">
          <div className="grid gap-0.5">
            <span className="label text-xs">{added ? 'Done' : 'Step 2 of 2'}</span>
            <h2 className="display text-xl md:text-2xl">{added ? 'Added to your cart' : needsRx ? 'First, your prescription' : 'Choose your lenses'}</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>

        {added ? (
          <div className="grid gap-4 overflow-auto p-4 md:p-7">
            <Alert tone="ok" title="Added to your cart" role="status" />
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3.5">
              <ProductImage ratio="h-[66px]" />
              <div className="grid gap-0.5">
                <strong>{product.name}, {colour.name}</strong>
                <span className="help">{chosen ? chosen.name : 'Frame only'}{activeRx ? ` · ${activeRx.name}'s prescription` : ''}</span>
                <span className="num font-semibold">{inr(total)}</span>
              </div>
            </div>
            <Link to="/cart" className="btn btn-primary w-full">Go to cart ({cartCount})</Link>
            <button type="button" className="btn btn-ghost w-full" onClick={onClose}>Keep shopping</button>
          </div>
        ) : needsRx ? (
          <div className="grid gap-3.5 overflow-auto p-4 md:p-7">
            <p className="text-muted">Lenses are made to your power, so we need it before you choose. Pick whatever is easiest.</p>
            {prescriptions.length > 0 && (
              <div className="grid gap-2">
                <p className="field-label">Use a saved prescription</p>
                {prescriptions.map((p) => (
                  <button key={p.id} type="button" className="choice" onClick={() => setActiveRx(p.id)}>
                    <strong>{p.name}</strong>
                    <span className="help num">{p.date} · {rxSummary(p)}</span>
                  </button>
                ))}
              </div>
            )}
            <Link to={`/prescription?next=/shop/${product.id}`} className="grid grid-cols-[28px_minmax(0,1fr)_20px] items-center gap-3 rounded-md border border-line-strong p-3.5 text-ink no-underline">
              <Icon name="pen" size={24} className="text-sky" /><span className="grid"><strong>Type it in</strong><span className="help">About a minute. You can add a photo too.</span></span><Icon name="next" />
            </Link>
            <button type="button" className="btn-text justify-self-start pl-0 font-semibold" onClick={() => setNoPower(true)}>I don't need power (plain lenses)</button>
            <p className="help">No prescription? <Link to="/book">Book an eye test</Link> and we'll do it for you.</p>
          </div>
        ) : (
          <>
            <div className="grid flex-1 content-start gap-3 overflow-auto p-4 md:p-7">
              <div className="flex items-center justify-between gap-3 rounded-md bg-soft px-3.5 py-3">
                <div className="grid gap-0.5 text-sm">
                  <span className="text-muted">{noPower ? 'Lenses' : 'Using prescription'}</span>
                  <strong className="text-base">{noPower ? 'Plain, no power' : `${activeRx.name} · ${activeRx.date}`}</strong>
                  {!noPower && <span className="num text-muted">{rxSummary(activeRx)}</span>}
                </div>
                {noPower
                  ? <button type="button" className="btn-text p-0 text-sm" onClick={() => setNoPower(false)}>Add power</button>
                  : <Link to={`/prescription?next=/shop/${product.id}`} className="text-sm">Change</Link>}
              </div>
              <fieldset className="grid gap-2.5">
                <legend className="field-label pb-2.5">Lens type</legend>
                {options.map((l) => {
                  const on = chosen && chosen.id === l.id
                  return (
                    <label key={l.id} className={clsx('grid grid-cols-[24px_minmax(0,1fr)_auto] gap-3 rounded-md px-4 py-3.5', l.reason ? 'cursor-not-allowed border border-dashed border-[#c3ccd9] bg-surface text-[#6f7686]' : on ? 'cursor-pointer border-2 border-navy bg-sky-soft' : 'cursor-pointer border border-line-strong bg-card')}>
                      <input type="radio" name="lens" className="mt-[3px] h-[18px] w-[18px] accent-[var(--navy)]" checked={Boolean(on)} disabled={Boolean(l.reason)} onChange={() => setLensId(l.id)} />
                      <span className="grid min-w-0 gap-1">
                        <span className="font-semibold">{l.name}</span>
                        <span className="help">{l.short}</span>
                        {l.reason && (
                          <>
                            <span className="flex items-start gap-1.5 text-sm text-warning"><Icon name="info" size={16} className="mt-0.5" />{l.reason}</span>
                            {l.needsAdd && product.progressive && !noPower && <Link to={`/prescription?next=/shop/${product.id}`} className="text-sm">Add ADD to your prescription</Link>}
                          </>
                        )}
                      </span>
                      <span className="num whitespace-nowrap font-semibold">{inr(l.price)}</span>
                    </label>
                  )
                })}
              </fieldset>
              <Link to="/lens-guide" className="text-sm">Not sure? Compare lenses in the lens guide</Link>
            </div>
            <div className="grid gap-3 border-t border-line bg-card px-4 pb-5 pt-3 md:px-7 md:pb-6 md:pt-4">
              <div className="num grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
                <span className="text-muted">Frame</span><span>{inr(product.price)}</span>
                <span className="text-muted">{chosen ? `${chosen.name} lenses` : 'Lenses'}</span><span>{chosen ? inr(chosen.price) : '-'}</span>
                <span className="border-t border-line pt-1.5 font-semibold">Total</span><span className="border-t border-line pt-1.5 font-semibold">{inr(total)}</span>
              </div>
              <button type="button" className="btn btn-primary w-full" onClick={add} disabled={!chosen}>Add to cart</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
