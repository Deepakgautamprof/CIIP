from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, WardViewSet


router = DefaultRouter()

router.register(
    r"departments",
    DepartmentViewSet,
    basename="department"
)

router.register(
    r"wards",
    WardViewSet,
    basename="ward"
)

urlpatterns = router.urls