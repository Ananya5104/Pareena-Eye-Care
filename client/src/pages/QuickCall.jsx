import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CallRequestForm from '../components/CallRequestForm'
import { 
  Phone, 
  Clock, 
  MessageCircle,
  Headphones,
  CheckCircle,
  Eye
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

const QuickCall = () => {
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

  const features = [
    {
      icon: Clock,
      title: "Quick Response",
      description: "We'll call you back within 15-30 minutes during working hours"
    },
    {
      icon: Headphones,
      title: "Expert Consultation",
      description: "Speak directly with our experienced optometrists"
    },
    {
      icon: MessageCircle,
      title: "Personalized Advice",
      description: "Get tailored recommendations for your specific eye concerns"
    },
    {
      icon: CheckCircle,
      title: "No Obligation",
      description: "Free consultation with no pressure to book an appointment"
    }
  ]

  const commonIssues = [
    "Eye strain from computer work",
    "Dry or watery eyes",
    "Blurry or changing vision",
    "Frequent headaches",
    "Contact lens discomfort",
    "Need for prescription update",
    "Eye irritation or redness",
    "Questions about eye care"
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className={`fixed w-full top-0 z-50 transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-accent-orange/10 to-primary-100 py-20 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="mb-8"
            >
              <Phone className="h-16 w-16 text-accent-orange mx-auto mb-4" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-navy-900 mb-6">
              Quick Call Request
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Eye strain? Dry eyes? Get instant help from your friendly optometrist
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                className="text-center p-6 bg-gray-50 rounded-xl"
              >
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call Request Form Section */}
      <section className="py-16 bg-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <CallRequestForm />
          </motion.div>
        </div>
      </section>

      {/* Common Issues Section */}
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
              Common Eye Concerns We Help With
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our optometrists are here to help with a wide range of eye-related issues
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {commonIssues.map((issue, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                className="flex items-center p-4 bg-gray-50 rounded-lg"
              >
                <Eye className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{issue}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Working Hours Section */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Clock className="h-12 w-12 mx-auto mb-6 text-primary-400" />
            <h2 className="text-3xl font-bold mb-6">Our Working Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-navy-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Weekdays</h3>
                <p className="text-gray-300">Monday - Saturday</p>
                <p className="text-2xl font-bold text-primary-400">9:00 AM - 8:00 PM</p>
              </div>
              <div className="bg-navy-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Sunday</h3>
                <p className="text-gray-300">Sunday</p>
                <p className="text-2xl font-bold text-primary-400">10:00 AM - 6:00 PM</p>
              </div>
            </div>
            <p className="mt-6 text-gray-300">
              Callback requests outside working hours will be answered the next business day
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default QuickCall
