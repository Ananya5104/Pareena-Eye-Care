import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { Alert, EmptyState, ErrorState, Loading, Select } from '../components/ui'
import { GENDERS, PRICE_RANGES, SHAPES } from '../data/catalog'
import { getProducts } from '../lib/api'
import useAsync from '../lib/useAsync'
import { useApp } from '../state/AppState'

const PAGE = 9
const SORTS = {
  popular: { label: 'Most popular', fn: () => 0 },
  low: { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  high: { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
}

function toggle(list, v) { return list.includes(v) ? list.filter((x) => x !== v) : [...list, v] }

function Filters({ f, setF, idPrefix, brands }) {
  return (
    <div className="grid">
      <fieldset className="grid gap-1 border-t border-line py-4">
        <legend className="field-label float-left w-full pb-2">Gender</legend>
        {GENDERS.map((g) => (
          <label key={g} className="check"><input type="checkbox" checked={f.genders.includes(g)} onChange={() => setF({ ...f, genders: toggle(f.genders, g) })} />{g}</label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2.5 border-t border-line py-4">
        <legend className="field-label float-left w-full pb-2">Shape</legend>
        <div className="flex flex-wrap gap-2">
          {SHAPES.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={f.shapes.includes(s)} onClick={() => setF({ ...f, shapes: toggle(f.shapes, s) })}>{s}</button>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-1 border-t border-line py-4">
        <legend className="field-label float-left w-full pb-2">Brand</legend>
        {brands.map((b) => (
          <label key={b} className="check"><input type="checkbox" checked={f.brands.includes(b)} onChange={() => setF({ ...f, brands: toggle(f.brands, b) })} />{b}</label>
        ))}
      </fieldset>
      <fieldset className="grid gap-1 border-y border-line py-4">
        <legend className="field-label float-left w-full pb-2">Price</legend>
        {PRICE_RANGES.map((p) => (
          <label key={p.id} className="check"><input type="radio" name={`${idPrefix}-price`} checked={f.price === p.id} onChange={() => setF({ ...f, price: p.id })} />{p.name}</label>
        ))}
      </fieldset>
    </div>
  )
}

const NONE = { genders: [], shapes: [], brands: [], price: 'any' }

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const type = params.get('type') === 'sun' ? 'sun' : 'glasses'
  const [f, setF] = useState(NONE)
  const [sort, setSort] = useState('popular')
  const [shown, setShown] = useState(PAGE)
  const [sheet, setSheet] = useState(false)
  const { activeRx, noPower } = useApp()
  const { data: products, error, reload } = useAsync(() => getProducts(type), [type])
  const all = useMemo(() => products || [], [products])
  const brands = useMemo(() => [...new Set(all.map((p) => p.brand))].sort(), [all])

  useEffect(() => setShown(PAGE), [f, type, sort])
  useEffect(() => {
    if (!sheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setSheet(false)
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [sheet])

  const items = useMemo(() => {
    const price = PRICE_RANGES.find((p) => p.id === f.price).test
    return all.filter((p) => (!f.genders.length || f.genders.includes(p.gender) || (p.gender === 'Unisex' && !f.genders.includes('Kids')))
      && (!f.shapes.length || f.shapes.includes(p.shape))
      && (!f.brands.length || f.brands.includes(p.brand))
      && price(p.price)).sort(SORTS[sort].fn)
  }, [all, f, sort])

  const active = [
    ...f.genders.map((v) => ({ name: v, remove: () => setF({ ...f, genders: toggle(f.genders, v) }) })),
    ...f.shapes.map((v) => ({ name: v, remove: () => setF({ ...f, shapes: toggle(f.shapes, v) }) })),
    ...f.brands.map((v) => ({ name: v, remove: () => setF({ ...f, brands: toggle(f.brands, v) }) })),
    ...(f.price !== 'any' ? [{ name: PRICE_RANGES.find((p) => p.id === f.price).name, remove: () => setF({ ...f, price: 'any' }) }] : []),
  ]
  const title = type === 'sun' ? 'Sunglasses' : 'Eyeglasses'
  const setType = (t) => setParams(t === 'sun' ? { type: 'sun' } : {})

  return (
    <div className="wrap grid gap-5 pb-24 pt-6 md:gap-7 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4 md:gap-6">
        <div className="grid gap-2">
          <p className="hidden text-sm text-muted md:block"><Link to="/">Home</Link> / Shop glasses</p>
          <h1 className="display text-[40px] leading-[40px] md:text-[56px] md:leading-[54px]">{title}</h1>
        </div>
        <div role="tablist" aria-label="Frame type" className="grid w-full grid-cols-2 rounded-md border border-line-strong bg-card p-[3px] sm:inline-grid sm:w-auto">
          {[['glasses', 'Eyeglasses'], ['sun', 'Sunglasses']].map(([t, label]) => (
            <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => setType(t)}
              className={`min-h-10 rounded-[6px] px-[18px] text-[15px] font-semibold ${type === t ? 'bg-navy text-[#fcfdff]' : 'bg-transparent text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!activeRx && !noPower && (
        <Alert tone="info">
          Prices shown are for the frame. <Link to="/prescription?next=/shop">Add your prescription</Link> first and we'll show which lenses fit each frame, with lens prices.
        </Alert>
      )}

      <div className="sticky top-0 z-10 -mx-4 grid grid-cols-2 gap-2 border-b border-line bg-surface px-4 py-2.5 md:hidden">
        <button type="button" className="btn btn-ghost bg-card" onClick={() => setSheet(true)}><Icon name="filter" />Filters{active.length ? ` (${active.length})` : ''}</button>
        <Select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </Select>
      </div>

      <div className="grid items-start gap-10 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden border-t border-ink md:block">
          <div className="flex items-center justify-between py-3.5">
            <h2 className="display text-xl">Filters</h2>
            <button type="button" className="btn-text p-0 text-[15px]" onClick={() => setF(NONE)}>Clear all</button>
          </div>
          <Filters f={f} setF={setF} idPrefix="side" brands={brands} />
        </aside>

        <section aria-label="Frames" className="grid min-w-0 gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted">{products && <><strong className="text-ink">{items.length}</strong> {items.length === 1 ? 'frame' : 'frames'}</>}</p>
            <div className="hidden items-center gap-2.5 md:flex">
              <label htmlFor="sort" className="text-sm text-muted">Sort by</label>
              <div className="w-[200px]">
                <Select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </Select>
              </div>
            </div>
          </div>
          {active.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {active.map((a) => (
                <button key={a.name} type="button" onClick={a.remove} aria-label={`Remove filter ${a.name}`} className="inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-[#b9d6ee] bg-sky-soft px-2.5 py-1 text-sm font-medium text-navy">
                  {a.name}<Icon name="close" size={14} />
                </button>
              ))}
            </div>
          )}

          {error ? (
            <ErrorState title="We couldn't load the frames" onRetry={reload} />
          ) : !products ? (
            <Loading>Loading frames</Loading>
          ) : items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
                {items.slice(0, shown).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div className="grid justify-items-center gap-2.5 pt-6">
                <p className="text-sm text-muted">Showing {Math.min(shown, items.length)} of {items.length}</p>
                {shown < items.length && <button type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + PAGE)}>Show more frames</button>}
              </div>
            </>
          ) : (
            <EmptyState icon="glasses" title={active.length ? `No frames match all ${active.length} filters` : 'No frames here yet'}
              action={active.length ? <button type="button" className="btn btn-secondary" onClick={() => setF(NONE)}>Clear all filters</button> : null}>
              Try removing a filter. We also have more frames in the store than we show online.
            </EmptyState>
          )}
        </section>
      </div>

      {sheet && (
        <>
          <div className="scrim md:hidden" onClick={() => setSheet(false)} aria-hidden="true" />
          <section role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] flex-col rounded-t-md bg-card md:hidden">
            <div className="grid place-items-center pt-2"><span className="h-1 w-10 rounded-sm bg-[#c3ccd9]" /></div>
            <div className="flex items-center justify-between border-b border-line py-1 pl-4 pr-2">
              <h2 className="display text-xl">Filters</h2>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setSheet(false)}><Icon name="close" /></button>
            </div>
            <div className="flex-1 overflow-auto px-4"><Filters f={f} setF={setF} idPrefix="sheet" brands={brands} /></div>
            <div className="grid grid-cols-[1fr_2fr] gap-2.5 border-t border-line px-4 pb-5 pt-3">
              <button type="button" className="btn btn-ghost" onClick={() => setF(NONE)}>Clear all</button>
              <button type="button" className="btn btn-primary" onClick={() => setSheet(false)}>Show {items.length} {items.length === 1 ? 'frame' : 'frames'}</button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
