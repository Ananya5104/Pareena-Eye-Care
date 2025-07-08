import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'

import Home from './pages/Home'
import Products from './pages/Products'
import AppointmentBooking from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import QuickCall from './pages/QuickCall'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/appointment" element={<AppointmentBooking />} />
        <Route path="/services" element={<AppointmentBooking />} />
        <Route path="/quick-call" element={<QuickCall />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  )
}

export default App
