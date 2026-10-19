// Every call to the Django backend goes through this file (see docs/API.md).
// Responses are reshaped here into the objects the pages use, so pages don't
// need to know the backend's field names.
import axios from 'axios'

const BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/v1`
const AUTH_KEY = 'pareena-auth-v1'

// ---------- auth tokens ----------

function readTokens() {
  try { return JSON.parse(window.localStorage.getItem(AUTH_KEY)) || null } catch { return null }
}
export function setTokens(tokens) {
  try {
    if (tokens) window.localStorage.setItem(AUTH_KEY, JSON.stringify(tokens))
    else window.localStorage.removeItem(AUTH_KEY)
  } catch { /* storage blocked */ }
}
export const hasTokens = () => Boolean(readTokens())

const http = axios.create({ baseURL: BASE, timeout: 30000 })

http.interceptors.request.use((config) => {
  const tokens = readTokens()
  if (tokens && tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`
  return config
})

let refreshing = null
http.interceptors.response.use(undefined, async (error) => {
  const { config, response } = error
  const tokens = readTokens()
  if (response && response.status === 401 && tokens && tokens.refresh && !config._retried) {
    config._retried = true
    refreshing = refreshing || axios.post(`${BASE}/auth/token/refresh/`, { refresh: tokens.refresh })
      .then((r) => { setTokens({ ...tokens, ...r.data }); return true })
      .catch(() => { setTokens(null); window.dispatchEvent(new Event('pareena:signed-out')); return false })
      .finally(() => { refreshing = null })
    if (await refreshing) return http(config)
  }
  return Promise.reject(error)
})

// Turn a DRF error into one readable sentence.
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error && error.response && error.response.data
  if (!error || !error.response) return 'The connection dropped. Check your internet and try again.'
  if (error.response.status === 429 && !(data && data.detail && data.resend_in)) {
    return 'Too many attempts. Please wait a little and try again.'
  }
  const first = (v) => {
    if (!v) return null
    if (typeof v === 'string') return v
    if (Array.isArray(v)) return first(v[0])
    if (typeof v === 'object') return first(v.detail) || first(Object.values(v)[0])
    return null
  }
  return first(data) || fallback
}

// ---------- labels for backend codes ----------

export const SHAPE_LABEL = { round: 'Round', rectangle: 'Rectangle', square: 'Square', oval: 'Oval', cat_eye: 'Cat-eye', aviator: 'Aviator', wayfarer: 'Wayfarer', clubmaster: 'Clubmaster', geometric: 'Geometric' }
export const GENDER_LABEL = { men: 'Men', women: 'Women', unisex: 'Unisex', kids: 'Kids' }
export const FIT_LABEL = { small: 'Small', medium: 'Medium', large: 'Large', kids: 'Kids' }
export const ISSUES = [
  ['red_eyes', 'Red eyes'], ['dry_eyes', 'Dry eyes'], ['itching', 'Itching'],
  ['irritation', 'Irritation'], ['lens_discomfort', 'Lens discomfort'], ['other', 'Something else'],
]
export const ISSUE_LABEL = Object.fromEntries(ISSUES)

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

// ---------- catalogue ----------

function toProduct(p) {
  const variants = (p.variants || []).map((v) => ({ id: v.id, name: v.color_name, hex: v.color_hex, stock: v.stock }))
  return {
    id: p.slug,
    slug: p.slug,
    brand: p.brand,
    name: p.name,
    type: p.category === 'sunglasses' ? 'sun' : 'glasses',
    shape: SHAPE_LABEL[p.shape] || p.shape,
    gender: GENDER_LABEL[p.gender] || p.gender,
    fit: FIT_LABEL[p.fit] || p.fit,
    size: p.size_label,
    price: Number(p.price),
    mrp: num(p.mrp),
    image: p.image,
    colours: variants,
    inStock: p.in_stock,
    featured: p.is_featured,
    // detail-only fields
    material: p.material,
    rim: p.frame_type_display,
    weight: p.weight_g ? `${p.weight_g} g` : null,
    hinges: p.hinges_display,
    description: p.description,
    progressive: p.progressive_compatible,
    minSph: num(p.min_sph),
    maxSph: num(p.max_sph),
    powerRange: p.power_range,
    images: (p.images || []).map((i) => ({ src: i.image, view: i.view, alt: i.alt_text, variantId: i.variant })),
    lensTypeIds: p.lens_types || [],
  }
}

export async function getProducts(type) {
  const category = type === 'sun' ? 'sunglasses' : 'eyeglasses'
  let url = '/products/'
  let params = { category, page_size: 200 }
  const out = []
  while (url) {
    const { data } = await http.get(url, { params })
    out.push(...data.results.map(toProduct))
    url = data.next
    params = undefined
  }
  return out
}

export async function getFeaturedProducts() {
  const { data } = await http.get('/products/', { params: { featured: true, page_size: 8 } })
  return data.results.map(toProduct)
}

export async function getProduct(slug) {
  const { data } = await http.get(`/products/${encodeURIComponent(slug)}/`)
  return toProduct(data)
}

export async function getBrands() {
  const { data } = await http.get('/brands/')
  return data
}

function toLens(l) {
  return {
    id: l.slug,
    dbId: l.id,
    name: l.name,
    price: Number(l.price),
    short: l.short_description,
    description: l.description,
    goodFor: l.good_for,
    readyIn: l.ready_in,
    worksWithoutPower: l.works_without_power,
    needsAdd: l.requires_addition,
  }
}

let lensCache = null
export function getLenses() {
  lensCache = lensCache || http.get('/lens-types/', { params: { guide: true } })
    .then((r) => r.data.map(toLens))
    .catch((e) => { lensCache = null; throw e })
  return lensCache
}

let clinicCache = null
export function getClinic() {
  clinicCache = clinicCache || http.get('/clinic/').then((r) => r.data.clinic).catch((e) => { clinicCache = null; throw e })
  return clinicCache
}

// GET /reviews/ -> null when Google isn't connected; the section then shows links to Google.
export async function getGoogleReviews() {
  const { data } = await http.get('/reviews/')
  return data && Array.isArray(data.reviews) ? data : null
}

// ---------- appointments ----------

export const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

export async function getCalendar() {
  const { data } = await http.get('/appointments/calendar/')
  return data
}

export async function getSlots(date) {
  const { data } = await http.get('/appointments/slots/', { params: { date: isoDate(date) } })
  return data.slots.map((s) => ({ value: s.time, time: timeLabel(s.time), taken: !s.available }))
}

export async function createAppointment(form, date, time) {
  const { data } = await http.post('/appointments/', {
    name: form.name, phone: form.phone, email: form.email || '',
    for_whom: form.who, reason: form.reason, notes: form.notes || '',
    date: isoDate(date), time,
  })
  return toAppointment(data)
}

function toAppointment(a) {
  return { id: `#${a.id}`, date: a.date, time: timeLabel(a.time), name: a.name, phone: a.phone, reason: a.reason, status: a.status }
}

export async function getMyAppointments() {
  const { data } = await http.get('/appointments/')
  return (data.results || data).map(toAppointment)
}

// ---------- video consultations ----------

export async function createConsultation(form, issues, files) {
  const body = new FormData()
  Object.entries({
    name: form.name, phone: form.phone, email: form.email || '', since: form.since, eye: form.eye,
    preferred_time: form.when, issue_description: form.desc,
  }).forEach(([k, v]) => body.append(k, v))
  issues.forEach((i) => body.append('issues', i))
  files.forEach((f) => body.append('photos', f))
  const { data } = await http.post('/consultations/', body)
  return data
}

function toConsultation(c) {
  const at = c.scheduled_for ? new Date(c.scheduled_for) : null
  const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const today = new Date().toDateString() === (at && at.toDateString())
  return {
    id: c.reference,
    shortId: c.reference.slice(0, 8).toUpperCase(),
    status: c.status,
    issues: (c.issues || []).map((i) => ISSUE_LABEL[i] || i),
    createdAt: c.created_at,
    callLabel: at ? `${today ? 'today' : at.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${fmtTime(at)}` : null,
    opensLabel: at ? fmtTime(new Date(at.getTime() - 5 * 60000)) : null,
    meetUrl: c.meet_link,
    notes: c.patient_notes,
    reason: c.rejection_reason,
    when: c.preferred_time_display,
    photoCount: c.photo_count,
  }
}

export async function lookupConsultations(refs) {
  if (!refs.length) return []
  const { data } = await http.get('/consultations/lookup/', { params: { refs: refs.join(',') } })
  return data.map(toConsultation)
}

export async function getMyConsultations() {
  const { data } = await http.get('/consultations/')
  return (data.results || data).map(toConsultation)
}

// ---------- prescriptions ----------

const sign = (v) => (v === null || v === undefined ? '' : Number(v) === 0 ? '0.00' : (Number(v) > 0 ? '+' : '−') + Math.abs(Number(v)).toFixed(2))
const unsign = (s) => (s === '' || s === null || s === undefined ? null : String(s).replace('−', '-').replace('+', ''))

export function toPrescription(p) {
  const eye = (k) => ({ sph: sign(p[`${k}_sph`]), cyl: sign(p[`${k}_cyl`]) || '0.00', axis: p[`${k}_axis`] ?? '', add: p[`${k}_add`] ? sign(p[`${k}_add`]) : '' })
  return { id: p.reference, name: p.patient_name, date: p.prescription_date, right: eye('right'), left: eye('left'), pd: p.pupillary_distance || '', summary: p.summary }
}

export async function savePrescription(rx, file) {
  const fields = {
    patient_name: rx.name,
    prescription_date: rx.date || '',
    right_sph: unsign(rx.right.sph), right_cyl: unsign(rx.right.cyl) || '0', right_axis: rx.right.axis === '' ? null : rx.right.axis, right_add: unsign(rx.right.add),
    left_sph: unsign(rx.left.sph), left_cyl: unsign(rx.left.cyl) || '0', left_axis: rx.left.axis === '' ? null : rx.left.axis, left_add: unsign(rx.left.add),
    pupillary_distance: rx.pd === '' ? null : rx.pd,
  }
  let data
  if (file) {
    const body = new FormData()
    Object.entries(fields).forEach(([k, v]) => v !== null && body.append(k, v))
    body.append('upload', file)
    ;({ data } = await http.post('/prescriptions/', body))
  } else {
    ;({ data } = await http.post('/prescriptions/', fields))
  }
  return toPrescription(data)
}

export async function getMyPrescriptions() {
  const { data } = await http.get('/prescriptions/')
  return (data.results || data).map(toPrescription)
}

// ---------- orders & payment ----------

export function toOrder(o) {
  const state = o.payment_method === 'store' ? 'store' : o.payment_status === 'paid' ? 'paid' : 'failed'
  return {
    id: o.reference,
    number: o.order_number,
    name: o.customer_name,
    email: o.email,
    phone: o.phone,
    total: Number(o.total),
    status: state,
    progress: o.status,
    progressLabel: o.status_display,
    createdAt: o.created_at,
    items: o.items.map((i) => ({
      name: i.product_name, slug: i.product_slug, brand: i.brand, image: i.image, colour: i.color_name,
      lens: i.lens_name || null, rx: i.prescription_name, isSun: i.category === 'sunglasses',
      quantity: i.quantity, total: Number(i.line_total),
    })),
  }
}

export async function createOrder(form, lines, payment) {
  const { data } = await http.post('/orders/', {
    customer_name: form.name, phone: form.phone, email: form.email || '', payment_method: payment,
    items: lines.map((l) => ({
      variant_id: l.variantId, lens_type_id: l.lens ? l.lens.dbId : null, prescription_reference: l.lens ? l.rxId : null, quantity: 1,
    })),
  })
  return { order: toOrder(data.order), payment: data.payment }
}

export async function getOrder(reference) {
  const { data } = await http.get(`/orders/${reference}/`)
  return toOrder(data)
}

export async function getMyOrders() {
  const { data } = await http.get('/orders/')
  return (data.results || data).map(toOrder)
}

export async function startPayment(reference) {
  const { data } = await http.post(`/orders/${reference}/pay/`)
  return { order: toOrder(data.order), payment: data.payment }
}

export async function payAtStore(reference) {
  const { data } = await http.post(`/orders/${reference}/pay-at-store/`)
  return toOrder(data.order)
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// Opens Razorpay Checkout and confirms the payment with the backend.
// Resolves to the updated order (status 'paid' or 'failed').
export async function payOnline(order, payment) {
  const failed = async () => toOrder((await http.post(`/orders/${order.id}/payment-failed/`)).data.order)
  if (!payment || !(await loadRazorpay())) return failed()
  const result = await new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: payment.key_id,
      order_id: payment.razorpay_order_id,
      amount: payment.amount,
      currency: payment.currency,
      name: 'Pareena Eye Care Center',
      description: `Order ${order.number}`,
      prefill: { name: order.name, contact: order.phone, email: order.email || undefined },
      theme: { color: '#233b7e' },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    })
    rzp.on('payment.failed', () => { /* Razorpay lets the customer retry inside the window */ })
    rzp.open()
  })
  if (!result) return failed()
  try {
    const { data } = await http.post(`/orders/${order.id}/verify-payment/`, result)
    return toOrder(data.order)
  } catch {
    return failed()
  }
}

// ---------- account (email code) ----------

export async function requestCode(email) {
  const { data } = await http.post('/auth/code/', { email })
  return data
}

export async function verifyCode(email, code) {
  const { data } = await http.post('/auth/verify/', { email, code })
  setTokens({ access: data.access, refresh: data.refresh })
  return { user: data.user, isNew: data.is_new }
}

export async function getMe() {
  const { data } = await http.get('/auth/me/')
  return data
}

export async function updateMe(patch) {
  const { data } = await http.patch('/auth/me/', patch)
  return data
}
