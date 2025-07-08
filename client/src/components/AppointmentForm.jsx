import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input, Label, Select, Textarea } from './ui/input'
import { Calendar, Clock, CheckCircle, User } from 'lucide-react'

const AppointmentForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    reason: '',
    notes: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const timeSlots = [
    { value: '', label: 'Select preferred time' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' }
  ]

  const reasons = [
    { value: '', label: 'Select reason for visit' },
    { value: 'eye-exam', label: 'Comprehensive Eye Exam' },
    { value: 'prescription-update', label: 'Prescription Update' },
    { value: 'contact-lens-fitting', label: 'Contact Lens Fitting' },
    { value: 'frame-selection', label: 'Frame Selection' },
    { value: 'eye-problem', label: 'Eye Problem/Concern' },
    { value: 'follow-up', label: 'Follow-up Visit' },
    { value: 'other', label: 'Other' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsLoading(false)
    setIsSubmitted(true)
    
    // Reset form after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        reason: '',
        notes: ''
      })
    }, 5000)
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-navy-900 mb-2">Appointment Booked!</h3>
        <p className="text-gray-600 mb-4">
          Thank you for booking with Pareena Eye Care Center.
        </p>
        <div className="bg-green-50 p-4 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-green-700">
            📅 <strong>{formData.date}</strong> at <strong>{timeSlots.find(slot => slot.value === formData.time)?.label}</strong>
          </p>
          <p className="text-sm text-green-700 mt-2">
            You'll receive a confirmation SMS shortly.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary-100 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Book an Eye Test</CardTitle>
        <CardDescription>
          Schedule your comprehensive eye examination with our experienced optometrists.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                min={today}
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time *</Label>
              <Select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              >
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit *</Label>
            <Select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
            >
              {reasons.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any specific concerns or requirements..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start text-sm text-blue-700">
            <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Working Hours:</p>
              <p>Monday - Saturday: 9:00 AM - 8:00 PM</p>
              <p>Sunday: 10:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AppointmentForm
