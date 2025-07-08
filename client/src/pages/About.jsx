import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  Eye,
  Heart,
  Award,
  Users,
  Clock,
  Shield,
  Star,
  CheckCircle
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

const About = () => {
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

  const values = [
    {
      icon: Eye,
      title: "Vision Excellence",
      description: "We are committed to providing the highest quality eye care services with precision and expertise."
    },
    {
      icon: Heart,
      title: "Compassionate Care",
      description: "Every patient receives personalized attention and care tailored to their unique needs."
    },
    {
      icon: Shield,
      title: "Trust & Reliability",
      description: "Building lasting relationships through honest, transparent, and reliable service."
    },
    {
      icon: Award,
      title: "Professional Excellence",
      description: "Continuous learning and adoption of latest technologies to serve you better."
    }
  ]

  const stats = [
    { number: "15+", label: "Years of Experience" },
    { number: "5000+", label: "Happy Customers" },
    { number: "10000+", label: "Eye Tests Completed" },
    { number: "4.9", label: "Average Rating" }
  ]

  const team = [
    {
      name: "Srinivas Katakam",
      role: "Optometrist",
      experience: "25+ years",
      specialization: "Comprehensive Eye Care",
      description: "Specialized in advanced eye examinations and vision correction with extensive experience in contact lens fitting."
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
            <h1 className="text-4xl md:text-6xl font-bold text-navy-900 mb-6">
              About Pareena Eye Care
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your trusted partner in comprehensive eye care and vision solutions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Founded in 2008, Pareena Eye Care Center has been serving the Hyderabad community
                with dedication and excellence. What started as a small clinic has grown into a
                trusted eye care destination, known for our personalized approach and commitment
                to vision health.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Located in the heart of Ameerpet, we have been privileged to serve thousands of
                families, helping them see clearly and live brightly. Our journey has been marked
                by continuous growth, technological advancement, and most importantly, the trust
                of our patients.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Our Mission</h3>
                  <p className="text-gray-600">To provide exceptional eye care that enhances quality of life</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-100 to-navy-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                 <img
              src="/logo.png"
              alt="Pareena Eye Care Center Logo"
              className="h-50 w-100 mx-auto mb-6 "
            />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-navy-900">4.9/5 Rating</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 bg-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at Pareena Eye Care Center
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="bg-white p-6 rounded-xl shadow-sm text-center"
              >
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-navy-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeIn}>
                <h3 className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                  {stat.number}
                </h3>
                <p className="text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
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
              Meet Our Expert Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our experienced optometrists are dedicated to providing you with the best eye care
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto justify-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {team.map((member, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="bg-gray-50 p-4 rounded-xl mx-auto w-full max-w-md"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-navy-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-primary-600 font-medium mb-2">{member.role}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {member.experience}
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        {member.specialization}
                      </div>
                    </div>
                    <p className="text-gray-600">{member.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-navy-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <img
              src="/logo.png"
              alt="Pareena Eye Care Center Logo"
              className="h-16 w-16 mx-auto mb-6 object-contain filter brightness-0 invert"
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our Vision
            </h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              To be the most trusted eye care center in Hyderabad, known for our commitment
              to excellence, innovation, and compassionate patient care. We envision a community
              where everyone has access to quality eye care and the opportunity to see clearly
              and live brightly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-3 text-primary-300" />
                <h3 className="font-semibold mb-2">Quality Care</h3>
                <p className="text-sm opacity-80">Exceptional service standards</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-3 text-primary-300" />
                <h3 className="font-semibold mb-2">Latest Technology</h3>
                <p className="text-sm opacity-80">Advanced diagnostic equipment</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-3 text-primary-300" />
                <h3 className="font-semibold mb-2">Patient First</h3>
                <p className="text-sm opacity-80">Your comfort is our priority</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About