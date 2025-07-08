# Pareena Eye Care Center - Frontend

A modern, responsive, and premium frontend for an optical store website built with React, TailwindCSS, and Framer Motion.

## 🌟 Features

### Design System
- **Color Palette**: Navy (#2C3E50), Blue (#3498DB), Orange (#F5B041), Green (#2ECC71)
- **Typography**: Montserrat/Open Sans clean sans-serif fonts
- **Premium Feel**: Framer Motion animations throughout
- **Responsive Design**: Mobile-first approach with TailwindCSS

### Pages Implemented

#### 🏠 Home Page
- **Hero Section**: "See Clearly, Live Brightly" with animated call-to-action buttons
- **Product Highlights**: 3 cards for Prescription Glasses, Sunglasses, Contact Lenses
- **Quick Call Section**: Integrated CallRequestForm component
- **Appointment Banner**: Eye-catching CTA for booking appointments
- **Testimonials**: Carousel with customer reviews
- **Stats Section**: Company achievements and ratings
- **Features Section**: Why choose Pareena Eye Care

#### 🛍️ Products Page
- **Grid/List View**: Toggle between different product layouts
- **Advanced Filters**: Category, price range, search functionality
- **Product Cards**: Hover effects, add to cart, view details
- **Sample Products**: 8 sample products across all categories

#### 📅 Appointment Booking Page
- **Service Selection**: Different types of eye care services
- **Appointment Form**: Comprehensive booking form with date/time selection
- **Working Hours**: Clear display of availability
- **Why Choose Us**: Trust indicators and expertise highlights

#### 📞 Quick Call Request Page
- **Call Request Form**: Simple form for callback requests
- **Features Section**: Quick response, expert consultation, personalized advice
- **Common Issues**: List of eye concerns we help with
- **Working Hours**: When callbacks are available

#### ℹ️ About Us Page
- **Our Story**: Company history and mission
- **Values Section**: Core principles with icons
- **Stats**: Company achievements
- **Team Section**: Meet the optometrists
- **Vision Statement**: Future goals and commitments

#### 📧 Contact Us Page
- **Contact Information**: Address, phone, email, hours
- **Contact Form**: Full message form with validation
- **Google Maps**: Embedded location map
- **WhatsApp Integration**: Quick chat support

### 🧩 Reusable Components

#### UI Components
- **Button**: Multiple variants with Framer Motion animations
- **Card**: Flexible card component with header, content, footer
- **Input/Textarea/Select**: Form components with consistent styling
- **Label**: Form labels with proper accessibility

#### Business Components
- **ProductCard**: Product display with hover effects and actions
- **CallRequestForm**: Quick callback request with validation
- **AppointmentForm**: Comprehensive appointment booking
- **TestimonialCarousel**: Auto-playing customer testimonials
- **Footer**: Complete footer with contact info and map
- **Navbar**: Responsive navigation with mobile menu

### 🎨 Premium Features
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Works perfectly on all devices
- **Hover Effects**: Interactive elements throughout
- **Loading States**: Animated loading indicators
- **Form Validation**: Client-side validation with feedback
- **Auto-playing Carousel**: Testimonials with manual controls

### 🛠️ Tech Stack
- **React 19**: Latest React with hooks
- **Vite**: Fast development and build tool
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Router**: Client-side routing
- **Lucide React**: Beautiful icons
- **clsx**: Conditional class names

### 📱 Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### 🎯 Business Information
- **Location**: Shop no 1, #8-3-903/3, Omega Apartments, Nagarjuna Nagar, Ameerpet, Hyderabad
- **Services**: Eye examinations, prescription glasses, contact lenses, sunglasses
- **Working Hours**: Mon-Sat 9AM-8PM, Sun 10AM-6PM
- **Logo**: Uses the official logo from `public/logo.png`

## 🚀 Getting Started

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: `http://localhost:5173`

## 📁 Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/           # Base UI components
│   │   ├── Navbar.jsx    # Navigation component
│   │   ├── Footer.jsx    # Footer component
│   │   └── ...           # Business components
│   ├── pages/            # Page components
│   └── App.jsx           # Main app component
├── public/               # Static assets
└── package.json          # Dependencies
```

## 🎨 Design Highlights

- **Premium Color Scheme**: Professional navy and blue with warm accent colors
- **Smooth Animations**: Framer Motion for premium feel
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Optimized images and lazy loading
- **SEO Ready**: Semantic HTML structure

## 📞 Contact Features

- **Quick Call Request**: 15-30 minute callback promise
- **WhatsApp Integration**: Direct chat support
- **Appointment Booking**: Full scheduling system
- **Contact Forms**: Multiple ways to get in touch

This frontend provides a complete, professional, and user-friendly experience for Pareena Eye Care Center customers.
