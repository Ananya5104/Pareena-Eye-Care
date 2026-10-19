import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, hasTokens, setTokens } from '../lib/api'

// Cart, prescriptions, signed-in user, and references to the customer's own orders,
// bookings and consultations, kept in the browser. The backend holds the real records;
// these references let guests find them again.

const AppState = createContext(null)
const KEY = 'pareena-state-v2'

const empty = { cart: [], prescriptions: [], activeRxId: null, noPower: false, user: null, orderRefs: [], appointments: [], consultationRefs: [] }

function load() {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

let nextId = Date.now()
const uid = (prefix) => `${prefix}-${(nextId++).toString(36).slice(-5).toUpperCase()}`

export function AppStateProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
  }, [state])

  // Refresh the signed-in user on load; drop it if the session has expired.
  useEffect(() => {
    const out = () => setState((s) => ({ ...s, user: null }))
    window.addEventListener('pareena:signed-out', out)
    if (hasTokens()) getMe().then((user) => setState((s) => ({ ...s, user }))).catch(() => {})
    else if (state.user) out()
    return () => window.removeEventListener('pareena:signed-out', out)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const api = useMemo(() => {
    const set = (fn) => setState((s) => ({ ...s, ...fn(s) }))
    return {
      // cart: each line keeps a snapshot of the product and lens; the server re-prices at checkout
      addToCart: ({ product, colour, lens, rxId }) =>
        set((s) => ({
          cart: [...s.cart, {
            id: uid('item'),
            product: { id: product.id, name: product.name, brand: product.brand, price: product.price, type: product.type, image: product.image },
            variantId: colour.id,
            colour: colour.name,
            lens: lens ? { dbId: lens.dbId, id: lens.id, name: lens.name, price: lens.price } : null,
            rxId: lens ? rxId : null,
          }],
        })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((i) => i.id !== id) })),
      clearCart: () => set(() => ({ cart: [] })),

      // prescriptions (saved on the server; `id` is its reference)
      addPrescription: (rx) => set((s) => ({
        prescriptions: [rx, ...s.prescriptions.filter((p) => p.id !== rx.id)],
        activeRxId: rx.id,
        noPower: false,
      })),
      setNoPower: (v) => set((s) => ({ noPower: v, activeRxId: v ? null : s.activeRxId })),
      setActiveRx: (id) => set(() => ({ activeRxId: id, noPower: false })),

      // account
      signIn: (user) => set(() => ({ user })),
      signOut: () => { setTokens(null); set(() => ({ user: null })) },

      // records
      addOrderRef: (ref) => set((s) => ({ orderRefs: [ref, ...s.orderRefs.filter((r) => r !== ref)] })),
      addAppointment: (a) => set((s) => ({ appointments: [a, ...s.appointments] })),
      addConsultationRef: (ref) => set((s) => ({ consultationRefs: [ref, ...s.consultationRefs] })),
    }
  }, [])

  const derived = useMemo(() => {
    const cartLines = state.cart
      .filter((item) => item.product)
      .map((item) => {
        const rx = state.prescriptions.find((p) => p.id === item.rxId) || null
        const lensPrice = item.lens ? item.lens.price : 0
        return { ...item, rx, framePrice: item.product.price, lensPrice, total: item.product.price + lensPrice }
      })
    const activeRx = state.prescriptions.find((p) => p.id === state.activeRxId) || null
    return {
      cartLines,
      cartCount: cartLines.length,
      cartTotal: cartLines.reduce((s, l) => s + l.total, 0),
      framesTotal: cartLines.reduce((s, l) => s + l.framePrice, 0),
      lensesTotal: cartLines.reduce((s, l) => s + l.lensPrice, 0),
      activeRx,
    }
  }, [state])

  const value = useMemo(() => ({ ...state, ...derived, ...api }), [state, derived, api])
  return <AppState.Provider value={value}>{children}</AppState.Provider>
}

export function useApp() {
  const ctx = useContext(AppState)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}

export function hasAdd(rx) {
  if (!rx) return false
  return Boolean((rx.right && rx.right.add) || (rx.left && rx.left.add))
}

export { uid }
