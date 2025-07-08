import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input, Label, Select } from './ui/input'
import { Phone, Clock, CheckCircle } from 'lucide-react'

const CallRequestForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    issue: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const issues = [
    { value: '', label: 'Select your concern' },
    { value: 'eye-strain', label: 'Eye Strain' },
    { value: 'dry-eyes', label: 'Dry Eyes' },
    { value: 'blurry-vision', label: 'Blurry Vision' },
    { value: 'headaches', label: 'Frequent Headaches' },
    { value: 'prescription-update', label: 'Prescription Update' },
    { value: 'contact-lens', label: 'Contact Lens Issues' },
    { value: 'other', label: 'Other Concerns' }
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
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: '', phone: '', issue: '' })
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-navy-900 mb-2">Request Submitted!</h3>
        <p className="text-gray-600">We'll call you back within 15-30 minutes during working hours.</p>
      </motion.div>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary-100 p-3 rounded-full">
            <Phone className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <CardTitle>Quick Call Request</CardTitle>
        <CardDescription>
          Eye strain? Dry eyes? Request a quick callback from your friendly optometrist.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
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
            <Label htmlFor="phone">Phone Number</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="issue">What's bothering you?</Label>
            <Select
              id="issue"
              name="issue"
              value={formData.issue}
              onChange={handleInputChange}
              required
            >
              {issues.map(issue => (
                <option key={issue.value} value={issue.value}>
                  {issue.label}
                </option>
              ))}
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Submitting...' : 'Request Callback'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-sm text-blue-700">
            <Clock className="h-4 w-4 mr-2" />
            We'll call you back in 15-30 minutes during working hours (9 AM - 8 PM)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CallRequestForm
