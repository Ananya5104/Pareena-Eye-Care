import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { findLens, findProduct } from '../data/catalog'

// Cart, prescriptions, signed-in user, and the customer's own orders, bookings and
// consultations. Saved in the browser for now; move to the backend later.

const AppState = createContext(null)
const KEY = 'pareena-state-v1'

const empty = { cart: [], prescriptions: [], activeRxId: null, noPower: false, user: null, orders: [], appointments: [], consultations: [] }

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

  const api = useMemo(() => {
    const set = (fn) => setState((s) => ({ ...s, ...fn(s) }))
    return {
      // cart
      addToCart: ({ productId, colour, lensId, rxId }) =>
        set((s) => ({ cart: [...s.cart, { id: uid('item'), productId, colour, lensId, rxId }] })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((i) => i.id !== id) })),
      clearCart: () => set(() => ({ cart: [] })),

      // prescriptions
      savePrescription: (rx) => {
        const id = rx.id || uid('rx')
        set((s) => ({
          prescriptions: [{ ...rx, id }, ...s.prescriptions.filter((p) => p.id !== id)],
          activeRxId: id,
          noPower: false,
        }))
        return id
      },
      setNoPower: (v) => set((s) => ({ noPower: v, activeRxId: v ? null : s.activeRxId })),
      setActiveRx: (id) => set(() => ({ activeRxId: id, noPower: false })),

      // account
      signIn: (user) => set(() => ({ user })),
      signOut: () => set(() => ({ user: null })),

      // records
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      updateOrder: (id, patch) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      addAppointment: (a) => set((s) => ({ appointments: [a, ...s.appointments] })),
      addConsultation: (c) => set((s) => ({ consultations: [c, ...s.consultations] })),
    }
  }, [])

  const derived = useMemo(() => {
    const cartLines = state.cart
      .map((item) => {
        const product = findProduct(item.productId)
        if (!product) return null
        const lens = item.lensId ? findLens(item.lensId) : null
        const rx = state.prescriptions.find((p) => p.id === item.rxId) || null
        return { ...item, product, lens, rx, framePrice: product.price, lensPrice: lens ? lens.price : 0, total: product.price + (lens ? lens.price : 0) }
      })
      .filter(Boolean)
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
