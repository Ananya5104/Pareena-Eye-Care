import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner } from '../components/Icon'
import { Alert, Field, PhotoUpload, Select } from '../components/ui'
import { errorMessage, savePrescription } from '../lib/api'
import { STORE } from '../data/store'
import { useApp } from '../state/AppState'

const steps = (from, to) => {
  const out = []
  for (let v = from; v <= to + 1e-9; v += 0.25) out.push(v)
  return out
}
const fmt = (v) => (v === 0 ? '0.00' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2))
const SPH = steps(-20, 12).map(fmt)
const CYL = steps(-6, 6).map(fmt)
const ADD = ['', ...steps(0.75, 3.5).map(fmt)]

const blankEye = { sph: '', cyl: '0.00', axis: '', add: '' }
const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function EyeRow({ title, sub, eye, onChange, errors, idp }) {
  const set = (k) => (e) => onChange({ ...eye, [k]: e.target.value })
  const needsAxis = eye.cyl && eye.cyl !== '0.00'
  return (
    <fieldset className="card grid gap-3 p-3.5 md:grid-cols-[120px_repeat(4,minmax(0,1fr))] md:items-start md:gap-3 md:border-0 md:bg-transparent md:p-0">
      <legend className="sr-only">{title}</legend>
      <p className="font-semibold md:pt-8" aria-hidden="true">{title} <span className="block text-sm font-normal text-muted md:inline-block">{sub}</span></p>
      <div className="grid grid-cols-2 gap-2.5 md:contents">
        <Field label="SPH" error={errors.sph} id={`${idp}-sph`}>
          {(a) => <Select {...a} className="num" value={eye.sph} onChange={set('sph')}><option value="">Choose</option>{SPH.map((v) => <option key={v}>{v}</option>)}</Select>}
        </Field>
        <Field label="CYL" id={`${idp}-cyl`}>
          {(a) => <Select {...a} className="num" value={eye.cyl} onChange={set('cyl')}>{CYL.map((v) => <option key={v}>{v}</option>)}</Select>}
        </Field>
        <Field label="Axis" error={errors.axis} id={`${idp}-axis`}>
          {(a) => <input {...a} className="input num" type="number" inputMode="numeric" min="0" max="180" placeholder={needsAxis ? '0 to 180' : 'Not needed'} disabled={!needsAxis} value={needsAxis ? eye.axis : ''} onChange={set('axis')} />}
        </Field>
        <Field label="ADD" optional="opt." id={`${idp}-add`}>
          {(a) => <Select {...a} className="num" value={eye.add} onChange={set('add')}>{ADD.map((v) => <option key={v || 'none'} value={v}>{v || 'None'}</option>)}</Select>}
        </Field>
      </div>
    </fieldset>
  )
}

function validateEye(e) {
  const err = {}
  if (!e.sph) err.sph = 'Choose the SPH value. Copy the sign exactly.'
  if (e.cyl && e.cyl !== '0.00') {
    const a = Number(e.axis)
    if (e.axis === '' || Number.isNaN(a) || a < 0 || a > 180) err.axis = `CYL is ${e.cyl}, so we need the axis too. It's a number from 0 to 180.`
  }
  return err
}

function Helper() {
  return (
    <aside aria-labelledby="how-read" className="grid content-start gap-5 md:sticky md:top-6">
      <h2 id="how-read" className="display text-2xl">How to read your prescription</h2>
      <div className="rounded-sm border border-ink bg-card p-4 font-mono text-sm">
        <table className="num w-full border-collapse text-center">
          <thead><tr className="border-b border-ink"><td /><th className="py-1.5">SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th></tr></thead>
          <tbody>
            <tr><td className="py-1.5 text-left">R</td><td>−1.75</td><td>−0.50</td><td>90</td><td>+1.50</td></tr>
            <tr><td className="py-1.5 text-left">L</td><td>−2.00</td><td>DS</td><td /><td>+1.50</td></tr>
          </tbody>
        </table>
        <p className="mt-2.5">PD 63 mm</p>
      </div>
      <p className="help">Prescriptions look different from clinic to clinic. The letters are what matter.</p>
      <dl className="grid gap-3.5">
        <div><dt className="font-semibold">SPH (sphere)</dt><dd className="mt-0.5 text-muted">Your main power. Minus means you struggle with far things, plus means near things.</dd></div>
        <div><dt className="font-semibold">CYL and AXIS</dt><dd className="mt-0.5 text-muted">Correct astigmatism (blurry at every distance). Axis is a number from 0 to 180. "DS" or blank means none.</dd></div>
        <div><dt className="font-semibold">ADD</dt><dd className="mt-0.5 text-muted">Extra power for reading, usually after 40. You need it for progressive and bifocal lenses.</dd></div>
        <div><dt className="font-semibold">PD</dt><dd className="mt-0.5 text-muted">Distance between your pupils. If it's missing, we can measure it at the store.</dd></div>
      </dl>
      <p className="text-sm">Stuck? <a href={STORE.whatsappHref} target="_blank" rel="noreferrer">Send us a photo on WhatsApp</a> and we'll fill it in for you.</p>
    </aside>
  )
}

export default function Prescription() {
  const { addPrescription, setNoPower, noPower, user } = useApp()
  const [params] = useSearchParams()
  const next = params.get('next')
  const navigate = useNavigate()
  const [off, setOff] = useState(noPower)
  const [name, setName] = useState(user ? user.name : '')
  const [right, setRight] = useState(blankEye)
  const [left, setLeft] = useState(blankEye)
  const [pd, setPd] = useState('')
  const [date, setDate] = useState(today)
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (off) {
      setNoPower(true)
      navigate(next || '/shop')
      return
    }
    const er = { name: name.trim() ? null : 'Whose prescription is this? A first name is enough.', right: validateEye(right), left: validateEye(left) }
    const count = (er.name ? 1 : 0) + Object.keys(er.right).length + Object.keys(er.left).length
    if (count) { setErrors({ ...er, count }); window.scrollTo({ top: 0 }); return }
    setErrors(null)
    setSaving(true); setSaveError('')
    try {
      const rx = await savePrescription({ name: name.trim(), right, left, pd, date }, files[0])
      addPrescription(rx)
      if (next) navigate(next)
      else setSaved(true)
    } catch (err) {
      setSaveError(errorMessage(err))
      window.scrollTo({ top: 0 })
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="wrap grid max-w-[640px] gap-5 pb-24 pt-10">
        <Alert tone="ok" title="Prescription saved" role="status">We'll check it again before your lenses are made.</Alert>
        <h1 className="display text-4xl md:text-5xl">Now choose your frames</h1>
        <p className="text-muted">Frames will show which lenses suit this prescription.</p>
        <div className="flex flex-wrap gap-3"><Link to="/shop" className="btn btn-primary">Shop glasses</Link><Link to="/account" className="btn btn-ghost">See saved prescriptions</Link></div>
      </div>
    )
  }

  return (
    <div className="wrap grid gap-8 pb-24 pt-8 md:pt-12">
      <div className="grid max-w-[44em] gap-2.5">
        <h1 className="display text-[40px] leading-[40px] md:text-[56px] md:leading-[54px]">Your prescription</h1>
        <p className="lede">Add it once and we'll only show lenses that suit it, with the right prices. We check every prescription before lenses are made.</p>
      </div>

      <div className="grid items-start gap-10 md:grid-cols-[1.5fr_1fr]">
        <form className="grid gap-7 md:card md:p-8" onSubmit={submit} noValidate>
          {errors && <Alert tone="bad" title={`${errors.count} ${errors.count === 1 ? 'value needs' : 'values need'} checking`}>Nothing is saved until they're fixed.</Alert>}
          {saveError && <Alert tone="bad" title="Your prescription wasn't saved">{saveError}</Alert>}

          <label className={`flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-md px-4 py-2.5 ${off ? 'border-2 border-navy bg-card' : 'border border-line bg-surface'}`}>
            <span className="grid"><strong>I don't need power</strong><span className="help">For plain or fashion lenses, or sunglasses without power</span></span>
            <input type="checkbox" role="switch" className="sr-only" checked={off} onChange={(e) => setOff(e.target.checked)} />
            <span aria-hidden="true" className={`relative h-7 w-12 flex-none rounded-full ${off ? 'bg-navy' : 'bg-line-strong'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-card ${off ? 'left-6' : 'left-1'}`} />
            </span>
          </label>

          {off ? (
            <Alert tone="info" title="Plain lenses it is">You'll see zero-power lenses only. Blue Light and Anti-Glare still work without power.</Alert>
          ) : (
            <>
              <Field label="Whose prescription is this?" error={errors && errors.name} className="max-w-[360px]">
                {(a) => <input {...a} className="input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
              </Field>
              <div className="grid gap-3">
                <p className="field-label">Power</p>
                <EyeRow title="Right eye" sub="R or OD" idp="r" eye={right} onChange={setRight} errors={(errors && errors.right) || {}} />
                <EyeRow title="Left eye" sub="L or OS" idp="l" eye={left} onChange={setLeft} errors={(errors && errors.left) || {}} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="help">Copy the signs exactly: a minus (−) and a plus (+) are very different lenses.</p>
                  <button type="button" className="btn-text p-0 text-sm" onClick={() => setLeft(right)}>Left same as right</button>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="PD" optional help="Distance between your pupils, in mm.">
                  {(a) => <input {...a} className="input num" type="number" inputMode="numeric" placeholder="For example 63" value={pd} onChange={(e) => setPd(e.target.value)} />}
                </Field>
                <Field label="Date on the prescription" help="Older than 2 years? We'll suggest a new test.">
                  {(a) => <input {...a} className="input num" type="text" value={date} onChange={(e) => setDate(e.target.value)} />}
                </Field>
              </div>
            </>
          )}

          <div className="grid gap-2.5 border-t border-line pt-6">
            <p className="field-label">Photo of your paper prescription <span className="optional">(optional)</span></p>
            <PhotoUpload files={files} onChange={setFiles} label="Add a photo and we'll double-check your numbers" hint="JPG, PNG or PDF, up to 10 MB" accept="image/*,application/pdf" />
          </div>

          <button type="submit" className="btn btn-primary justify-self-start max-md:w-full" disabled={saving} aria-busy={saving}>{saving ? <><Spinner />Saving</> : off ? 'Continue to frames' : next ? 'Save and continue' : 'Save and choose frames'}</button>
        </form>
        <Helper />
      </div>
    </div>
  )
}
