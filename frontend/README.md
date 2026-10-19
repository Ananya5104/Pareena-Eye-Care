# Pareena Eye Care Center website

The website for Pareena Eye Care Center, Ameerpet, Hyderabad: shop frames and lenses, book an eye test, request a video consultation.

Built with React, Vite, Tailwind CSS and Axios. The design comes from the Pareena Eye Care design system (logo blues `#2386C8` and `#233B7E`, near-black `#231F20`, Barlow Condensed headings, Barlow text, 4 to 8px corners, borders instead of shadows).

## Run it

Start the Django backend first (see `../README.md`), then:

```bash
npm install
npm run dev        # http://localhost:5173, with /api and /media forwarded to localhost:8000
npm run build      # production files in dist/
```

In production, set `VITE_API_URL` to the backend's address, for example `https://pareena-api.onrender.com` (see `.env.example`).

## Pages

| Address | Page |
| --- | --- |
| `/` | Home |
| `/shop`, `/shop?type=sun` | Eyeglasses and sunglasses, with filters |
| `/shop/:slug` | Product detail, then the lens step |
| `/prescription` | Prescription entry |
| `/lens-guide` | Lens guide |
| `/book` | Book an eye test |
| `/video-consultation` | Video consultation request |
| `/consultations` | Consultation status |
| `/cart`, `/checkout`, `/order/:reference` | Cart, checkout, order confirmation |
| `/login`, `/account` | Sign in with an emailed code (optional), my account |
| `/about` | About us, map, hours |

Old addresses (`/products`, `/appointment`, `/quick-call`, `/contact`) redirect to the new pages.

## Where things live

```
src/
  data/store.js       shop details: address, phone, hours, map, optometrist  <- edit here
  data/catalog.js     shop filter options and price formatting
  lib/api.js          every backend call, and the mapping from API fields to page data
  lib/useAsync.js     loading / error state for API calls
  state/AppState.jsx  cart, saved prescriptions, signed-in user, and references to the
                      customer's orders, bookings and consultations (saved in the browser)
  components/         layout, buttons and form pieces, lens panel, reviews
  pages/              one file per page
  index.css           design tokens and shared styles
```

Products, brands, lens types and prices are managed in Django admin. Opening hours appear in `store.js`
for display; the bookable times come from Admin → Business hours, so change both together.

Things still marked `[like this]` need real content: owner name, year the shop opened, the optometrist's details, and store photos.
