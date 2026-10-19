from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Brand, LensType, Product, ProductVariant
from apps.core.models import BusinessHours, ClinicSettings, Optometrist

BRANDS = [
    ("Ray-Ban", "Iconic aviators, wayfarers and optical frames since 1937."),
    ("Oakley", "Performance eyewear engineered for sport and everyday wear."),
    ("Vogue", "Fashion-forward frames with bold colours and shapes."),
    ("Carrera", "Bold, sporty Italian design with a racing heritage."),
    ("David Jones", "Lightweight, comfortable everyday frames."),
    ("Maui Jim", "Polarised sunglasses known for colour-rich clarity."),
    ("Tommy Hilfiger", "Classic American style in optical and sun frames."),
]

# Slugs match the diagrams the website draws on the Lens Guide page.
LENS_TYPES = [
    dict(
        slug="single", name="Single Vision", price=Decimal("1200"), ready_in="2 to 3 days",
        short_description="One power for distance or reading.",
        description="One power across the whole lens, for seeing far or for reading.",
        good_for="most people under 40, and reading-only glasses.",
    ),
    dict(
        slug="blue", name="Blue Light", price=Decimal("1800"), ready_in="2 to 3 days", works_without_power=True,
        short_description="Single vision with a screen-light filter.",
        description="Single vision with a coating that reflects some of the blue light from screens.",
        good_for="long hours on a laptop or phone. Can be made without power.",
    ),
    dict(
        slug="glare", name="Anti-Glare", price=Decimal("1500"), ready_in="3 to 5 days", works_without_power=True,
        short_description="Fewer reflections, especially at night.",
        description=(
            "Single vision with a coating that cuts reflections, so others see your eyes and night lights "
            "halo less."
        ),
        good_for="driving at night, video calls, photos.",
    ),
    dict(
        slug="photo", name="Photochromic", price=Decimal("2800"), ready_in="5 to 7 days", works_without_power=True,
        short_description="Clear indoors, darkens outdoors.",
        description="Clear indoors, darkens in sunlight in about a minute. One pair instead of two.",
        good_for="people who go in and out a lot. Darkens less inside a car.",
    ),
    dict(
        slug="prog", name="Progressive", price=Decimal("4500"), ready_in="5 to 7 days", requires_addition=True,
        short_description="Distance, computer and reading in one lens.",
        description=(
            "Far at the top, screen distance in the middle, reading at the bottom, with no visible line. "
            "Takes a week or two to get used to."
        ),
        good_for="over 40 and needing help with both far and near. Needs an ADD value.",
    ),
]

# (brand, name, model, category, gender, shape, frame_type, material, hinges, weight_g, fit,
#  (lens, bridge, arm), price, mrp, progressive_ok, (min_sph, max_sph), [(colour, hex, stock)], featured)
DEMO_PRODUCTS = [
    ("Ray-Ban", "Clubmaster Optics", "RB5154", "eyeglasses", "unisex", "clubmaster", "half_rim", "Acetate and metal",
     "standard", 24, "medium", (51, 21, 145), "8990", "9990", True, ("-8", "6"),
     [("Black and gold", "#231f20", 4), ("Tortoise", "#6b3e1f", 3)], True),
    ("Ray-Ban", "Aviator Classic", "RB3025", "sunglasses", "unisex", "aviator", "full_rim", "Metal",
     "standard", 25, "large", (58, 14, 135), "10490", None, False, (None, None),
     [("Gold", "#c9a54a", 5), ("Gunmetal", "#4a4f57", 2)], True),
    ("Oakley", "Holbrook", "OO9102", "sunglasses", "men", "square", "full_rim", "O Matter",
     "standard", 28, "large", (57, 18, 137), "11990", None, False, (None, None),
     [("Matte black", "#231f20", 4)], True),
    ("Oakley", "Pitchman R", "OX8105", "eyeglasses", "men", "round", "full_rim", "O Matter",
     "spring", 22, "medium", (50, 19, 143), "9990", None, True, ("-8", "6"),
     [("Satin black", "#231f20", 3), ("Clear", "#d9dde3", 2)], False),
    ("Vogue", "VO5286", "VO5286", "eyeglasses", "women", "cat_eye", "full_rim", "Acetate",
     "spring", 20, "small", (51, 17, 140), "5490", "5990", True, ("-8", "6"),
     [("Rose", "#c48a8a", 3), ("Tortoise", "#6b3e1f", 4)], True),
    ("Carrera", "Carrera 8821", "8821", "eyeglasses", "men", "rectangle", "full_rim", "Acetate",
     "spring", 24, "medium", (54, 17, 145), "7990", None, True, ("-10", "6"),
     [("Navy", "#233b7e", 3), ("Black", "#231f20", 5)], False),
    ("Carrera", "Carrera 1007/S", "1007S", "sunglasses", "unisex", "aviator", "full_rim", "Metal",
     "standard", 26, "large", (62, 12, 140), "12490", None, False, (None, None),
     [("Gunmetal", "#4a4f57", 3)], False),
    ("David Jones", "Titanium Lite", "DJ-5102", "eyeglasses", "men", "rectangle", "rimless", "Titanium",
     "standard", 11, "large", (55, 17, 140), "3990", "4490", True, ("-4", "4"),
     [("Silver", "#9aa5b8", 6), ("Gold", "#c9a54a", 4)], False),
    ("David Jones", "Kids Flex", "DJ-K201", "eyeglasses", "kids", "rectangle", "full_rim", "TR90",
     "flexible", 12, "kids", (44, 16, 125), "2490", None, False, ("-8", "6"),
     [("Navy", "#233b7e", 5), ("Wine", "#6e2233", 3)], False),
    ("Maui Jim", "Peahi", "MJ202", "sunglasses", "men", "geometric", "full_rim", "Grilamid",
     "standard", 30, "large", (65, 15, 125), "21990", None, False, (None, None),
     [("Matte black", "#231f20", 2)], True),
    ("Tommy Hilfiger", "TH 1765", "TH1765", "eyeglasses", "unisex", "square", "full_rim", "Acetate",
     "spring", 23, "medium", (53, 18, 145), "6490", None, True, ("-8", "6"),
     [("Navy", "#233b7e", 4), ("Tortoise", "#6b3e1f", 3)], False),
    ("Tommy Hilfiger", "TH 1940/S", "TH1940S", "sunglasses", "women", "cat_eye", "full_rim", "Acetate",
     "spring", 27, "medium", (55, 17, 140), "7990", "8490", False, (None, None),
     [("Black", "#231f20", 4)], False),
]


class Command(BaseCommand):
    help = "Seed business hours, clinic settings, lens types and brands. Use --demo to add sample products."

    def add_arguments(self, parser):
        parser.add_argument("--demo", action="store_true", help="Also create demo products (without images).")

    @transaction.atomic
    def handle(self, *args, demo=False, **options):
        ClinicSettings.load()
        for weekday, (open_t, close_t) in BusinessHours.DEFAULTS.items():
            BusinessHours.objects.get_or_create(weekday=weekday, defaults={"open_time": open_t, "close_time": close_t})

        for order, data in enumerate(LENS_TYPES):
            LensType.objects.get_or_create(slug=data["slug"], defaults={**data, "display_order": order})

        for order, (name, description) in enumerate(BRANDS):
            Brand.objects.get_or_create(name=name, defaults={"description": description, "display_order": order})

        if not Optometrist.objects.exists():
            Optometrist.objects.create(
                name="Optometrist name (edit in admin)",
                qualifications="B.Optom",
                experience_years=10,
                specialization="Comprehensive eye exams, contact lens fitting",
                bio="Update this profile in Admin → Optometrists.",
            )

        self.stdout.write(self.style.SUCCESS("Seeded hours, clinic settings, lens types and brands."))
        if demo:
            self._demo_products()

    def _demo_products(self):
        created = 0
        for (brand, name, model, category, gender, shape, frame_type, material, hinges, weight, fit, dims, price,
             mrp, progressive_ok, (min_sph, max_sph), variants, featured) in DEMO_PRODUCTS:
            product, was_created = Product.objects.get_or_create(
                brand=Brand.objects.get(name=brand),
                model_number=model,
                defaults=dict(
                    name=name, category=category, gender=gender, shape=shape, frame_type=frame_type,
                    material=material, hinges=hinges, weight_g=weight, fit=fit,
                    lens_width_mm=dims[0], bridge_width_mm=dims[1], temple_length_mm=dims[2],
                    price=Decimal(price), mrp=Decimal(mrp) if mrp else None,
                    progressive_compatible=progressive_ok,
                    min_sph=Decimal(min_sph) if min_sph else None, max_sph=Decimal(max_sph) if max_sph else None,
                    is_featured=featured,
                    description=f"Demo listing for {brand} {name}. Replace with real details and photos in admin.",
                ),
            )
            if was_created:
                created += 1
                for color, hex_code, stock in variants:
                    ProductVariant.objects.create(product=product, color_name=color, color_hex=hex_code, stock=stock)
        self.stdout.write(self.style.SUCCESS(f"Created {created} demo product(s)."))
