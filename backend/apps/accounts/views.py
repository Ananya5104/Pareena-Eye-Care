from django.contrib.auth import get_user_model
from django.db import transaction
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.notifications import send_email_safely

from .models import LoginCode
from .serializers import RequestCodeSerializer, UserSerializer, VerifyCodeSerializer, tokens_for

User = get_user_model()

AUTH_RESPONSE = inline_serializer(
    "AuthResponse",
    {
        "user": UserSerializer(),
        "access": serializers.CharField(),
        "refresh": serializers.CharField(),
        "is_new": serializers.BooleanField(),
    },
)


class RequestCodeView(APIView):
    """Email a 6-digit sign-in code. Signing in with a new email creates the account."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    @extend_schema(
        request=RequestCodeSerializer,
        responses=inline_serializer("CodeSent", {"sent": serializers.BooleanField(),
                                                 "resend_in": serializers.IntegerField()}),
    )
    def post(self, request):
        data = RequestCodeSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        email = data.validated_data["email"]

        latest = LoginCode.latest(email)
        if latest and latest.resend_wait_seconds:
            return Response(
                {"detail": f"Please wait {latest.resend_wait_seconds} seconds before asking for a new code.",
                 "resend_in": latest.resend_wait_seconds},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        _, code = LoginCode.issue(email)
        sent = send_email_safely(
            f"{code} is your Pareena Eye Care sign-in code",
            f"Your sign-in code is {code}\n\nIt works for 10 minutes. If you didn't ask for it, ignore this email.\n\n"
            "Pareena Eye Care Center",
            [email],
        )
        if not sent:
            return Response({"detail": "We couldn't send the email. Please try again in a minute."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"sent": True, "resend_in": int(LoginCode.RESEND_AFTER.total_seconds())})


class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    @extend_schema(request=VerifyCodeSerializer, responses=AUTH_RESPONSE)
    def post(self, request):
        data = VerifyCodeSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        email, code = data.validated_data["email"], data.validated_data["code"]

        login_code = LoginCode.latest(email)
        if login_code is None or not login_code.verify(code):
            tries_left = 0
            if login_code and not login_code.used and not login_code.expired:
                tries_left = max(0, LoginCode.MAX_ATTEMPTS - login_code.attempts)
            if login_code and login_code.expired:
                message = "That code has expired. Get a new code to continue."
            elif tries_left:
                message = f"That code doesn't match. {tries_left} {'try' if tries_left == 1 else 'tries'} left."
            else:
                message = "Too many tries. Get a new code to continue."
            return Response({"detail": message, "tries_left": tries_left}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.filter(email__iexact=email).first()
            is_new = user is None
            if is_new:
                user = User.objects.create_user(username=email, email=email)
                user.set_unusable_password()
                user.save(update_fields=["password"])
        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"user": UserSerializer(user).data, "is_new": is_new or not user.get_full_name(),
                         **tokens_for(user)})


class MeView(generics.RetrieveUpdateAPIView):
    """Current user. PATCH `name` and/or `phone`."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch"]

    def get_object(self):
        return self.request.user
