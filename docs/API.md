# Pareena Eye Care Center — API reference

Base URL: `{BACKEND_URL}/api/v1/`. Interactive docs: `/api/docs/` (Swagger) and `/api/redoc/`.
Machine-readable schema: [`openapi.yaml`](openapi.yaml) (regenerate with `python manage.py spectacular --file ../docs/openapi.yaml`).
The React app calls these through `frontend/src/lib/api.js`.

- JSON everywhere, except the uploads, which accept `multipart/form-data`.
- **Authentication is optional.** Guests can book, request consultations and order. Signed-in users send
  `Authorization: Bearer <access>` so their records are linked to their account and the `list` endpoints work.
- Errors use DRF's format: `{"field": ["message"]}` or `{"detail": "message"}`. Rate-limited requests return `429`.
- Phone numbers are normalised to `+<country><number>` (a 10-digit number gets `DEFAULT_COUNTRY_CODE`, 91).
- Text inputs are stripped of HTML and control characters. Uploads must be 10 MB or less and are stored under random names.

## Clinic & reviews

| Method | Path | Description |
|---|---|---|
| GET | `clinic/` | Booking settings, hours, `online_payments_available`, optometrists, testimonials, gallery |
| GET | `reviews/` | `{rating, total, url, reviews:[{author, rating, when, text, url}]}`, or `null` if Google isn't configured (cached 6 h) |
| GET | `health/` | `{"status":"ok"}` |

## Appointments

| Method | Path | Description |
|---|---|---|
| GET | `appointments/calendar/` | `{first_date, last_date, closed_weekdays (0=Mon), closed_dates}` for the date picker |
| GET | `appointments/slots/?date=YYYY-MM-DD` | `{date, slot_duration_minutes, slots:[{time:"10:00", available}]}` |
| POST | `appointments/` | Book. Rate limit `APPOINTMENT_RATE` (default 10/hour) |
| GET | `appointments/` | My appointments (**auth**) |

```http
POST /api/v1/appointments/
{"name": "Asha Patel", "phone": "9876543210", "email": "", "for_whom": "My child",
 "reason": "Routine check-up", "notes": "", "date": "2026-10-21", "time": "10:00"}
→ 201 {"id": 7, ..., "status": "pending"}
→ 400 {"time": ["This slot is no longer available. Please pick another time."]}
```

Slots run in steps of `slot_duration_minutes` from the opening hours (default Mon–Sat 10:00–21:00, Sun 11:00–20:00).
A slot must end by closing time and be at least `min_notice_minutes` away. Blocked slots and full-day closures are excluded.
A database constraint prevents double booking, even under concurrent requests.

## Video consultations

| Method | Path | Description |
|---|---|---|
| POST | `consultations/` | Submit (multipart). Rate limit `CONSULTATION_RATE` (default 5/hour) |
| GET | `consultations/{reference}/` | Status of one request |
| GET | `consultations/lookup/?refs=a,b,c` | Statuses for up to 20 references (guests' saved requests) |
| GET | `consultations/` | My requests (**auth**) |

```http
POST /api/v1/consultations/   (multipart/form-data; repeat `issues` and `photos`)
name, phone, email (optional),
issues = red_eyes | dry_eyes | itching | irritation | lens_discomfort | other   (1 or more)
since = today | few_days | week | longer      eye = both | right | left
preferred_time = today_evening | tomorrow_morning | tomorrow_evening | any
issue_description (20–1000 chars), photos (0–3 JPEG/PNG/WEBP)
→ 201 {"reference": "3f2c…", "status": "pending", ...}
```

The status fields are revealed by stage. `meet_link` and `scheduled_for` appear while approved, `patient_notes` once completed,
and `rejection_reason` once rejected.

## Catalogue

| Method | Path | Description |
|---|---|---|
| GET | `brands/` | Brands with `product_count` |
| GET | `lens-types/?guide=true` | Lens types: `slug, name, price, short_description, description, good_for, ready_in, works_without_power, requires_addition` |
| GET | `products/` | Paginated (`page_size` up to 200). Filters: `category=eyeglasses\|sunglasses`, `brand`, `gender`, `shape`, `frame_type`, `fit`, `min_price`, `max_price`, `featured`, `search`, `ordering` |
| GET | `products/facets/` | Filter options |
| GET | `products/{slug}/` | Detail: `images[{image, view, variant}]`, `variants[{id, color_name, color_hex, stock}]`, `size_label`, `power_range`, `progressive_compatible`, `min_sph`, `max_sph`, `lens_types` (IDs this frame can take) |

## Prescriptions & orders

| Method | Path | Description |
|---|---|---|
| POST | `prescriptions/` | Save (JSON, or multipart with `upload` = photo or PDF) |
| GET | `prescriptions/{reference}/` | Fetch one |
| GET | `prescriptions/` | My prescriptions (**auth**) |
| POST | `orders/` | Place an order |
| GET | `orders/{reference}/` | Order status |
| POST | `orders/{reference}/pay/` | Start or retry online payment → Razorpay checkout params |
| POST | `orders/{reference}/verify-payment/` | Confirm a Razorpay payment (signature checked) |
| POST | `orders/{reference}/payment-failed/` | Record a failed or abandoned payment |
| POST | `orders/{reference}/pay-at-store/` | Switch an unpaid online order to pay at store |
| GET | `orders/` | My orders (**auth**) |
| POST | `payments/razorpay/webhook/` | Razorpay webhook (signature checked) |

```http
POST /api/v1/prescriptions/
{"patient_name": "Meera", "prescription_date": "12 Oct 2026",
 "right_sph": "-2.50", "right_cyl": "-0.75", "right_axis": 90, "right_add": null,
 "left_sph": "-2.25", "left_cyl": "0", "left_axis": null, "left_add": null, "pupillary_distance": 63}
→ 201 {"reference": "9a1b…", "summary": "R −2.50 / −0.75 × 90 · L −2.25", ...}
```
SPH runs from −20 to +20 and CYL from −6 to +6, both in 0.25 steps. AXIS (0–180) is required when CYL ≠ 0. ADD is entered per eye.

```http
POST /api/v1/orders/
{"customer_name": "Meera Shah", "phone": "9876543210", "email": "", "payment_method": "store" | "online",
 "items": [
   {"variant_id": 3, "lens_type_id": 1, "prescription_reference": "9a1b…", "quantity": 1},   // frame + lenses
   {"variant_id": 8, "lens_type_id": 2, "prescription_reference": null},                    // plain (zero-power) lenses
   {"variant_id": 5, "lens_type_id": null}                                                   // frame only, or sunglasses
 ]}
→ 201 {"order": {"reference", "order_number": "PEC-261019-A1B2C3", "total", "status", "payment_method",
                 "payment_status", "items": [...]},
       "payment": null | {"key_id", "razorpay_order_id", "amount", "currency"}}
```

Server-side rules:
- All prices are calculated on the server, and stock is reserved (row-locked) when the order is placed.
- Each item can carry a different prescription.
- A lens needs a prescription unless `works_without_power` is set.
- Progressive lenses need an ADD value and a `progressive_compatible` frame.
- The SPH must be within the frame's `min_sph`/`max_sph`.
- Sunglasses take no lens type.

Unpaid online orders are cancelled and restocked by `python manage.py release_unpaid_orders` (run every 15 minutes).

## Account (optional, sign in by emailed code)

| Method | Path | Body → response |
|---|---|---|
| POST | `auth/code/` | `{email}` → `{sent, resend_in}`; `429 {detail, resend_in}` within 30 s of the last code |
| POST | `auth/verify/` | `{email, code}` → `{user, access, refresh, is_new}`; `400 {detail, tries_left}` |
| POST | `auth/token/refresh/` | `{refresh}` → `{access, refresh}` |
| GET/PATCH | `auth/me/` | `{id, email, name, phone}`; PATCH `name` and/or `phone` |

Codes are 6 digits and stored only as a hash. Each code is valid for 10 minutes and allows 3 tries. A new email creates an account.
Access tokens last 30 minutes and refresh tokens 7 days, with rotation.
