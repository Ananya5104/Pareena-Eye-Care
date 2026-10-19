import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { ErrorState, Loading, SectionHeading } from '../components/ui'
import { inr } from '../data/catalog'
import { STORE } from '../data/store'
import { getLenses } from '../lib/api'
import useAsync from '../lib/useAsync'

const T = { fontFamily: 'Barlow, sans-serif' }
const DIAGRAMS = {
  single: (
    <svg viewBox="0 0 120 120" role="img" aria-label="One power across the whole lens" className="h-[72px] w-[72px] flex-none md:h-[120px] md:w-[120px]">
      <circle cx="60" cy="60" r="54" fill="#fcfdff" stroke="#233b7e" strokeWidth="1.5" />
      <text x="60" y="65" textAnchor="middle" style={T} fontSize="13" fill="#545b6a">one power</text>
    </svg>
  ),
  blue: (
    <svg viewBox="0 0 120 120" role="img" aria-label="Screen light partly reflected by the lens" className="h-[72px] w-[72px] flex-none md:h-[120px] md:w-[120px]">
      <circle cx="60" cy="60" r="54" fill="#e4f0fa" stroke="#233b7e" strokeWidth="1.5" />
      <g stroke="#2386c8" strokeWidth="1.5" fill="none" strokeLinecap="round"><path d="M10 30l30 20-24 14" /><path d="M10 52l30 12-24 16" /></g>
      <path d="M40 50h60M40 64h60" stroke="#9aa5b8" strokeWidth="1.5" strokeDasharray="3 4" />
    </svg>
  ),
  glare: (
    <svg viewBox="0 0 120 120" role="img" aria-label="Fewer reflections on the lens" className="h-[72px] w-[72px] flex-none md:h-[120px] md:w-[120px]">
      <circle cx="60" cy="60" r="54" fill="#fcfdff" stroke="#233b7e" strokeWidth="1.5" />
      <g stroke="#9aa5b8" strokeWidth="1.5" strokeLinecap="round"><path d="M34 40l14-14" /><path d="M44 50l20-20" strokeDasharray="3 4" /></g>
      <circle cx="60" cy="72" r="10" fill="none" stroke="#2386c8" strokeWidth="1.5" /><path d="M44 90c8-6 24-6 32 0" stroke="#2386c8" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  photo: (
    <svg viewBox="0 0 120 120" role="img" aria-label="Clear indoors, dark outdoors" className="h-[72px] w-[72px] flex-none md:h-[120px] md:w-[120px]">
      <circle cx="60" cy="60" r="54" fill="#fcfdff" stroke="#233b7e" strokeWidth="1.5" />
      <path d="M60 6a54 54 0 0 1 0 108z" fill="#545b6a" opacity="0.55" />
      <text x="34" y="64" textAnchor="middle" style={T} fontSize="12" fill="#545b6a">indoor</text>
      <text x="86" y="64" textAnchor="middle" style={T} fontSize="12" fill="#fcfdff">outdoor</text>
    </svg>
  ),
  prog: (
    <svg viewBox="0 0 120 120" role="img" aria-label="Far at the top, middle distance in the centre, reading at the bottom" className="h-[72px] w-[72px] flex-none md:h-[120px] md:w-[120px]" style={T}>
      <circle cx="60" cy="60" r="54" fill="#fcfdff" stroke="#233b7e" strokeWidth="1.5" />
      <path d="M10 52c20 6 30 6 40 6M110 52c-20 6-30 6-40 6M50 58c-6 14-10 26-14 42M70 58c6 14 10 26 14 42" fill="none" stroke="#9aa5b8" strokeWidth="1.5" />
      <text x="60" y="36" textAnchor="middle" fontSize="12" fill="#231f20">far</text>
      <text x="60" y="76" textAnchor="middle" fontSize="11" fill="#545b6a">middle</text>
      <text x="60" y="100" textAnchor="middle" fontSize="12" fill="#231f20">near</text>
    </svg>
  ),
}

// Feature comparison, keyed by lens type slug (set in Admin → Lens types).
const FEATURES = [
  ['Sees far or near', { single: 'One of them', blue: 'One of them', glare: 'One of them', photo: 'One of them', prog: 'Both' }],
  ['Helps with screens', { single: 'No', blue: 'Yes', glare: 'A little', photo: 'No', prog: 'Middle zone' }],
  ['Cuts reflections', { single: 'No', blue: 'Yes', glare: 'Yes, most', photo: 'Yes', prog: 'Yes' }],
  ['Darkens in sun', { single: 'No', blue: 'No', glare: 'No', photo: 'Yes', prog: 'Can be added' }],
]
const rowsFor = (lenses) => [
  ...FEATURES.map(([label, byLens]) => [label, lenses.map((l) => byLens[l.id] || '—')]),
  ['Works without power', lenses.map((l) => (l.worksWithoutPower ? 'Yes' : 'No'))],
  ['Needs ADD on prescription', lenses.map((l) => (l.needsAdd ? 'Yes' : 'No'))],
  ['Ready in', lenses.map((l) => l.readyIn)],
]
const STRONG = new Set(['Both', 'Yes, most'])

export default function LensGuide() {
  const { data: lenses, error, reload } = useAsync(getLenses, [])
  const LENSES = lenses || []
  const ROWS = rowsFor(LENSES)
  return (
    <div className="wrap grid gap-10 pb-24 pt-8 md:gap-16 md:pt-14">
      <div className="grid max-w-[46em] gap-3">
        <h1 className="display text-[44px] leading-[42px] md:text-[64px] md:leading-[60px]">Lens guide</h1>
        <p className="lede text-[17px] leading-[26px] md:text-[19px] md:leading-[30px]">Five lens types, what each one does, and who it suits. Most people only need Single Vision. If you're over 40 and hold your phone further away to read, look at Progressive.</p>
      </div>

      {error && <ErrorState title="We couldn't load the lens guide" onRetry={reload} />}
      {!lenses && !error && <Loading>Loading lens types</Loading>}
      {lenses && <>
      <section aria-label="Lens types" className="border-t border-ink">
        {LENSES.map((l) => (
          <article key={l.id} className="grid gap-2.5 border-b border-line py-5 md:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_140px] md:items-center md:gap-10 md:py-8">
            <div className="flex items-center gap-3.5 md:contents">
              {DIAGRAMS[l.id] || DIAGRAMS.single}
              <div className="grid gap-0.5 md:hidden"><h2 className="display text-xl">{l.name}</h2><span className="help">From <span className="num font-semibold text-ink">{inr(l.price)}</span></span></div>
            </div>
            <div className="grid gap-1.5">
              <h2 className="display hidden text-2xl md:block">{l.name}</h2>
              <p className="text-[15px] text-muted md:text-base">{l.description}</p>
            </div>
            <p className="text-[15px] md:text-base"><strong>Good for:</strong> {l.goodFor}</p>
            <p className="hidden text-right md:block"><span className="help">From</span><br /><span className="num text-xl font-semibold">{inr(l.price)}</span></p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:gap-5">
        <div className="flex items-baseline justify-between"><SectionHeading>Side by side</SectionHeading><span className="help md:hidden">Scroll sideways</span></div>
        <div className="-mx-4 overflow-x-auto border-y border-line bg-card md:mx-0 md:rounded-md md:border">
          <table className="w-full min-w-[720px] border-collapse md:min-w-[880px]">
            <thead>
              <tr className="bg-soft">
                <th scope="col" className="sticky left-0 w-[22%] bg-soft p-3 text-left md:p-4"><span className="sr-only">Feature</span></th>
                {LENSES.map((l) => <th key={l.id} scope="col" className="display p-3 text-left text-base font-semibold md:p-4 md:text-lg">{l.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, vals]) => (
                <tr key={label} className="border-t border-line">
                  <th scope="row" className="sticky left-0 border-r border-line bg-card p-3 text-left text-sm font-semibold md:border-r-0 md:p-4 md:text-base">{label}</th>
                  {vals.map((v, i) => <td key={i} className={`p-3 md:p-4 ${v === 'No' ? 'text-muted' : ''} ${STRONG.has(v) || (v === 'Yes' && (label.startsWith('Helps') || label.startsWith('Darkens') || label.startsWith('Needs'))) ? 'font-semibold' : ''}`}>{v}</td>)}
                </tr>
              ))}
              <tr className="border-t border-line bg-surface">
                <th scope="row" className="sticky left-0 border-r border-line bg-surface p-3 text-left text-sm font-semibold md:border-r-0 md:p-4 md:text-base">Price from</th>
                {LENSES.map((l) => <td key={l.id} className="num p-3 font-semibold md:p-4">{inr(l.price)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      </>}

      <section className="grid gap-5 rounded-md border-[1.5px] border-navy bg-card p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 md:p-10">
        <div className="grid gap-2.5">
          <h2 className="display text-[28px] leading-[30px] md:text-4xl">Not sure? Contact us for guidance</h2>
          <p className="max-w-[40em] text-muted">Tell us what you do most (driving, screens, reading) and send your prescription. We'll suggest the right lens, and say so when a cheaper one will do.</p>
        </div>
        <div className="grid gap-2.5 md:min-w-[260px]">
          <a className="btn btn-primary" href={STORE.whatsappHref} target="_blank" rel="noreferrer"><Icon name="chat" />WhatsApp us</a>
          <a className="btn btn-ghost" href={STORE.phoneHref}><Icon name="phone" />Call {STORE.phoneDisplay}</a>
          <Link className="btn btn-text justify-center" to="/book">Or book a visit to the store</Link>
        </div>
      </section>
    </div>
  )
}
