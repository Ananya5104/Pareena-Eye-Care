// Shop filter options and price formatting. Products, brands and lens types come from the backend.

export const SHAPES = ['Round', 'Rectangle', 'Square', 'Oval', 'Cat-eye', 'Aviator']
export const GENDERS = ['Men', 'Women', 'Unisex', 'Kids']
export const PRICE_RANGES = [
  { id: 'any', name: 'Any price', test: () => true },
  { id: 'u3000', name: 'Under ₹3,000', test: (p) => p < 3000 },
  { id: 'mid', name: '₹3,000 to ₹8,000', test: (p) => p >= 3000 && p <= 8000 },
  { id: 'o8000', name: 'Over ₹8,000', test: (p) => p > 8000 },
]

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
