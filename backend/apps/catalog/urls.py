from rest_framework.routers import DefaultRouter

from .views import BrandViewSet, LensTypeViewSet, ProductViewSet

router = DefaultRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("lens-types", LensTypeViewSet, basename="lens-type")
router.register("products", ProductViewSet, basename="product")

urlpatterns = router.urls
