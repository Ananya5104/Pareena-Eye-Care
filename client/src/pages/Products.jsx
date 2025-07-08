import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/input'
import {
  Search,
  Filter,
  Grid,
  List,
  Glasses,
  Sun,
  Contact,
  Eye
} from 'lucide-react'

// Sample product data
const sampleProducts = [
  {
    id: 1,
    name: "Classic Aviator",
    price: "₹2,999",
    image: "/api/placeholder/300/200",
    category: "Sunglasses",
    description: "Timeless aviator style with UV protection"
  },
  {
    id: 2,
    name: "Modern Rectangle Frame",
    price: "₹3,499",
    image: "/api/placeholder/300/200",
    category: "Prescription Glasses",
    description: "Sleek rectangular frame for professional look"
  },
  {
    id: 3,
    name: "Daily Comfort Lenses",
    price: "₹1,200",
    image: "/api/placeholder/300/200",
    category: "Contact Lenses",
    description: "Daily disposable contact lenses for comfort"
  },
  {
    id: 4,
    name: "Designer Cat Eye",
    price: "₹4,299",
    image: "/api/placeholder/300/200",
    category: "Prescription Glasses",
    description: "Elegant cat eye frame for a sophisticated look"
  },
  {
    id: 5,
    name: "Sports Sunglasses",
    price: "₹3,799",
    image: "/api/placeholder/300/200",
    category: "Sunglasses",
    description: "Durable sports sunglasses with polarized lenses"
  },
  {
    id: 6,
    name: "Monthly Soft Lenses",
    price: "₹800",
    image: "/api/placeholder/300/200",
    category: "Contact Lenses",
    description: "Monthly replacement soft contact lenses"
  },
  {
    id: 7,
    name: "Vintage Round Frame",
    price: "₹2,799",
    image: "/api/placeholder/300/200",
    category: "Prescription Glasses",
    description: "Classic round frame with modern comfort"
  },
  {
    id: 8,
    name: "Polarized Wayfarer",
    price: "₹3,299",
    image: "/api/placeholder/300/200",
    category: "Sunglasses",
    description: "Classic wayfarer style with polarized protection"
  }
]

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const Products = () => {
  const [products, setProducts] = useState(sampleProducts)
  const [filteredProducts, setFilteredProducts] = useState(sampleProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange, setPriceRange] = useState('All')
  const [viewMode, setViewMode] = useState('grid')
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [visible, setVisible] = useState(true)

  const categories = ['All', 'Prescription Glasses', 'Sunglasses', 'Contact Lenses']
  const priceRanges = ['All', 'Under ₹2000', '₹2000-₹4000', 'Above ₹4000']

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10)
      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

  useEffect(() => {
    let filtered = products

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filter by price range
    if (priceRange !== 'All') {
      filtered = filtered.filter(product => {
        const price = parseInt(product.price.replace('₹', '').replace(',', ''))
        switch (priceRange) {
          case 'Under ₹2000':
            return price < 2000
          case '₹2000-₹4000':
            return price >= 2000 && price <= 4000
          case 'Above ₹4000':
            return price > 4000
          default:
            return true
        }
      })
    }

    setFilteredProducts(filtered)
  }, [searchTerm, selectedCategory, priceRange, products])

  const handleAddToCart = (product) => {
    console.log('Added to cart:', product)
    // Implement cart functionality
  }

  const handleViewDetails = (product) => {
    console.log('View details:', product)
    // Implement product details view
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Prescription Glasses':
        return <Glasses className="h-5 w-5" />
      case 'Sunglasses':
        return <Sun className="h-5 w-5" />
      case 'Contact Lenses':
        return <Contact className="h-5 w-5" />
      default:
        return <Eye className="h-5 w-5" />
    }
  }

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
              Our Products
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover our comprehensive collection of eyewear and eye care products
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Filters:</span>
              </div>

              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-w-[150px]"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>

              <Select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="min-w-[150px]"
              >
                {priceRanges.map(range => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Info */}
          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
            {selectedCategory !== 'All' && (
              <div className="flex items-center gap-2 bg-primary-100 px-3 py-1 rounded-full">
                {getCategoryIcon(selectedCategory)}
                <span className="text-sm font-medium text-primary-700">{selectedCategory}</span>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <motion.div
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1 max-w-4xl mx-auto'
              }`}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredProducts.map((product) => (
                <motion.div key={product.id} variants={fadeIn}>
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Products