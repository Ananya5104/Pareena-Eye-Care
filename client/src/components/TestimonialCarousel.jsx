import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from './ui/card'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    rating: 5,
    text: "Excellent service and beautiful frames! The staff was very helpful in choosing the perfect glasses for my face shape. Highly recommended!",
    location: "Ameerpet, Hyderabad"
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    rating: 5,
    text: "Professional eye examination and quick service. Got my prescription glasses ready in just 2 hours. Great quality and affordable prices.",
    location: "Nagarjuna Nagar"
  },
  {
    id: 3,
    name: "Anitha Reddy",
    rating: 5,
    text: "Amazing collection of sunglasses and contact lenses. The optometrist was very knowledgeable and explained everything clearly.",
    location: "Yella Reddy Guda"
  },
  {
    id: 4,
    name: "Vikram Singh",
    rating: 5,
    text: "Best eye care center in the area! Clean, modern facility with latest equipment. The team is friendly and professional.",
    location: "Sanjay Gandhi Nagar"
  },
  {
    id: 5,
    name: "Lakshmi Devi",
    rating: 5,
    text: "Wonderful experience! They have a great variety of frames for all budgets. My whole family gets our eye care done here.",
    location: "Ameerpet"
  }
]

const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Card className="mx-4">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Quote className="h-8 w-8 text-primary-600" />
                </div>
                
                <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonials[currentIndex].text}"
                </p>
                
                <div className="flex justify-center mb-4">
                  {renderStars(testimonials[currentIndex].rating)}
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy-900 text-lg">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {testimonials[currentIndex].location}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors z-10"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors z-10"
        aria-label="Next testimonial"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-primary-600' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full mr-2 ${isAutoPlaying ? 'bg-green-500' : 'bg-gray-400'}`} />
          {isAutoPlaying ? 'Auto-playing' : 'Paused'}
        </div>
      </div>
    </div>
  )
}

export default TestimonialCarousel
