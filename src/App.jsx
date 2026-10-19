import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Prescription from './pages/Prescription'
import LensGuide from './pages/LensGuide'
import Book from './pages/Book'
import VideoConsultation from './pages/VideoConsultation'
import Consultations from './pages/Consultations'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Login from './pages/Login'
import Account from './pages/Account'
import About from './pages/About'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:id" element={<Product />} />
        <Route path="prescription" element={<Prescription />} />
        <Route path="lens-guide" element={<LensGuide />} />
        <Route path="book" element={<Book />} />
        <Route path="video-consultation" element={<VideoConsultation />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:id" element={<OrderConfirmation />} />
        <Route path="login" element={<Login />} />
        <Route path="account" element={<Account />} />
        <Route path="about" element={<About />} />

        {/* Old addresses from the previous site */}
        <Route path="products" element={<Navigate to="/shop" replace />} />
        <Route path="appointment" element={<Navigate to="/book" replace />} />
        <Route path="services" element={<Navigate to="/book" replace />} />
        <Route path="quick-call" element={<Navigate to="/video-consultation" replace />} />
        <Route path="contact" element={<Navigate to="/about#visit" replace />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
