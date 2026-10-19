# Pareena Eye Care Center

Website for an optical store and optometrist clinic in Ameerpet, Hyderabad. Patients can book eye tests, request
quick video consultations, and buy branded frames and sunglasses with prescription lenses.

| Part | Stack | Deploy |
|---|---|---|
| `frontend/` | React (Vite), Tailwind CSS, Axios | Vercel |
| `backend/` | Django 5.2, Django REST Framework, PostgreSQL, JWT (optional accounts) | Render or Railway |

```
.
├── frontend/                React site (see frontend/README.md)
├── backend/
│   ├── config/              settings (env-driven), urls, wsgi
│   ├── apps/
│   │   ├── core/            clinic settings, hours, Google reviews, shared utils, `seed` command
│   │   ├── accounts/        sign in by emailed code, profile
│   │   ├── appointments/    Appointment, BlockedSlot, slot engine
│   │   ├── consultations/   ConsultationRequest + photos, Google Meet, email + WhatsApp links
│   │   ├── catalog/         Brand, Product, ProductVariant, ProductImage, LensType
│   │   └── orders/          Prescription, Order, OrderItem, Razorpay
│   ├── tests/
│   └── .env.example
├── docs/                    API.md, openapi.yaml, GOOGLE_MEET_SETUP.md
└── render.yaml              Render blueprint (API + Postgres)
```

## Run it locally

You need Python 3.11+ and Node 20+. PostgreSQL is recommended; without `DATABASE_URL`, a SQLite file is used.

```bash
# backend
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # then edit values
python manage.py migrate
python manage.py seed --demo      # hours, lens types, 7 brands, 12 demo products (no photos)
python manage.py createsuperuser
python manage.py runserver        # http://localhost:8000/admin/

# frontend (second terminal)
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Without `EMAIL_HOST` set, emails (including sign-in codes) are printed in the backend terminal.

Run the tests with `cd backend && python manage.py test tests`.

## First things to set up in Admin
1. **Clinic settings**: slot length (default 30 min), booking window, and whether online payment is offered.
2. **Business hours**: Mon–Sat 10:00–21:00 and Sun 11:00–20:00 are preloaded. If you change them, also change the text in
   `frontend/src/data/store.js`.
3. **Blocked slots**: holidays or doctor leave (whole day, or a time range).
4. **Products**: replace the demo products and upload photos (front, side, angle, on face). Each colour is a variant with its own stock.
   Set the frame's power range and whether it fits progressive lenses.
5. **Lens types**: prices and descriptions for the lens step and the Lens Guide.
6. **Brands**: logos (optional) appear on the home page.

## Daily workflows (Django admin)
- **Appointments**: select bookings, then *Approve* or *Cancel*. Both email the patient if they gave an email. Each row has a WhatsApp link.
- **Consultations**: open a request to read the issues and photos. Set *Scheduled for*, then click
  **Approve & generate Meet link**. The patient is emailed if they gave an email; click **Send Meet link on WhatsApp**
  to open WhatsApp with the message ready. After the call, write *Patient notes* and click **Mark completed**.
  Use **Reject** with a reason if they need an in-person visit.
- **Orders**: these move Placed → Confirmed → In the lab → Ready to collect (emails the customer) → Collected. Use
  *Mark paid* for pay-at-store orders. *Cancel* returns the stock.
- The doctor gets an email for each new booking, consultation and order (`DOCTOR_NOTIFICATION_EMAILS`), including admin and WhatsApp links.

WhatsApp messages are sent by staff with the one-click buttons. Nothing is sent automatically on WhatsApp.

## Integrations
| Feature | Env vars | Without it |
|---|---|---|
| Email (sign-in codes, confirmations) | `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (e.g. a Gmail app password) | Emails print to the console. **Required in production for sign-in** |
| Online payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, optional `RAZORPAY_WEBHOOK_SECRET` | Only "Pay at store" is offered |
| Auto Meet links | `GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN`, see `docs/GOOGLE_MEET_SETUP.md` | The doctor pastes a link from meet.google.com/new |
| Google reviews | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | The site links to Google reviews instead |
| Media storage | `STORAGE_BACKEND=cloudinary` + `CLOUDINARY_URL`, or `s3` + `AWS_*` | Local `media/` folder (dev only) |

Schedule `python manage.py release_unpaid_orders` every 15 minutes (Render Cron Job or Railway cron). It cancels
online orders left unpaid and returns their stock.

## Deployment
- **Backend on Render:** New → Blueprint and select this repo (`render.yaml` creates the API and Postgres). Fill in the
  `sync: false` variables. Set `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` and `FRONTEND_URL` to the Vercel URL, then run
  `python manage.py createsuperuser` in the Render shell. Use Cloudinary or S3 for media, because Render's disk is wiped on each deploy.
- **Backend on Railway:** create a service with root directory `backend/` and add PostgreSQL. `railway.json` runs migrate, seed and gunicorn.
- **Frontend on Vercel:** set the root directory to `frontend/` and `VITE_API_URL=https://<your-backend>`. `vercel.json` handles page routes.

## Security notes
- Double booking is prevented by validation and by a conditional unique constraint in the database.
- Prices are calculated on the server, and stock is row-locked when an order is placed.
- Rate limits apply to consultations, bookings, orders, prescriptions and sign-in.
- Sign-in codes are hashed, single-use, expire after 10 minutes and allow 3 tries.
- Text input is sanitised. Uploads are checked as real images (or PDFs for prescriptions) and saved under random names.
- Razorpay signatures are verified with HMAC. Admin workflow buttons use CSRF-protected POSTs.
- Production turns on HTTPS redirects, HSTS, secure cookies and `X-Frame-Options: DENY`.
