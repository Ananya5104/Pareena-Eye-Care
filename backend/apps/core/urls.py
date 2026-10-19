from django.urls import path

from .views import ClinicInfoView, HealthView, ReviewsView

urlpatterns = [
    path("clinic/", ClinicInfoView.as_view(), name="clinic-info"),
    path("health/", HealthView.as_view(), name="health"),
    path("reviews/", ReviewsView.as_view(), name="reviews"),
]
