from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return JsonResponse({
        "project": "CIIP",
        "message": "Civic Infrastructure Intelligence Platform Backend",
        "status": "running"
    })


urlpatterns = [
    path("", home, name="home"),

    path("admin/", admin.site.urls),

    path(
        "api/users/",
        include("users.urls")
    ),

    path(
        "api/",
        include("complaints.urls")
    ),

    path(
        "api/",
        include("departments.urls")
    ),

    path(
        "api/",
        include("officers.urls")
    ),
]


# ==========================================================
# DEVELOPMENT MEDIA FILE SERVING
# ==========================================================

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )