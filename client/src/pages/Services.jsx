import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AppointmentForm from '../components/AppointmentForm'
import {
  Calendar,
  Clock,
  Eye,
  Shield,
  Award,
  CheckCircle,
  Users,
  Star
} from 'lucide-react'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
}

const AppointmentBooking = () => {
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10)
      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

  const services = [
    {
      icon: Eye,
      title: "Comprehensive Eye Exam",
      description: "Complete eye health assessment with advanced diagnostic equipment",
      duration: "45-60 minutes",
      price: "₹500"
    },
    {
      icon: Shield,
      title: "Contact Lens Fitting",
      description: "Professional fitting and training for contact lens users",
      duration: "30-45 minutes",
      price: "₹300"
    },
    {
      icon: Award,
      title: "Prescription Update",
      description: "Quick vision check and prescription adjustment",
      duration: "20-30 minutes",
      price: "₹200"
    },
    {
      icon: CheckCircle,
      title: "Frame Selection Consultation",
      description: "Expert guidance in choosing the perfect frame for your face",
      duration: "15-30 minutes",
      price: "Free"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className={`fixed w-full top-0 z-50 transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-navy-100 py-20 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            <Calendar className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-navy-900 mb-6">
              Book Your Appointment
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Schedule your eye examination with our experienced optometrists
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive range of eye care services
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <service.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-navy-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration}
                      </div>
                      <div className="font-semibold text-primary-600">
                        {service.price}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Appointment Form Section */}
      <section className="py-16 bg-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <AppointmentForm />
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
              Why Choose Pareena Eye Care?
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn} className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Expert Team</h3>
              <p className="text-gray-600">
                Experienced optometrists with years of expertise in eye care
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">Advanced Equipment</h3>
              <p className="text-gray-600">
                Latest diagnostic technology for accurate and comprehensive eye exams
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">5-Star Service</h3>
              <p className="text-gray-600">
                Exceptional customer service with personalized care for every patient
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AppointmentBooking