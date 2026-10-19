import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LensPanel from '../components/LensPanel'
import { Badge, ErrorState, Loading, ProductImage, SectionHeading } from '../components/ui'
import { inr } from '../data/catalog'
import { getProduct } from '../lib/api'
import useAsync from '../lib/useAsync'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'
import NotFound from './NotFound'

const VIEWS = [['front', 'Front'], ['side', 'Side'], ['angle', 'Angle'], ['on_face', 'On face']]

// The photo for a view, preferring one tagged with the chosen colour.
function photoFor(product, view, colour) {
  const forView = product.images.filter((i) => i.view === view)
  return (forView.find((i) => i.variantId === colour.id) || forView.find((i) => !i.variantId) || forView[0] || {}).src
}

function SizeDiagram({ size }) {
  const [lens, bridge, arm] = size.split('-')
  return (
    <svg viewBox="0 0 400 120" role="img" aria-label={`Lens width ${lens} mm, bridge ${bridge} mm, arm length ${arm} mm`} className="hidden h-auto w-full md:block" style={{ fontFamily: 'Barlow, sans-serif' }}>
      <g fill="none" stroke="#9aa5b8" strokeWidth="1.5" strokeLinecap="round">
        <path d="M60 52c0-14 18-18 40-18s28 6 28 18-8 32-34 32S60 68 60 52zM172 52c0-12 6-18 28-18s40 4 40 18-8 32-34 32-34-18-34-32z" />
        <path d="M128 50c6-6 38-6 44 0M60 44 30 30M240 44l100-14" />
      </g>
      <g stroke="#2386c8" strokeWidth="1.5">
        <path d="M60 100h68M60 95v10M128 95v10" />
        <path d="M128 18h44M128 13v10M172 13v10" />
        <path d="M240 108h100M240 103v10M340 103v10" />
      </g>
      <g fontSize="13" fill="#231f20" textAnchor="middle">
        <text x="94" y="118">{lens} lens</text><text x="150" y="10">{bridge} bridge</text><text x="290" y="100">{arm} arm</text>
      </g>
    </svg>
  )
}

export default function Product() {
  const { id } = useParams()
  const { data: product, error, reload } = useAsync(() => getProduct(id), [id])
  const [view, setView] = useState(0)
  const [colourIx, setColourIx] = useState(0)
  const [panel, setPanel] = useState(false)
  const [frameOnly, setFrameOnly] = useState(false)
  const { addToCart } = useApp()

  if (error && error.response && error.response.status === 404) return <NotFound />
  if (error) return <div className="wrap py-16"><ErrorState title="We couldn't load this frame" onRetry={reload} /></div>
  if (!product) return <Loading>Loading frame</Loading>
  const colour = product.colours[colourIx] || product.colours[0] || { id: null, name: 'Standard', hex: '#9aa5b8', stock: 0 }
  const soldOut = !colour.stock
  const [lens, bridge, arm] = product.size.split('-')
  const isSun = product.type === 'sun'

  const buyFrameOnly = () => {
    addToCart({ product, colour, lens: null })
    setFrameOnly(true)
  }

  return (
    <div className="pb-28 md:pb-24">
      <div className="wrap grid gap-6 pt-4 md:gap-14 md:pt-8">
        <p className="hidden text-sm text-muted md:block">
          <Link to="/">Home</Link> / <Link to={isSun ? '/shop?type=sun' : '/shop'}>{isSun ? 'Sunglasses' : 'Eyeglasses'}</Link> / {product.name}
        </p>
        <div className="grid items-start gap-6 md:grid-cols-[1.2fr_1fr] md:gap-14">
          <section aria-label="Photos" className="-mx-4 grid gap-3 md:mx-0">
            <ProductImage src={photoFor(product, VIEWS[view][0], colour)} alt={`${product.name}, ${VIEWS[view][1]} view`} caption={`${VIEWS[view][1]} view, photo coming soon`} ratio="aspect-square md:aspect-[4/3]" className="rounded-none md:rounded-md" />
            <div className="grid grid-cols-4 gap-2 px-4 md:gap-3 md:px-0">
              {VIEWS.map(([key, v], i) => {
                const src = photoFor(product, key, colour)
                return (
                  <button key={key} type="button" aria-label={`Show ${v} view`} aria-pressed={i === view} onClick={() => setView(i)}
                    className={`aspect-[4/3] overflow-hidden rounded-md bg-soft text-[13px] font-medium text-muted ${i === view ? 'border-2 border-navy' : 'border border-line'}`}>
                    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : v}
                  </button>
                )
              })}
            </div>
          </section>

          <section aria-label="Product details" className="grid gap-6 md:gap-7">
            <div className="grid gap-2">
              <span className="label">{product.brand}</span>
              <h1 className="display text-4xl leading-9 md:text-5xl md:leading-[48px]">{product.name}</h1>
              <p className="flex items-baseline gap-2.5"><span className="num text-2xl font-semibold md:text-[28px]">{inr(product.price)}</span><span className="text-muted">{isSun ? 'with sun lenses' : 'frame only, lenses chosen next'}</span></p>
            </div>

            <div className="grid gap-2.5">
              <p className="field-label">Colour: <span className="font-normal">{colour.name}</span>{soldOut ? <span className="font-normal text-warning"> · Out of stock</span> : colour.stock <= 2 ? <span className="font-normal text-warning"> · Only {colour.stock} left</span> : null}</p>
              <div className="flex gap-2.5">
                {product.colours.map((c, i) => (
                  <button key={c.name} type="button" aria-label={c.name} aria-pressed={i === colourIx} onClick={() => setColourIx(i)}
                    className={`grid h-11 w-11 place-items-center rounded-full bg-transparent p-0 ${i === colourIx ? 'border-2 border-navy' : 'border border-line'}`}>
                    <span className="h-[30px] w-[30px] rounded-full" style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="card grid gap-3 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="field-label">Frame size <span className="num font-normal">{product.size}</span></p>
                <Badge>{product.fit} fit</Badge>
              </div>
              <SizeDiagram size={product.size} />
              <div className="num grid grid-cols-3 border-t border-line pt-2.5 text-center md:hidden">
                <span className="grid"><span className="display text-[28px] leading-[30px]">{lens}</span><span className="help">lens width</span></span>
                <span className="grid border-x border-line"><span className="display text-[28px] leading-[30px]">{bridge}</span><span className="help">bridge</span></span>
                <span className="grid"><span className="display text-[28px] leading-[30px]">{arm}</span><span className="help">arm length</span></span>
              </div>
              <p className="help">Sizes are in millimetres. Compare with the numbers printed inside the arm of glasses you already own.</p>
            </div>

            {!isSun && (
              <div className="grid gap-2.5">
                <p className="field-label">Lens compatibility</p>
                <dl className="grid grid-cols-[minmax(0,1fr)_auto] border-t border-line">
                  <dt className="border-b border-line py-2.5">Single vision, blue light, anti-glare</dt><dd className="border-b border-line py-2.5 font-semibold text-success">Fits</dd>
                  <dt className="border-b border-line py-2.5">Photochromic</dt><dd className="border-b border-line py-2.5 font-semibold text-success">Fits</dd>
                  <dt className="border-b border-line py-2.5">Progressive</dt>
                  <dd className={`border-b border-line py-2.5 font-semibold ${product.progressive ? 'text-success' : 'text-warning'}`}>{product.progressive ? 'Fits' : 'Too small'}</dd>
                  <dt className="border-b border-line py-2.5">Power range</dt><dd className="num border-b border-line py-2.5">{product.powerRange}</dd>
                </dl>
              </div>
            )}

            <div className="hidden gap-2.5 md:grid">
              {!isSun && <button type="button" className="btn btn-primary btn-lg w-full" onClick={() => setPanel(true)} disabled={soldOut}>Select lenses</button>}
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" className={`btn ${isSun ? 'btn-primary' : 'btn-ghost'}`} onClick={buyFrameOnly} disabled={soldOut}>{isSun ? 'Add to cart' : 'Buy frame only'}</button>
                <Link to="/book" className="btn btn-ghost">Try it at the store</Link>
              </div>
              {frameOnly && <p className="text-sm text-success" role="status">Added to your cart. <Link to="/cart">Go to cart</Link></p>}
              <p className="help">Ready to collect in {STORE.readyIn}{isSun ? '' : ' after we receive your prescription'}.</p>
            </div>
          </section>
        </div>

        <section className="grid gap-5 border-t border-line pt-8 md:grid-cols-[1fr_2fr] md:gap-16 md:pt-12">
          <SectionHeading>About this frame</SectionHeading>
          <div className="grid gap-5">
            <p className="text-[17px] leading-7 md:text-lg">{product.description || '[A short description from the shop: who it suits, how it feels to wear.]'}</p>
            <dl className="grid grid-cols-[110px_minmax(0,1fr)] border-t border-line md:grid-cols-[180px_minmax(0,1fr)]">
              {[['Material', product.material], ['Rim', product.rim], ['Weight', product.weight], ['Hinges', product.hinges], ['For', product.gender]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="contents"><dt className="border-b border-line py-3 text-muted">{k}</dt><dd className="border-b border-line py-3">{v}</dd></div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 border-t border-line bg-card px-4 pb-5 pt-3 md:hidden">
        <span className="grid"><span className="help">{isSun ? 'Price' : 'Frame'}</span><span className="num font-semibold">{inr(product.price)}</span></span>
        {isSun
          ? <button type="button" className="btn btn-primary" onClick={buyFrameOnly} disabled={soldOut}>{soldOut ? 'Out of stock' : frameOnly ? 'Added' : 'Add to cart'}</button>
          : <button type="button" className="btn btn-primary" onClick={() => setPanel(true)} disabled={soldOut}>{soldOut ? 'Out of stock' : 'Select lenses'}</button>}
      </div>

      {panel && <LensPanel product={product} colour={colour} onClose={() => setPanel(false)} />}
    </div>
  )
}
