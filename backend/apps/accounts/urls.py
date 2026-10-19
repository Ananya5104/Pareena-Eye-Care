from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import MeView, RequestCodeView, VerifyCodeView

urlpatterns = [
    path("code/", RequestCodeView.as_view(), name="auth-code"),
    path("verify/", VerifyCodeView.as_view(), name="auth-verify"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
]
