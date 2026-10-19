# Pareena Eye Care Center website

The website for Pareena Eye Care Center, Ameerpet, Hyderabad: shop frames and lenses, book an eye test, request a video consultation.

Built with React, Vite and Tailwind CSS. The design comes from the Pareena Eye Care design system (logo blues `#2386C8` and `#233B7E`, near-black `#231F20`, Barlow Condensed headings, Barlow text, 4 to 8px corners, borders instead of shadows).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production files in dist/
```

## Pages

| Address | Page |
| --- | --- |
| `/` | Home |
| `/shop`, `/shop?type=sun` | Eyeglasses and sunglasses, with filters |
| `/shop/:id` | Product detail, then the lens step |
| `/prescription` | Prescription entry |
| `/lens-guide` | Lens guide |
| `/book` | Book an eye test |
| `/video-consultation` | Video consultation request |
| `/consultations` | Consultation status |
| `/cart`, `/checkout`, `/order/:id` | Cart, checkout, order confirmation |
| `/login`, `/account` | Sign in (optional), my account |
| `/about` | About us, map, hours |

Old addresses (`/products`, `/appointment`, `/quick-call`, `/contact`) redirect to the new pages.

## Where things live

```
src/
  data/store.js       shop details: address, phone, hours, map, optometrist  <- edit here
  data/catalog.js     sample frames and lens types with prices               <- replace with real stock
  lib/api.js          every backend call (currently sample data)             <- connect to Django here
  state/AppState.jsx  cart, prescriptions, account, orders (saved in the browser)
  components/         layout, buttons and form pieces, lens panel, reviews
  pages/              one file per page
  index.css           design tokens and shared styles
```

Things still marked `[like this]` need real content: owner name, year the shop opened, the optometrist's details, store photos and brand logos.

## Trying it without a backend

- Sign-in code: `123456`
- Payment failed page: check out with a mobile number ending in `0000`
- Consultation statuses: on `/consultations`, press "See example statuses"

## Backend to build next

Each function in `src/lib/api.js` lists the endpoint it expects:

- `GET /api/slots?date=` and `POST /api/appointments`
- `POST /api/consultations` (with photos), plus admin approve/reject that adds a Google Meet link
- `POST /api/orders` and online payment (Razorpay or similar for UPI)
- `POST /api/auth/otp` and `POST /api/auth/verify` (SMS codes)
- `GET /api/reviews` (the server fetches Google reviews and caches them)
