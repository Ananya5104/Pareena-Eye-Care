import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CallRequestForm from '../components/CallRequestForm'
import TestimonialCarousel from '../components/TestimonialCarousel'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  Eye,
  Shield,
  Clock,
  Award,
  ArrowRight,
  Phone,
  Calendar,
  Glasses,
  Sun,
  Contact,
  Star,
  Users,
  CheckCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

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

// Add this new animation variant
const scrollAnimation = {
  offscreen: { y: 100, opacity: 0 },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 1
    }
  }
};

const Home = () => {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  return (
    <div className="min-h-screen bg-background">
      <div className={`fixed w-full top-0 z-50 transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-blue-50 to-navy-100 py-20 mt-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-600 rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-navy-600 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-primary-600 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center max-w-5xl mx-auto"
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
              <img
                src="/logo.png"
                alt="Pareena Eye Care Center Logo"
                className="h-20 w-70 mx-auto mb-4 object-contain"
              />
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold text-navy-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              See Clearly, <span className="text-primary-600">Live Brightly</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Prescription glasses, contact lenses, sunglasses, and eye care — all in one place.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Link to="/products">
                <Button size="lg" className="text-lg px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white">
                  <Glasses className="mr-2 h-5 w-5" />
                  Shop Now
                </Button>
              </Link>
              <Link to="/appointment">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Appointment
                </Button>
              </Link>
              <Link to="/quick-call">
                <Button variant="accent" size="lg" className="text-lg px-8 py-4">
                  <Phone className="mr-2 h-5 w-5" />
                  Talk to Optom
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Pareena Eye Care Center?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We provide comprehensive eye care services with the latest technology and premium eyewear collection.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn}>
              <Card className="text-center hover:shadow-lg transition-shadow ">
                <CardHeader>
                  <Eye className="h-12 w-12 text-blue-900 mx-auto mb-4" />
                  <CardTitle>Expert Eye Care</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Professional eye examinations with advanced diagnostic equipment.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="text-center hover:shadow-lg transition-shadow ">
                <CardHeader>
                  <Shield className="h-12 w-12 text-blue-900 mx-auto mb-4" />
                  <CardTitle>Premium Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    High-quality frames and lenses from trusted brands worldwide.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Clock className="h-12 w-12 text-blue-900 mx-auto mb-4" />
                  <CardTitle>Quick Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Fast and efficient service with same-day lens fitting available.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Award className="h-12 w-12 text-blue-900 mx-auto mb-4" />
                  <CardTitle>Trusted Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Years of experience serving the community with excellence.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Product Highlights Section */}
      <section className="py-20 bg-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
              Our Eyewear Collection
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our wide range of frames, sunglasses, and specialty lenses designed for every lifestyle and budget.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-lg">
                <div className="h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative overflow-hidden">
                  <Glasses className="h-20 w-20 text-primary-600 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl text-navy-900">Prescription Glasses</CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Wide selection of frames for every style and budget
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to="/products?category=prescription">
                    <Button variant="outline" className="group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-lg">
                <div className="h-64 bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center relative overflow-hidden">
                  <Sun className="h-20 w-20 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl text-navy-900">Sunglasses</CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    UV protection with fashionable designs for outdoor activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to="/products?category=sunglasses">
                    <Button variant="outline" className="group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-all duration-300">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-lg">
                <div className="h-64 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center relative overflow-hidden">
                  <Contact className="h-20 w-20 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl text-navy-900">Contact Lenses</CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Daily, weekly, and monthly contact lenses from top brands
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to="/products?category=contacts">
                    <Button variant="outline" className="group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-center mt-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Link to="/products">
              <Button size="lg" variant="primary" className="px-8 py-4 text-lg">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick Call Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
              Need Quick Help?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Eye strain? Dry eyes? Request a quick callback from your friendly optometrist.
            </p>
          </motion.div>

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

      {/* Appointment Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-navy-700 text-white">
        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <Calendar className="h-16 w-16 mx-auto mb-6 text-white" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Book an Eye Test
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Schedule your comprehensive eye examination with our experienced optometrists.
          </p>
          <Link to="/appointment">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white text-navy-900 hover:bg-gray-100">
              <Calendar className="mr-2 h-5 w-5" />
              Book Appointment Now
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what our happy customers have to say about their experience.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <TestimonialCarousel />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn}>
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-navy-900 mb-2">5000+</h3>
              <p className="text-gray-600">Happy Customers</p>
            </motion.div>

            <motion.div variants={fadeIn}>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-navy-900 mb-2">10000+</h3>
              <p className="text-gray-600">Eye Tests Done</p>
            </motion.div>

            <motion.div variants={fadeIn}>
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-3xl font-bold text-navy-900 mb-2">4.9</h3>
              <p className="text-gray-600">Average Rating</p>
            </motion.div>

            <motion.div variants={fadeIn}>
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-navy-900 mb-2">15+</h3>
              <p className="text-gray-600">Years Experience</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Home