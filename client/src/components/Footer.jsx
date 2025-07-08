import React from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Heart
} from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" }
  ]

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "Services", href: "/services" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" }
  ]

  const services = [
    "Eye Examinations",
    "Prescription Glasses",
    "Contact Lenses",
    "Sunglasses",
    "Frame Repairs",
    "Lens Replacement"
  ]

  return (
    <footer className="bg-navy-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-4">
              <img
                src="/logo.png"
                alt="Pareena Eye Care Center Logo"
                className="h-8 w-15 object-contain mr-2"
              />
              <h3 className="text-xl font-bold">Pareena Eye Care</h3>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Your vision is our priority. We provide comprehensive eye care services 
              with the latest technology and premium eyewear collection.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className="bg-navy-800 p-2 rounded-full hover:bg-primary-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2">
              {services.map((service, index) => (
                <li key={index} className="text-gray-300">
                  {service}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-relaxed">
                  Shop no 1, #8-3-903/3, Omega Apartments,<br />
                  Nagarjuna Nagar, Ameerpet,<br />
                  Sanjay Gandhi Nagar, Yella Reddy Guda,<br />
                  Hyderabad, Telangana 500073
                </p>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-primary-400 mr-3" />
                <a 
                  href="tel:+919963006059" 
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  +91 9963006059
                </a>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-primary-400 mr-3" />
                <a 
                  href="mailto:pareenaeyecare@gmail.com" 
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  pareenaeyecare@gmail.com
                </a>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-primary-400 mr-3 mt-0.5" />
                <div className="text-gray-300 text-sm">
                  <p>Mon - Sat: 9:00 AM - 9:00 PM</p>
                  <p>Sunday: 10:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Google Maps Embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 pt-8 border-t border-navy-800"
        >
          <h4 className="text-lg font-semibold mb-4 text-center">Find Us</h4>
          <div className="rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d951.6446662831966!2d78.44544452852834!3d17.43199629896212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb90ceaf7b6e4b%3A0x8b531265a8506a69!2sPareena%20Eye%20Care%20Center!5e0!3m2!1sen!2sin!4v1749571843788!5m2!1sen!2sin"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Pareena Eye Care Location"
            ></iframe>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 pt-8 border-t border-navy-800 text-center"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Pareena Eye Care Center. All rights reserved.
            </p>
            <div className="flex items-center mt-2 md:mt-0">
              <span className="text-gray-400 text-sm mr-2">Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-gray-400 text-sm ml-2">for better vision</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
