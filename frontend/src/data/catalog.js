// Sample catalogue. Replace with data from the backend (see src/lib/api.js).
// Prices are examples.

export const LENSES = [
  { id: 'single', name: 'Single Vision', price: 1200, short: 'One power for distance or reading.', goodFor: 'most people under 40, and reading-only glasses.', worksWithoutPower: false, needsAdd: false, readyIn: '2 to 3 days' },
  { id: 'blue', name: 'Blue Light', price: 1800, short: 'Single vision with a screen-light filter.', goodFor: 'long hours on a laptop or phone. Can be made without power.', worksWithoutPower: true, needsAdd: false, readyIn: '2 to 3 days' },
  { id: 'glare', name: 'Anti-Glare', price: 1500, short: 'Fewer reflections, especially at night.', goodFor: 'driving at night, video calls, photos.', worksWithoutPower: true, needsAdd: false, readyIn: '3 to 5 days' },
  { id: 'photo', name: 'Photochromic', price: 2800, short: 'Clear indoors, darkens outdoors.', goodFor: 'people who go in and out a lot. Darkens less inside a car.', worksWithoutPower: true, needsAdd: false, readyIn: '5 to 7 days' },
  { id: 'prog', name: 'Progressive', price: 4500, short: 'Distance, computer and reading in one lens.', goodFor: 'over 40 and needing help with both far and near. Needs an ADD value.', worksWithoutPower: false, needsAdd: true, readyIn: '5 to 7 days' },
]

export const SHAPES = ['Round', 'Rectangle', 'Square', 'Oval', 'Cat-eye', 'Aviator']
export const GENDERS = ['Men', 'Women', 'Unisex', 'Kids']
export const BRANDS = ['Brand A', 'Brand B', 'Brand C', 'Brand D']
export const PRICE_RANGES = [
  { id: 'any', name: 'Any price', test: () => true },
  { id: 'u1500', name: 'Under ₹1,500', test: (p) => p < 1500 },
  { id: 'mid', name: '₹1,500 to ₹2,500', test: (p) => p >= 1500 && p <= 2500 },
  { id: 'o2500', name: 'Over ₹2,500', test: (p) => p > 2500 },
]

const C = {
  black: { name: 'Black', hex: '#231f20' },
  tortoise: { name: 'Tortoise', hex: '#6b3e1f' },
  gold: { name: 'Gold', hex: '#c9a54a' },
  gunmetal: { name: 'Gunmetal', hex: '#4a4f57' },
  wine: { name: 'Wine', hex: '#6e2233' },
  navy: { name: 'Navy', hex: '#233b7e' },
  silver: { name: 'Silver', hex: '#9aa5b8' },
  rose: { name: 'Rose', hex: '#c48a8a' },
  clear: { name: 'Clear', hex: '#d9dde3' },
  green: { name: 'Olive', hex: '#3e5a3a' },
}

export const PRODUCTS = [
  { id: 'cat-eye-acetate', brand: 'Brand B', name: 'Cat-eye acetate', type: 'glasses', shape: 'Cat-eye', gender: 'Women', price: 2450, size: '52-18-140', fit: 'Medium', colours: [C.black, C.tortoise, C.wine], material: 'Acetate', rim: 'Full rim', weight: '22 g', hinges: 'Spring hinges', progressive: true, powerRange: 'SPH −8.00 to +6.00' },
  { id: 'round-metal-gold', brand: 'Brand A', name: 'Round metal, gold', type: 'glasses', shape: 'Round', gender: 'Women', price: 1850, size: '49-21-140', fit: 'Small', colours: [C.gold, C.gunmetal], material: 'Metal', rim: 'Full rim', weight: '16 g', hinges: 'Standard hinges', progressive: true, powerRange: 'SPH −6.00 to +4.00' },
  { id: 'oval-thin-rim', brand: 'Brand C', name: 'Oval thin rim', type: 'glasses', shape: 'Oval', gender: 'Women', price: 1450, size: '50-19-135', fit: 'Small', colours: [C.rose, C.tortoise], material: 'Metal', rim: 'Full rim', weight: '15 g', hinges: 'Standard hinges', progressive: false, powerRange: 'SPH −6.00 to +4.00' },
  { id: 'square-full-rim', brand: 'Brand A', name: 'Square full rim', type: 'glasses', shape: 'Square', gender: 'Unisex', price: 2100, size: '53-18-145', fit: 'Medium', colours: [C.black, C.navy], material: 'Acetate', rim: 'Full rim', weight: '24 g', hinges: 'Spring hinges', progressive: true, powerRange: 'SPH −10.00 to +6.00' },
  { id: 'rectangle-half-rim', brand: 'Brand D', name: 'Rectangle half rim', type: 'glasses', shape: 'Rectangle', gender: 'Men', price: 1650, size: '54-17-145', fit: 'Large', colours: [C.gunmetal, C.black], material: 'Metal', rim: 'Half rim', weight: '18 g', hinges: 'Spring hinges', progressive: true, powerRange: 'SPH −6.00 to +4.00' },
  { id: 'round-acetate-tortoise', brand: 'Brand B', name: 'Round acetate, tortoise', type: 'glasses', shape: 'Round', gender: 'Unisex', price: 2750, size: '48-20-140', fit: 'Small', colours: [C.tortoise, C.clear], material: 'Acetate', rim: 'Full rim', weight: '21 g', hinges: 'Spring hinges', progressive: true, powerRange: 'SPH −8.00 to +6.00' },
  { id: 'kids-flexible', brand: 'Brand C', name: 'Kids flexible frame', type: 'glasses', shape: 'Rectangle', gender: 'Kids', price: 1250, size: '44-16-125', fit: 'Kids', colours: [C.navy, C.wine], material: 'TR90', rim: 'Full rim', weight: '12 g', hinges: 'Flexible hinges', progressive: false, powerRange: 'SPH −8.00 to +6.00' },
  { id: 'rimless-rectangle', brand: 'Brand D', name: 'Rimless rectangle', type: 'glasses', shape: 'Rectangle', gender: 'Men', price: 3200, size: '55-17-140', fit: 'Large', colours: [C.silver, C.gold], material: 'Titanium', rim: 'Rimless', weight: '11 g', hinges: 'Standard hinges', progressive: true, powerRange: 'SPH −4.00 to +4.00' },
  { id: 'soft-square-rose', brand: 'Brand A', name: 'Soft square, rose', type: 'glasses', shape: 'Square', gender: 'Women', price: 1950, size: '51-18-140', fit: 'Medium', colours: [C.rose, C.black], material: 'Acetate', rim: 'Full rim', weight: '20 g', hinges: 'Spring hinges', progressive: true, powerRange: 'SPH −8.00 to +6.00' },
  { id: 'classic-aviator', brand: 'Brand A', name: 'Classic aviator', type: 'sun', shape: 'Aviator', gender: 'Unisex', price: 2950, size: '58-14-140', fit: 'Large', colours: [C.gold, C.gunmetal], material: 'Metal', rim: 'Full rim', weight: '25 g', hinges: 'Standard hinges', progressive: false, powerRange: 'SPH −4.00 to +4.00' },
  { id: 'wide-square-sun', brand: 'Brand B', name: 'Wide square sun', type: 'sun', shape: 'Square', gender: 'Women', price: 2650, size: '55-19-145', fit: 'Large', colours: [C.black, C.tortoise], material: 'Acetate', rim: 'Full rim', weight: '28 g', hinges: 'Spring hinges', progressive: false, powerRange: 'SPH −4.00 to +4.00' },
  { id: 'sport-wrap', brand: 'Brand D', name: 'Sport wrap', type: 'sun', shape: 'Rectangle', gender: 'Men', price: 2250, size: '62-15-130', fit: 'Large', colours: [C.black, C.navy], material: 'TR90', rim: 'Full rim', weight: '24 g', hinges: 'Standard hinges', progressive: false, powerRange: 'No power' },
  { id: 'round-sun-green', brand: 'Brand C', name: 'Round sun, green lens', type: 'sun', shape: 'Round', gender: 'Unisex', price: 1950, size: '50-21-145', fit: 'Medium', colours: [C.green, C.gold], material: 'Metal', rim: 'Full rim', weight: '19 g', hinges: 'Standard hinges', progressive: false, powerRange: 'SPH −4.00 to +4.00' },
]

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
export const findProduct = (id) => PRODUCTS.find((p) => p.id === id)
export const findLens = (id) => LENSES.find((l) => l.id === id)
