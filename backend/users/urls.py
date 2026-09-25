from django.urls import path

from .views import (
    UserListView,
    RegisterView,
    LoginView,
    ProfileView,

    CreateDepartmentAdminView,
    DepartmentAdminListView,
    DepartmentAdminUpdateView,
    DepartmentAdminDeleteView,

    CreateWardAdminView,
    WardAdminListView,
    WardAdminUpdateView,
    WardAdminDeleteView,
    CitizenWardUpdateView,
)


urlpatterns = [

    # ======================================================
    # ALL CITIZENS
    # GET /api/users/
    # ======================================================

    path(
        "",
        UserListView.as_view(),
        name="user-list"
    ),

    # ======================================================
    # CITIZEN REGISTRATION
    # ======================================================

    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    # ======================================================
    # LOGIN
    # ======================================================

    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    # ======================================================
    # PROFILE
    # ======================================================

    path(
        "profile/",
        ProfileView.as_view(),
        name="profile"
    ),

    # ======================================================
    # DEPARTMENT ADMIN
    # ======================================================

    path(
        "create-department-admin/",
        CreateDepartmentAdminView.as_view(),
        name="create-department-admin"
    ),

    path(
        "department-admins/",
        DepartmentAdminListView.as_view(),
        name="department-admins"
    ),

    path(
        "department-admins/<int:pk>/",
        DepartmentAdminUpdateView.as_view(),
        name="department-admin-update"
    ),

    path(
        "department-admins/<int:pk>/delete/",
        DepartmentAdminDeleteView.as_view(),
        name="department-admin-delete"
    ),

    # ======================================================
    # WARD ADMIN
    # ======================================================

    path(
        "create-ward-admin/",
        CreateWardAdminView.as_view(),
        name="create-ward-admin"
    ),

    path(
        "ward-admins/",
        WardAdminListView.as_view(),
        name="ward-admins"
    ),

    path(
        "ward-admins/<int:pk>/",
        WardAdminUpdateView.as_view(),
        name="ward-admin-update"
    ),

    path(
        "ward-admins/<int:pk>/delete/",
        WardAdminDeleteView.as_view(),
        name="ward-admin-delete"
    ),

    path(
    "citizens/<int:pk>/ward/",
    CitizenWardUpdateView.as_view(),
    name="citizen-ward-update"
    ),
]
