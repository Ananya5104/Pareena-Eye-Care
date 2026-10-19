import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../components/Icon'
import GoogleReviews from '../components/GoogleReviews'
import { SectionHeading } from '../components/ui'
import { STORE } from '../data/store'

const WAYS = [
  ['Test properly, every time', "A full test takes about 20 minutes. We don't rush it, even on a busy Saturday."],
  ['Sell what you need', "If a basic lens is right for you, that's what we'll suggest."],
  ['Check the finished pair', 'Every pair is checked against your prescription and fitted on your face before you leave.'],
]

export default function About() {
  const { hash } = useLocation()
  const o = STORE.optometrist
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <>
      <section className="wrap grid items-center gap-6 pb-10 pt-9 md:grid-cols-2 md:gap-16 md:py-20">
        <div className="grid gap-5 md:gap-6">
          <h1 className="display text-[46px] leading-[44px] md:text-[72px] md:leading-[68px]">A small shop that takes eyes seriously</h1>
          <p className="lede text-[17px] leading-[27px] md:text-[19px] md:leading-[30px]">{STORE.name} has been testing eyes and fitting glasses in Ameerpet since {STORE.since}. It's run by {STORE.owner}, who still does most of the eye tests himself.</p>
        </div>
        {/* TODO: real photo in /public/photos */}
        <div className="ph h-[260px] md:h-[440px]">[Photo: the shop front, or the owner at the counter]</div>
      </section>

      <section className="border-t border-line">
        <div className="wrap grid gap-4 py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-20">
          <SectionHeading>Our story</SectionHeading>
          <div className="grid max-w-[40em] gap-4 text-[17px] leading-[27px] md:text-xl md:leading-8">
            <p>[How the shop started: who opened it, why, and what it was like in the early years.]</p>
            <p>[What has stayed the same since then, and what the family is proud of. Two or three sentences in your own words.]</p>
          </div>
        </div>
      </section>

      <section className="bg-soft">
        <div className="wrap grid gap-4 py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-20">
          <SectionHeading>How we work</SectionHeading>
          <div className="border-t border-ink">
            {WAYS.map(([t, d]) => (
              <div key={t} className="grid gap-1 border-b border-[#c3ccd9] py-4 md:grid-cols-[1fr_1.4fr] md:gap-8 md:py-6">
                <h3 className="display text-xl font-semibold">{t}</h3><p className="text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap grid gap-5 py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-20">
          <SectionHeading>Your optometrist</SectionHeading>
          <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:items-start md:gap-10">
            <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4 md:block">
              <div className="ph h-[136px] md:h-80">[Portrait]</div>
              <div className="grid gap-1 md:hidden"><h3 className="display text-[26px] leading-7">{o.name}</h3><p className="help">{o.qualification}</p></div>
            </div>
            <div className="grid gap-4">
              <div className="hidden gap-1 md:grid"><h3 className="display text-4xl">{o.name}</h3><p className="text-muted">{o.qualification} · {o.registration}</p></div>
              <p className="text-[17px] leading-7 md:text-lg">[A few lines about them: years of experience, what they enjoy about the work, anything patients often say.]</p>
              <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-2.5 border-t border-line pt-4 md:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="text-muted">Experience</dt><dd>{o.experience}</dd>
                <dt className="text-muted">Speaks</dt><dd>{o.languages}</dd>
                <dt className="text-muted">Special interest</dt><dd>{o.interest}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="visit" className="border-t border-line">
        <div className="wrap grid gap-6 py-10 md:gap-8 md:py-20">
          <SectionHeading>Visit the store</SectionHeading>
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:gap-10">
            <iframe title={`Map showing ${STORE.name}`} src={STORE.mapEmbedSrc} className="h-[240px] w-full rounded-md border border-line md:h-full md:min-h-[400px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className="grid content-start gap-6">
              <div className="grid gap-1.5"><p className="label">Address</p><p className="text-[17px] leading-7 md:text-[19px]">{STORE.addressLines[0]}<br />{STORE.addressLines[1]}</p><a href={STORE.directionsHref} target="_blank" rel="noreferrer">Get directions</a></div>
              <div className="grid gap-1.5"><p className="label">Call or WhatsApp</p><a href={STORE.phoneHref} className="display num text-[32px] leading-[34px] text-ink no-underline md:text-4xl">{STORE.phoneDisplay}</a>
                <div className="flex flex-wrap gap-2.5 pt-1"><a className="btn btn-ghost btn-sm" href={STORE.phoneHref}><Icon name="phone" size={18} />Call</a><a className="btn btn-ghost btn-sm" href={STORE.whatsappHref} target="_blank" rel="noreferrer"><Icon name="chat" size={18} />WhatsApp</a></div>
              </div>
              <div className="grid gap-1.5"><p className="label">Opening hours</p>
                <table className="num border-collapse"><tbody>{STORE.hours.map((h) => <tr key={h.days}><td className="py-1 pr-6">{h.days}</td><td>{h.time}</td></tr>)}</tbody></table>
              </div>
              <Link className="btn btn-primary justify-self-start max-md:w-full" to="/book">Book an eye test</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {['Counter', 'Testing room', 'Frame wall', 'Fitting desk'].map((p) => <div key={p} className="ph h-[130px] md:h-[200px]">[{p}]</div>)}
          </div>
        </div>
      </section>

      <GoogleReviews limit={2} />
    </>
  )
}
