from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.utils.text import slugify

from apps.core.models import TimeStampedModel


def _unique_slug(instance, value, model):
    base = slugify(value)[:200] or "item"
    slug, n = base, 2
    while model.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


class Brand(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True)
    description = models.CharField(max_length=300, blank=True)
    is_featured = models.BooleanField(default=True, help_text="Show on the home page.")
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(self, self.name, Brand)
        super().save(*args, **kwargs)


class LensType(models.Model):
    """Lens options for eyeglasses, also shown on the Lens Guide page."""

    name = models.CharField(max_length=80)
    slug = models.SlugField(
        max_length=100, unique=True, blank=True,
        help_text="The website draws a diagram for: single, blue, glare, photo, prog.",
    )
    short_description = models.CharField(max_length=200)
    description = models.TextField(help_text="Longer explanation on the Lens Guide page.")
    good_for = models.CharField(max_length=255, blank=True)
    ready_in = models.CharField(max_length=40, default="3 to 5 days")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    works_without_power = models.BooleanField(
        default=False, help_text="Can be made as plain (zero-power) lenses, e.g. blue light or anti-glare."
    )
    requires_addition = models.BooleanField(
        default=False, help_text="Needs a reading addition (ADD) in the prescription, e.g. progressive lenses."
    )
    show_in_guide = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "price"]

    def __str__(self):
        return f"{self.name} (₹{self.price})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(self, self.name, LensType)
        super().save(*args, **kwargs)


class Product(TimeStampedModel):
    class Category(models.TextChoices):
        EYEGLASSES = "eyeglasses", "Eyeglasses (frames)"
        SUNGLASSES = "sunglasses", "Sunglasses"

    class Gender(models.TextChoices):
        MEN = "men", "Men"
        WOMEN = "women", "Women"
        UNISEX = "unisex", "Unisex"
        KIDS = "kids", "Kids"

    class FrameType(models.TextChoices):
        FULL_RIM = "full_rim", "Full rim"
        HALF_RIM = "half_rim", "Half rim"
        RIMLESS = "rimless", "Rimless"

    class Shape(models.TextChoices):
        ROUND = "round", "Round"
        RECTANGLE = "rectangle", "Rectangle"
        SQUARE = "square", "Square"
        OVAL = "oval", "Oval"
        CAT_EYE = "cat_eye", "Cat-eye"
        AVIATOR = "aviator", "Aviator"
        WAYFARER = "wayfarer", "Wayfarer"
        CLUBMASTER = "clubmaster", "Clubmaster"
        GEOMETRIC = "geometric", "Geometric"

    class Fit(models.TextChoices):
        SMALL = "small", "Small"
        MEDIUM = "medium", "Medium"
        LARGE = "large", "Large"
        KIDS = "kids", "Kids"

    class Hinges(models.TextChoices):
        STANDARD = "standard", "Standard hinges"
        SPRING = "spring", "Spring hinges"
        FLEXIBLE = "flexible", "Flexible hinges"

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    model_number = models.CharField(max_length=60, blank=True)
    category = models.CharField(max_length=12, choices=Category.choices, default=Category.EYEGLASSES, db_index=True)
    gender = models.CharField(max_length=8, choices=Gender.choices, default=Gender.UNISEX)
    frame_type = models.CharField(max_length=10, choices=FrameType.choices, default=FrameType.FULL_RIM)
    shape = models.CharField(max_length=12, choices=Shape.choices, default=Shape.RECTANGLE)
    material = models.CharField(max_length=60, blank=True, help_text="e.g. Acetate, Metal, TR90")
    hinges = models.CharField(max_length=10, choices=Hinges.choices, default=Hinges.STANDARD)
    weight_g = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Frame weight in grams.")
    description = models.TextField(blank=True)

    # Frame size, as printed on the arm: lens width – bridge – arm length (mm)
    fit = models.CharField(max_length=6, choices=Fit.choices, default=Fit.MEDIUM)
    lens_width_mm = models.PositiveSmallIntegerField()
    bridge_width_mm = models.PositiveSmallIntegerField()
    temple_length_mm = models.PositiveSmallIntegerField()

    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)],
        help_text="Frame price. For sunglasses this includes the sun lenses.",
    )
    mrp = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, help_text="Optional original price, shown struck out."
    )

    # Lens compatibility (eyeglasses)
    compatible_lens_types = models.ManyToManyField(
        LensType, blank=True, related_name="products",
        help_text="Leave empty to allow every active lens type (progressive still needs the box below).",
    )
    progressive_compatible = models.BooleanField(
        default=True, help_text="Untick for frames too small for progressive lenses."
    )
    min_sph = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True, help_text="Lowest SPH the frame takes, e.g. -8.00."
    )
    max_sph = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True, help_text="Highest SPH the frame takes, e.g. 6.00."
    )

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_featured", "-created_at"]
        indexes = [models.Index(fields=["is_active", "category"])]

    def __str__(self):
        return f"{self.brand.name} {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(self, f"{self.brand.name} {self.name}", Product)
        super().save(*args, **kwargs)

    @property
    def size_label(self):
        return f"{self.lens_width_mm}-{self.bridge_width_mm}-{self.temple_length_mm}"

    @property
    def power_range(self):
        if self.min_sph is None and self.max_sph is None:
            return "No power" if self.category == self.Category.SUNGLASSES else ""

        def fmt(v):
            return "0.00" if v == 0 else f"{'+' if v > 0 else '−'}{abs(v):.2f}"

        low = fmt(self.min_sph) if self.min_sph is not None else "any"
        high = fmt(self.max_sph) if self.max_sph is not None else "any"
        return f"SPH {low} to {high}"

    @property
    def stock(self):
        return sum(v.stock for v in self.variants.all() if v.is_active)

    def available_lens_types(self):
        explicit = self.compatible_lens_types.filter(is_active=True)
        qs = explicit if explicit.exists() else LensType.objects.filter(is_active=True)
        if not self.progressive_compatible:
            qs = qs.filter(requires_addition=False)
        return qs

    def power_error(self, sph):
        """Return a message if this SPH is outside the frame's supported range."""
        if (self.min_sph is not None and sph < self.min_sph) or (self.max_sph is not None and sph > self.max_sph):
            return f"This frame takes {self.power_range}. Choose another frame or contact us for guidance."
        return None


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    color_name = models.CharField(max_length=60)
    color_hex = models.CharField(
        max_length=7,
        default="#000000",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$", "Use a hex colour like #1a2b3c.")],
    )
    sku = models.CharField(max_length=60, unique=True, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product} — {self.color_name}"


class ProductImage(models.Model):
    class View(models.TextChoices):
        FRONT = "front", "Front"
        SIDE = "side", "Side"
        ANGLE = "angle", "Angle"
        ON_FACE = "on_face", "On face"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name="images",
        help_text="Optional: link the image to a colour variant.",
    )
    view = models.CharField(max_length=8, choices=View.choices, default=View.FRONT)
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=150, blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.alt_text or f"{self.get_view_display()} of {self.product}"
