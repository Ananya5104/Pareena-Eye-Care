from django.contrib import admin

from .models import LoginCode, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone")
    search_fields = ("user__email", "phone")


@admin.register(LoginCode)
class LoginCodeAdmin(admin.ModelAdmin):
    list_display = ("email", "created_at", "attempts", "used")
    search_fields = ("email",)
    readonly_fields = ("email", "code_hash", "attempts", "used", "created_at")

    def has_add_permission(self, request):
        return False
