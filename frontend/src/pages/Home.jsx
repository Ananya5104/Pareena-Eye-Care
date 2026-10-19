import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { EyeChart, SectionHeading } from '../components/ui'
import GoogleReviews from '../components/GoogleReviews'
import { STORE } from '../data/store'
import { getBrands } from '../lib/api'
import useAsync from '../lib/useAsync'

const CHART = [
  { acuity: '6/60', text: 'P', size: 84 },
  { acuity: '6/36', text: 'A R', size: 52 },
  { acuity: '6/18', text: 'E E N', size: 34 },
  { acuity: '6/12', text: 'A E Y E', size: 24 },
  { acuity: '6/9', text: 'C A R E', size: 18 },
  { acuity: '6/6', text: 'C E N T E R', size: 13 },
]
const CHART_SMALL = CHART.map((r) => ({ ...r, size: Math.max(11, Math.round(r.size * 0.76)) }))

const WAYS = [
  { icon: 'eye', title: 'Eye test at the store', text: 'About 20 minutes with our optometrist. Pick a time online, or walk in.', cta: 'Book a time', to: '/book' },
  { icon: 'video', title: 'Video consultation', text: "Red, dry or itchy eyes, or lenses that feel wrong? Describe it, add a photo, and we'll set up a video call.", cta: 'Request a call', to: '/video-consultation' },
  { icon: 'glasses', title: 'Frames and lenses online', text: 'Choose a frame, add your prescription and lens type, then pay online or when you collect.', cta: 'Browse frames', to: '/shop' },
]

const WHY = [
  { title: 'One person, start to finish', text: "The optometrist who tests your eyes also helps you choose the frame and fits it when it's ready." },
  { title: 'Lenses fitted in the shop', text: 'Your lenses are fitted here, so we can check the finished pair before you take it home.' },
  { title: 'Advice you can trust', text: "We'll tell you when a cheaper lens will do the job just as well." },
  { title: 'Pay online or at the store', text: 'Order online and pay when you collect, if that suits you better.' },
]

export default function Home() {
  const { data: brands } = useAsync(getBrands, [])
  return (
    <>
      <section>
        <div className="wrap grid items-center gap-8 pb-12 pt-10 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:pb-28 md:pt-24">
          <div className="grid gap-6 md:gap-8">
            <div className="grid gap-4">
              <p className="label">Optical store · Eye tests · Spectacles</p>
              <h1 className="display text-[52px] leading-[50px] md:text-[84px] md:leading-[80px]">See the world <span className="text-sky">clearly</span> again.</h1>
            </div>
            <p className="lede max-w-[30em] text-[17px] leading-[27px] md:text-[19px] md:leading-[30px]">
              A family-run optical store where your eyes are tested properly, frames are fitted with care, and the advice is honest. Book a visit, or shop frames and lenses online.
            </p>
            <div className="grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Link to="/book" className="btn btn-primary">Book an eye test</Link>
              <Link to="/shop" className="btn btn-ghost">Shop glasses</Link>
            </div>
          </div>
          <div className="hidden md:block"><EyeChart rows={CHART} caption="Can you read line 6? If not, it's time for a check-up." /></div>
          <div className="md:hidden"><EyeChart rows={CHART_SMALL} compact caption="Can you read line 6? If not, it's time for a check-up." /></div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="wrap grid gap-6 py-12 md:grid-cols-[1fr_2fr] md:gap-16 md:py-24">
          <SectionHeading>Three ways we can help</SectionHeading>
          <div className="border-t border-ink">
            {WAYS.map((w) => (
              <div key={w.title} className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-4 border-b border-line py-5 md:grid-cols-[48px_minmax(0,1fr)_auto] md:gap-6 md:py-7">
                <Icon name={w.icon} size={30} className="text-sky" />
                <div className="grid gap-1.5">
                  <h3 className="display text-xl font-semibold md:text-2xl">{w.title}</h3>
                  <p className="text-muted">{w.text}</p>
                </div>
                <Link to={w.to} className="btn btn-secondary btn-sm col-start-2 justify-self-start md:col-start-auto">{w.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-soft">
        <div className="wrap grid gap-7 py-12 md:grid-cols-[1fr_2fr] md:gap-16 md:py-24">
          <SectionHeading>Why people come back</SectionHeading>
          <div className="grid gap-7 sm:grid-cols-2 md:gap-x-12 md:gap-y-10">
            {WHY.map((w) => (
              <div key={w.title} className="grid content-start gap-2 border-t-2 border-navy pt-4">
                <h3 className="display text-xl font-semibold">{w.title}</h3>
                <p className="text-muted">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap grid gap-6 py-12 md:gap-8 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading>Inside the store</SectionHeading>
            <Link to="/about">Visit us</Link>
          </div>
          {/* TODO: replace placeholders with real photos in /public/photos */}
          <div className="grid gap-3 md:grid-cols-[2fr_1fr] md:gap-4">
            <div className="ph h-60 md:h-[420px]">[Store photo: shop front]</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4">
              <div className="ph h-[150px] md:h-[202px]">[Testing room]</div>
              <div className="ph h-[150px] md:h-[202px]">[Frame wall]</div>
            </div>
          </div>
          <div className="grid gap-4 pt-4">
            <p className="label">Brands we stock</p>
            <div className="grid grid-cols-3 overflow-hidden rounded-md border border-line bg-card md:grid-cols-7">
              {(brands || Array.from({ length: 7 }, (_, i) => ({ id: i, name: '' }))).map((b) => (
                <Link key={b.id} to="/shop" className="grid h-16 place-items-center border-b border-r border-line px-2 text-center text-sm font-semibold text-ink no-underline md:h-[88px] md:border-b-0">
                  {b.logo ? <img src={b.logo} alt={b.name} className="max-h-10 max-w-full object-contain" /> : b.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GoogleReviews />

      <section className="bg-navy text-[#fcfdff]">
        <div className="wrap flex flex-wrap items-center justify-between gap-6 py-12 md:gap-8 md:py-[72px]">
          <div className="grid gap-3">
            <h2 className="display text-[38px] leading-[38px] md:text-5xl">Due for an eye test?</h2>
            <p className="text-[17px] text-[#d9e2f3] md:text-[19px]">Book a time online or call <a href={STORE.phoneHref} className="num text-[#fcfdff]">{STORE.phoneDisplay}</a>.</p>
          </div>
          <Link to="/book" className="btn btn-light w-full sm:w-auto">Book an eye test</Link>
        </div>
      </section>
    </>
  )
}
