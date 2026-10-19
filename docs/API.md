# Pareena Eye Care Center — API reference

Base URL: `{BACKEND_URL}/api/v1/`. Interactive docs: `/api/docs/` (Swagger) and `/api/redoc/`.
Machine-readable schema: [`openapi.yaml`](openapi.yaml) (regenerate with `python manage.py spectacular --file ../docs/openapi.yaml`).

- JSON everywhere, except the uploads, which accept `multipart/form-data`.
- **Authentication is optional.** Guests can book, request consultations and order. Signed-in users send
  `Authorization: Bearer <access>` so their records are linked to their account and the `list` endpoints work.
- Errors use DRF's format: `{"field": ["message"]}` or `{"detail": "message"}`. Rate-limited requests return `429`.
- Phone numbers are normalised to `+<country><number>` (a 10-digit number gets `DEFAULT_COUNTRY_CODE`, 91).
- Text inputs are stripped of HTML and control characters.

## Clinic

| Method | Path | Description |
|---|---|---|
| GET | `clinic/` | Store info, booking settings, hours, optometrists, testimonials, gallery |
| GET | `health/` | `{"status":"ok"}` |

```json
{
  "clinic": {
    "name": "Pareena Eye Care Center", "tagline": "...", "description": "...", "philosophy": "...",
    "address": "...", "phone": "...", "whatsapp_number": "919...", "email": "...",
    "google_maps_embed_url": "https://www.google.com/maps/embed?...", "google_maps_link": "...",
    "slot_duration_minutes": 30, "booking_window_days": 30,
    "consultations_enabled": true, "online_payments_available": false,
    "business_hours": [{"weekday": 0, "weekday_name": "Monday", "open_time": "10:00:00", "close_time": "21:00:00", "is_closed": false}]
  },
  "optometrists": [{"id": 1, "name": "...", "photo": null, "qualifications": "B.Optom", "experience_years": 10, "specialization": "...", "bio": "..."}],
  "testimonials": [{"id": 1, "patient_name": "...", "quote": "...", "rating": 5}],
  "gallery": [{"id": 1, "image": "https://...", "caption": "..."}]
}
```

## Appointments

| Method | Path | Description |
|---|---|---|
| GET | `appointments/calendar/` | Bookable window and closed days for the date picker |
| GET | `appointments/slots/?date=YYYY-MM-DD` | Slots for a day with availability |
| POST | `appointments/` | Book (rate limit `APPOINTMENT_RATE`, default 10/hour) |
| GET | `appointments/` | My appointments (**auth**) |

```http
GET /api/v1/appointments/calendar/
→ {"first_date": "2026-10-19", "last_date": "2026-11-18", "closed_weekdays": [], "closed_dates": ["2026-11-01"]}

GET /api/v1/appointments/slots/?date=2026-10-20
→ {"date": "2026-10-20", "slot_duration_minutes": 30,
   "slots": [{"time": "10:00", "available": true}, {"time": "10:30", "available": false}, ...]}

POST /api/v1/appointments/
{"name": "Asha Patel", "phone": "9876543210", "email": "", "reason": "Routine eye test",
 "date": "2026-10-20", "time": "10:00"}
→ 201 {"id": 7, ..., "status": "pending", "duration_minutes": 30}
→ 400 {"time": ["This slot is no longer available. Please pick another time."]}
```

Slot rules: these come from the opening hours (Mon–Sat 10:00–21:00, Sun 11:00–20:00 by default) in steps of `slot_duration_minutes`. A slot must
end by closing time, must be at least `min_notice_minutes` from now, must not be blocked, and must not already be taken. A database
constraint makes double booking impossible even when two requests arrive at the same moment.

## Consultations

| Method | Path | Description |
|---|---|---|
| POST | `consultations/` | Submit a request (multipart; rate limit `CONSULTATION_RATE`, default 5/hour) |
| GET | `consultations/{reference}/` | Status lookup; `meet_link` only appears once approved |
| GET | `consultations/` | My requests (**auth**) |

```http
POST /api/v1/consultations/   (multipart/form-data)
name=Ravi Kumar  phone=9876543210  email=ravi@example.com (optional)
issue_type=red_eyes|dry_eyes|itching|irritation|lens_discomfort|other
issue_description=...(10–2000 chars)  image=<jpeg/png/webp ≤ 5 MB> (optional)
→ 201 {"reference": "3f2c…", "status": "pending", ...}

GET /api/v1/consultations/3f2c…/
→ {"reference": "3f2c…", "status": "approved", "issue_type": "red_eyes",
   "scheduled_for": "2026-10-19T17:30:00+05:30", "meet_link": "https://meet.google.com/abc-defg-hij"}
```

Statuses: `pending` → `approved` (Meet link created and sent) → `completed`, or `rejected`.

## Catalogue

| Method | Path | Description |
|---|---|---|
| GET | `brands/` | Brands with `product_count` |
| GET | `lens-types/?guide=true` | Lens types (`guide=true` returns only those on the Lens Guide) |
| GET | `products/` | Paginated list (12 per page) |
| GET | `products/facets/` | Filter options for the shop sidebar |
| GET | `products/{slug}/` | Detail with images, colour variants, compatible lens types |

Product filters: `brand=<slug>`, `category=eyeglasses|sunglasses`, `gender=men|women|unisex|kids`,
`shape=…`, `frame_type=full_rim|half_rim|rimless`, `size=S|M|L`, `min_price`, `max_price`, `featured=true`,
`search=…`, `ordering=price|-price|-created_at|name`, `page=N`.

```json
// products/ result item
{"id": 6, "slug": "carrera-carrera-8821-8821", "name": "Carrera 8821", "brand": "Carrera", "brand_slug": "carrera",
 "category": "eyeglasses", "gender": "men", "shape": "rectangle", "frame_type": "full_rim", "size": "M",
 "price": "7990.00", "mrp": null, "image": "https://…/products/x.jpg",
 "colors": [{"name": "Matte Blue", "hex": "#233b7e"}], "in_stock": true, "is_featured": false}

// products/{slug}/ adds:
{"brand": {"name": "Carrera", "logo": null, ...}, "model_number": "8821", "material": "Acetate", "description": "...",
 "size_label": "54-17-145", "lens_width_mm": 54, "bridge_width_mm": 17, "temple_length_mm": 145,
 "max_power": "8.00", "lens_notes": "",
 "images": [{"id": 1, "image": "https://…", "alt_text": "", "variant": 3}],
 "variants": [{"id": 3, "color_name": "Matte Blue", "color_hex": "#233b7e", "stock": 3, "in_stock": true}],
 "lens_types": [{"id": 1, "name": "Single Vision", "price": "1500.00", "requires_prescription": true, "requires_addition": false, ...}]}
```

## Prescriptions & orders

| Method | Path | Description |
|---|---|---|
| POST | `prescriptions/` | Save a prescription (JSON or multipart with `prescription_image`) |
| GET | `prescriptions/{reference}/` | Fetch by reference |
| GET | `prescriptions/` | My prescriptions (**auth**) |
| POST | `orders/` | Place an order (rate limit `ORDER_RATE`) |
| GET | `orders/{reference}/` | Order status (for the confirmation page) |
| POST | `orders/{reference}/verify-payment/` | Confirm a Razorpay payment |
| GET | `orders/` | My orders (**auth**) |
| POST | `payments/razorpay/webhook/` | Razorpay webhook (signature-verified) |

```http
POST /api/v1/prescriptions/
{"right_sph": "-2.50", "right_cyl": "-0.75", "right_axis": 90,
 "left_sph": "-2.25", "left_cyl": "0", "left_axis": null,
 "add_power": null, "pupillary_distance": 62, "no_power": false}
→ 201 {"reference": "9a1b…", ...}
```
Prescription rules: SPH runs from −20 to +20 and CYL from −6 to +6, both in 0.25 steps. AXIS (0–180) is required when CYL ≠ 0. ADD is required for
lens types with `requires_addition` (progressive). `no_power: true` stores a zero-power prescription.

```http
POST /api/v1/orders/
{"customer_name": "Meera Shah", "phone": "9876543210", "email": "meera@example.com",
 "payment_method": "store" | "online",
 "prescription_reference": "9a1b…",
 "items": [{"variant_id": 3, "lens_type_id": 1, "quantity": 1}],
 "notes": ""}
→ 201 {"order": {"reference": "…", "order_number": "PEC-261019-A1B2C3", "total": "9490.00", "status": "placed", ...},
       "payment": null}                                   // pay at store
→ 201 {"order": {...}, "payment": {"key_id": "rzp_live_…", "razorpay_order_id": "order_…",
                                   "amount": 949000, "currency": "INR"}}   // online
```

The server calculates all prices and checks stock, lens compatibility, prescription requirements and the frame's power limit.
Stock is reserved when the order is placed. If an online order isn't paid, `python manage.py release_unpaid_orders` (run it on a schedule)
cancels it and returns the stock.

Online payment flow:
1. `POST orders/` with `payment_method: "online"`. The response includes `payment`.
2. Open Razorpay Checkout with `key`, `order_id`, `amount` and `currency`.
3. In Checkout's success handler, call `POST orders/{reference}/verify-payment/` with
   `{razorpay_order_id, razorpay_payment_id, razorpay_signature}`. This returns the order with `payment_status: "paid"`.

## Auth (optional)

| Method | Path | Body |
|---|---|---|
| POST | `auth/register/` | `{email, password, first_name, last_name?}` → `{user, access, refresh}` |
| POST | `auth/login/` | `{email, password}` → `{user, access, refresh}` |
| POST | `auth/token/refresh/` | `{refresh}` → `{access, refresh}` |
| GET/PATCH | `auth/me/` | Current user |

Access tokens last 30 minutes and refresh tokens 7 days, with rotation.
