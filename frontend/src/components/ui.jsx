import { useEffect, useId, useState } from 'react'
import clsx from 'clsx'
import Icon, { Spinner } from './Icon'

export function Field({ label, optional, help, error, children, className, id: idProp }) {
  const auto = useId()
  const id = idProp || auto
  const describedBy = [help && `${id}-help`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  const child = typeof children === 'function' ? children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined }) : children
  return (
    <div className={clsx('field', className)}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label} {optional && <span className="optional">({optional === true ? 'optional' : optional})</span>}
        </label>
      )}
      {child}
      {help && !error && <span id={`${id}-help`} className="help">{help}</span>}
      {error && <span id={`${id}-err`} className="field-error">{error}</span>}
    </div>
  )
}

export function Select({ children, className, ...props }) {
  return (
    <div className="relative">
      <select className={clsx('input', className)} {...props}>{children}</select>
      <Icon name="down" className="pointer-events-none absolute right-3 top-3 text-muted" />
    </div>
  )
}

const BADGE = { pending: 'badge-pending', ok: 'badge-ok', info: 'badge-info', bad: 'badge-bad', neutral: 'badge-neutral' }
export function Badge({ tone = 'neutral', children, className }) {
  return <span className={clsx('badge', BADGE[tone], className)}>{children}</span>
}

const ALERT = { info: ['alert-info', 'info'], ok: ['alert-ok', 'ok'], warn: ['alert-warn', 'warn'], bad: ['alert-bad', 'error'] }
export function Alert({ tone = 'info', title, children, className, role }) {
  const [cls, icon] = ALERT[tone]
  return (
    <div className={clsx('alert', cls, className)} role={role || (tone === 'bad' ? 'alert' : undefined)}>
      <Icon name={icon} className="mt-0.5" />
      <div className="grid gap-1">
        {title && <strong>{title}</strong>}
        {children && <div className="text-sm leading-5 text-ink">{children}</div>}
      </div>
    </div>
  )
}

export function Loading({ children = 'Loading', className }) {
  return (
    <div role="status" className={clsx('flex items-center justify-center gap-2.5 py-16 text-muted', className)}>
      <Spinner />
      <span>{children}</span>
    </div>
  )
}

export function ErrorState({ title = "We couldn't load this", children = 'Check your internet connection and try again.', onRetry, action }) {
  return (
    <div className="card grid justify-items-start gap-3 p-6">
      <Icon name="warn" size={28} className="text-danger" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted">{children}</p>
      <div className="flex flex-wrap gap-2.5">
        {onRetry && <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
        {action}
      </div>
    </div>
  )
}

export function EmptyState({ icon = 'bag', title, children, action }) {
  return (
    <div className="dashed-box grid justify-items-center gap-3 px-6 py-14 text-center">
      <Icon name={icon} size={36} className="text-sky" />
      <h3 className="text-xl font-semibold">{title}</h3>
      {children && <p className="max-w-[32em] text-muted">{children}</p>}
      {action && <div className="flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}

export function FrameOutline({ className = 'w-1/2' }) {
  return (
    <svg viewBox="0 0 120 50" className={className} fill="none" stroke="#9aa5b8" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="30" cy="28" r="18" />
      <circle cx="90" cy="28" r="18" />
      <path d="M48 26c4-4 20-4 24 0M12 26 4 14M108 26l8-12" />
    </svg>
  )
}

export function ProductImage({ src, alt = '', caption, className, ratio = 'aspect-[4/3]' }) {
  if (src) return <img src={src} alt={alt} className={clsx('w-full rounded-md border border-line object-cover', ratio, className)} />
  return (
    <div className={clsx('ph content-center gap-2 border border-line', ratio, className)}>
      <FrameOutline className="mx-auto w-1/2 max-w-[160px]" />
      {caption && <span>{caption}</span>}
    </div>
  )
}

export function Swatch({ hex, className }) {
  return <span className={clsx('swatch', className)} style={{ background: hex }} />
}

const MAX_MB = 10
export function PhotoUpload({ label = 'Add a photo', hint = 'JPG or PNG, up to 10 MB', files, onChange, max = 1, accept = 'image/*' }) {
  const id = useId()
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null))
    setPreviews(urls)
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u))
  }, [files])

  const pick = (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`This file is ${Math.round(f.size / 1024 / 1024)} MB. Files must be under ${MAX_MB} MB. Try a screenshot of it instead.`)
      return
    }
    setError('')
    onChange([...files, f].slice(-max))
  }

  return (
    <div className="grid gap-3">
      {files.map((f, i) => (
        <div key={f.name + i} className="card grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 p-2.5">
          {previews[i] ? <img src={previews[i]} alt="" className="h-[66px] w-[88px] rounded-sm object-cover" /> : <div className="ph h-[66px]">File</div>}
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate">{f.name}</strong>
            <span className="help">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
            <button type="button" className="justify-self-start text-sm font-medium text-danger underline" onClick={() => onChange(files.filter((_, j) => j !== i))}>Remove</button>
          </div>
        </div>
      ))}
      {files.length < max && (
        <label htmlFor={id} className={clsx('grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border-[1.5px] border-dashed p-4', error ? 'border-danger bg-danger-soft' : 'border-line-strong bg-card')}>
          <Icon name="upload" size={26} className="text-sky" />
          <span className="grid">
            <strong>{error ? 'That file is too large' : label}</strong>
            <span className="help" style={error ? { color: 'var(--ink)' } : undefined}>{error || hint}</span>
          </span>
          <span className="btn btn-secondary btn-sm">Choose file</span>
          <input id={id} type="file" accept={accept} className="sr-only" onChange={pick} />
        </label>
      )}
    </div>
  )
}

export function EyeChart({ rows, caption, compact = false }) {
  return (
    <div className="eye-chart" role="img" aria-label={`An eye test chart reading ${rows.map((r) => r.text.replace(/\s/g, '')).join(' ')}`} style={compact ? { padding: '24px 20px 12px', gap: 10 } : undefined}>
      {rows.map((r, i) => (
        <div key={i} className={clsx('eye-row', i === rows.length - 1 && 'last')}>
          <small>{r.acuity}</small>
          <b style={{ fontSize: r.size, lineHeight: `${Math.round(r.size * 1.05)}px` }}>{r.text}</b>
          <small>{i + 1}</small>
        </div>
      ))}
      {caption && <p className="text-xs font-normal leading-4 text-muted" style={{ fontFamily: 'Barlow, sans-serif' }}>{caption}</p>}
    </div>
  )
}

export function SectionHeading({ children, className }) {
  return <h2 className={clsx('display text-[28px] leading-[30px] md:text-[32px] md:leading-[34px]', className)}>{children}</h2>
}
