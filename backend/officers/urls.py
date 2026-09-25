from rest_framework.routers import DefaultRouter
from .views import OfficerViewSet

router = DefaultRouter()

router.register(
    r"officers",
    OfficerViewSet,
    basename="officer"
)

urlpatterns = router.urls