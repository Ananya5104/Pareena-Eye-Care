import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Eye, ShoppingCart, Heart } from 'lucide-react'

const ProductCard = ({ 
  product = {
    id: 1,
    name: "Classic Frame",
    price: "₹2,999",
    image: "/api/placeholder/300/200",
    category: "Prescription Glasses",
    description: "Elegant and comfortable frame for everyday wear"
  },
  onAddToCart,
  onViewDetails 
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden group cursor-pointer">
        <div className="relative overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="icon" variant="secondary" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium">
            {product.category}
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <CardDescription>{product.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary-600">{product.price}</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewDetails?.(product)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button 
                size="sm"
                onClick={() => onAddToCart?.(product)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ProductCard
