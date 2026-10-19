import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { useApp } from '../state/AppState'
import { STORE } from '../data/store'

const LINKS = [
  { to: '/shop', label: 'Shop glasses' },
  { to: '/lens-guide', label: 'Lens guide' },
  { to: '/video-consultation', label: 'Video consultation' },
  { to: '/about', label: 'About us' },
]

function CartButton() {
  const { cartCount } = useApp()
  return (
    <Link to="/cart" className="icon-btn" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
      <Icon name="bag" />
      {cartCount > 0 && (
        <span className="absolute right-0.5 top-1 h-[18px] min-w-[18px] rounded-full bg-navy px-[5px] text-center text-[11px] font-semibold leading-[18px] text-white">
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      )}
    </Link>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useApp()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="border-b border-line bg-card">
      <div className="wrap flex min-h-[60px] items-center gap-1 md:min-h-[72px] md:gap-8">
        <Link to="/" aria-label="Pareena Eye Care Center, home" className="mr-auto md:mr-0">
          <img src="/logo.png" alt="Pareena Eye Care Center" className="h-8 w-auto md:h-10" />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 gap-7 lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Link to={user ? '/account' : '/login'} className="icon-btn hidden md:inline-flex" aria-label={user ? 'Your account' : 'Sign in'}>
          <Icon name="user" />
        </Link>
        <CartButton />
        <Link to="/book" className="btn btn-primary hidden md:inline-flex">Book an eye test</Link>
        <button type="button" className="icon-btn lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="border-t border-line lg:hidden">
          <nav aria-label="Main" className="wrap grid py-2">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className="display border-b border-line py-3.5 text-[22px] font-semibold leading-[26px] text-ink no-underline">
                {l.label}
              </NavLink>
            ))}
            <Link to={user ? '/account' : '/login'} className="py-3.5 font-medium">{user ? 'My account' : 'My account or sign in'}</Link>
          </nav>
          <div className="wrap grid gap-2.5 pb-4">
            <Link to="/book" className="btn btn-primary w-full">Book an eye test</Link>
            <a href={STORE.whatsappHref} target="_blank" rel="noreferrer" className="btn btn-ghost w-full"><Icon name="chat" />WhatsApp us</a>
          </div>
        </div>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-card text-[15px] leading-[22px]">
      <div className="wrap grid gap-8 pb-8 pt-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
        <div className="grid content-start gap-4">
          <img src="/logo.png" alt="Pareena Eye Care Center" className="h-11 w-auto justify-self-start md:h-12" />
          <p className="text-muted">{STORE.addressLines[0]}<br />{STORE.addressLines[1]}</p>
          <a href={STORE.directionsHref} target="_blank" rel="noreferrer" className="justify-self-start">Get directions</a>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Opening hours</h4>
          <p className="num text-muted">{STORE.hours.map((h) => <span key={h.days} className="block">{h.short}: {h.time}</span>)}</p>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Contact</h4>
          <p className="grid gap-1.5">
            <a href={STORE.phoneHref} className="inline-flex items-center gap-2 text-ink"><Icon name="phone" /><span className="num">{STORE.phoneDisplay}</span></a>
            <a href={STORE.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-ink"><Icon name="chat" />WhatsApp us</a>
            <a href={`mailto:${STORE.email}`} className="text-ink">{STORE.email}</a>
          </p>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Shop</h4>
          <p className="grid gap-1.5">
            <Link to="/shop" className="text-ink">Shop glasses</Link>
            <Link to="/lens-guide" className="text-ink">Lens guide</Link>
            <Link to="/book" className="text-ink">Book an eye test</Link>
            <Link to="/video-consultation" className="text-ink">Video consultation</Link>
          </p>
        </div>
      </div>
      <div className="wrap border-t border-line py-5 text-sm text-muted">© {new Date().getFullYear()} {STORE.name}</div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:p-3">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
