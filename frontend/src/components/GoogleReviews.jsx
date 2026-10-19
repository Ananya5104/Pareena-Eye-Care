import { useEffect, useState } from 'react'
import { getGoogleReviews } from '../lib/api'
import { STORE } from '../data/store'
import { Loading, SectionHeading } from './ui'

// Reviews are pulled from Google by the backend (see getGoogleReviews in src/lib/api.js).
// Until that is connected, or if Google can't be reached, the section shows links only.

function Stars({ rating = 5, size = 14 }) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={i <= Math.round(rating) ? 'var(--navy)' : 'var(--line)'}>
          <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
        </svg>
      ))}
    </span>
  )
}

export default function GoogleReviews({ limit = 3 }) {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    let live = true
    getGoogleReviews().then((d) => live && setData(d)).catch(() => live && setData(null))
    return () => { live = false }
  }, [])

  const links = (
    <div className="flex flex-wrap gap-2.5">
      <a className="btn btn-secondary btn-sm" href={STORE.googleReviewsHref} target="_blank" rel="noreferrer">See all on Google</a>
      <a className="btn btn-ghost btn-sm" href={STORE.googleReviewsHref} target="_blank" rel="noreferrer">Write a review</a>
    </div>
  )

  return (
    <section className="border-t border-line">
      <div className="wrap grid gap-8 py-12 md:grid-cols-[1fr_2fr] md:gap-16 md:py-24">
        <div className="grid content-start gap-5">
          <SectionHeading>What customers say</SectionHeading>
          {data && (
            <div className="grid gap-1.5">
              <p className="flex items-baseline gap-3"><span className="display num text-5xl md:text-[64px] md:leading-[60px]">{data.rating.toFixed(1)}</span><Stars rating={data.rating} size={20} /></p>
              <p className="text-muted">Based on {data.total} Google reviews</p>
            </div>
          )}
          {data === null && <p className="text-muted">Read what customers say about us on Google.</p>}
          {links}
          {data && <p className="help">The latest reviews, pulled from Google and shown as posted.</p>}
        </div>
        {data !== null && <div className="min-h-[120px] border-t border-ink">
          {data === undefined && <Loading>Loading reviews from Google</Loading>}
          {data && data.reviews.slice(0, limit).map((r, i) => (
            <article key={i} className="grid gap-3 border-b border-line py-6 md:py-7">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-soft font-semibold text-navy">{r.author.charAt(0)}</span>
                <div className="grid gap-0.5">
                  <span className="font-semibold">{r.author}</span>
                  <span className="flex items-center gap-2"><Stars rating={r.rating} /><span className="help">{r.when}</span></span>
                </div>
              </div>
              <p className="line-clamp-4 text-[17px] leading-[26px] md:text-[19px] md:leading-[30px]">{r.text}</p>
              <a href={r.url || STORE.googleReviewsHref} target="_blank" rel="noreferrer" className="text-sm">Read on Google</a>
            </article>
          ))}
        </div>}
      </div>
    </section>
  )
}
