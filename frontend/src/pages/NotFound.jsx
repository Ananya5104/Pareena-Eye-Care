import { Link } from 'react-router-dom'
import { EyeChart } from '../components/ui'
import { STORE } from '../data/store'

const ROWS = [
  { acuity: '6/60', text: '4 0 4', size: 96 },
  { acuity: '6/24', text: 'P A G E', size: 34 },
  { acuity: '6/12', text: 'N O T', size: 22 },
  { acuity: '6/6', text: 'F O U N D', size: 13 },
]
const SMALL = ROWS.map((r) => ({ ...r, size: Math.max(11, Math.round(r.size * 0.68)) }))

export default function NotFound() {
  return (
    <div className="wrap grid max-w-[1080px] items-center gap-6 pb-24 pt-8 md:grid-cols-2 md:gap-16 md:pt-20">
      <div className="md:order-2">
        <div className="hidden md:block"><EyeChart rows={ROWS} /></div>
        <div className="md:hidden"><EyeChart rows={SMALL} compact /></div>
      </div>
      <div className="grid gap-5">
        <p className="label">Error 404</p>
        <h1 className="display text-4xl leading-9 md:text-[64px] md:leading-[60px]">This page is out of focus</h1>
        <p className="lede">The link may be old, or the page has moved. Try one of these instead.</p>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link className="btn btn-primary" to="/">Go to the home page</Link>
          <Link className="btn btn-ghost" to="/shop">Shop glasses</Link>
        </div>
        <p className="help">Looking for something specific? Call or WhatsApp <a href={STORE.phoneHref}>{STORE.phoneDisplay}</a>.</p>
      </div>
    </div>
  )
}
