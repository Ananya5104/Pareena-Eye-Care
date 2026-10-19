// Every call to the backend goes through this file.
// For now each function returns sample data after a short delay, so the whole
// site works without a server. When the backend is ready, replace the body of
// each function with a fetch() to its endpoint. The suggested endpoints are
// noted above each one.

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms))

// GET /api/slots?date=2026-10-22
export async function getSlots(date) {
  await wait(400)
  const all = ['10:00 am', '10:30 am', '11:00 am', '11:30 am', '12:00 pm', '12:30 pm', '2:00 pm', '2:30 pm', '3:00 pm', '3:30 pm', '4:00 pm', '4:30 pm', '5:00 pm', '5:30 pm', '6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm']
  const d = new Date(date)
  const day = d.getDay()
  const times = day === 0 ? all.filter((t) => !/^(7|6:30)/.test(t)) : all
  // Example: a few times taken, Saturdays fill up
  const seed = d.getDate()
  const taken = day === 6 ? times : times.filter((_, i) => (i * 7 + seed) % 5 === 0)
  return times.map((t) => ({ time: t, taken: taken.includes(t) }))
}

// POST /api/appointments
export async function createAppointment(data) {
  await wait()
  return { id: 'PEC-A' + Math.floor(1000 + Math.random() * 9000), ...data }
}

// POST /api/consultations   (multipart, with photos)
export async function createConsultation(data) {
  await wait(900)
  return { id: 'VC-' + Math.floor(1000 + Math.random() * 9000), status: 'pending', createdAt: new Date().toISOString(), ...data }
}

// POST /api/orders
export async function createOrder(data) {
  await wait(700)
  return { id: 'PEC-' + Math.floor(10000 + Math.random() * 90000), createdAt: new Date().toISOString(), ...data }
}

// POST /api/payments/start   -> hand over to Razorpay (or another UPI gateway)
export async function payOnline(order) {
  await wait(1500)
  // Example outcome. Replace with the payment gateway's result.
  // To see the "payment failed" page while testing, use a mobile number ending in 0000.
  return { ok: !String(order.phone || '').replace(/\D/g, '').endsWith('0000') }
}

// POST /api/auth/otp   and   POST /api/auth/verify
export async function sendOtp(phone) {
  await wait(500)
  return { sent: true, phone }
}
export async function verifyOtp(phone, code) {
  await wait(500)
  if (code !== '123456') return { ok: false }
  return { ok: true, user: { phone, name: '' } }
}

// GET /api/reviews  (backend fetches from the Google Places API and caches it)
export async function getGoogleReviews() {
  await wait(500)
  return null // null = not connected yet: the reviews section shows links to Google instead
}
