from django.contrib.auth import authenticate

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser
)
from rest_framework.views import APIView

from .models import User

from .serializers import (
    RegisterSerializer,
    CreateDepartmentAdminSerializer,
    UpdateDepartmentAdminSerializer,
    CreateWardAdminSerializer,
    UpdateWardAdminSerializer,
    ProfileSerializer,
)


# ==========================================================
# USER / CITIZEN LIST
# ==========================================================

class UserListView(generics.ListAPIView):

    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):

        # Only Super Admin can view citizens
        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can view users."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        users = (
            User.objects
            .filter(
                role=User.Role.CITIZEN
            )
            .select_related(
                "department",
                "ward"
            )
            .order_by("-date_joined")
        )

        data = []

        for user in users:

            # ----------------------------------------------
            # WARD DATA
            # ----------------------------------------------

            ward_data = None

            if user.ward:

                ward_data = {
                    "id": user.ward.id,
                    "ward_number": user.ward.ward_number,
                    "name": user.ward.name,
                    "city": user.ward.city,
                }

            # ----------------------------------------------
            # DEPARTMENT DATA
            # ----------------------------------------------

            department_data = None

            if user.department:

                department_data = {
                    "id": user.department.id,
                    "name": user.department.name,
                    "code": user.department.code,
                }

            # ----------------------------------------------
            # USER DATA
            # ----------------------------------------------

            data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "phone": user.phone,
                    "role": user.role,

                    "ward": ward_data,
                    "ward_id": user.ward_id,

                    "department": department_data,
                    "department_id": user.department_id,

                    "is_active": user.is_active,
                    "date_joined": user.date_joined,
                }
            )

        return Response(
            data,
            status=status.HTTP_200_OK
        )


# ==========================================================
# CITIZEN REGISTRATION
# ==========================================================

class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "message":
                    "Citizen registration successful.",
                "username":
                    user.username,
                "role":
                    user.role,
            },
            status=status.HTTP_201_CREATED
        )


# ==========================================================
# LOGIN
# ==========================================================

class LoginView(APIView):

    permission_classes = [AllowAny]

    def get(
        self,
        request,
        *args,
        **kwargs
    ):

        return Response(
            {
                "message":
                    "CIIP Login API is working.",
                "method":
                    "POST",
                "endpoint":
                    "/api/users/login/"
            },
            status=status.HTTP_200_OK
        )

    def post(
        self,
        request,
        *args,
        **kwargs
    ):

        username = request.data.get(
            "username",
            ""
        ).strip()

        password = request.data.get(
            "password",
            ""
        )

        if not username or not password:

            return Response(
                {
                    "detail":
                        "Username and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:

            return Response(
                {
                    "detail":
                        "Invalid username or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:

            return Response(
                {
                    "detail":
                        "This account is inactive. "
                        "Please contact the administrator."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        token, created = Token.objects.get_or_create(
            user=user
        )

        # ----------------------------------------------
        # PROFILE PHOTO
        # ----------------------------------------------

        profile_photo_url = None

        if user.profile_photo:

            profile_photo_url = (
                request.build_absolute_uri(
                    user.profile_photo.url
                )
            )

        # ----------------------------------------------
        # WARD
        # ----------------------------------------------

        ward_data = None

        if user.ward:

            ward_data = {
                "id": user.ward.id,
                "ward_number":
                    user.ward.ward_number,
                "name":
                    user.ward.name,
                "city":
                    user.ward.city,
            }

        # ----------------------------------------------
        # DEPARTMENT
        # ----------------------------------------------

        department_data = None

        if user.department:

            department_data = {
                "id":
                    user.department.id,
                "name":
                    user.department.name,
                "code":
                    user.department.code,
            }

        return Response(
            {
                "token":
                    token.key,
                "username":
                    user.username,
                "full_name":
                    user.full_name,
                "role":
                    user.role,
                "ward":
                    ward_data,
                "department":
                    department_data,
                "profile_photo_url":
                    profile_photo_url,
            },
            status=status.HTTP_200_OK
        )


# ==========================================================
# PROFILE
# ==========================================================

class ProfileView(
    generics.RetrieveUpdateAPIView
):

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]

    def get_object(self):

        return self.request.user

    def retrieve(
        self,
        request,
        *args,
        **kwargs
    ):

        user = self.get_object()

        serializer = self.get_serializer(
            user,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        user = self.get_object()

        serializer = self.get_serializer(
            user,
            data=request.data,
            partial=True,
            context={
                "request": request
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


# ==========================================================
# CREATE DEPARTMENT ADMIN
# ==========================================================

class CreateDepartmentAdminView(
    generics.CreateAPIView
):

    serializer_class = CreateDepartmentAdminSerializer
    permission_classes = [IsAuthenticated]

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "create Department Admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        department_data = None

        if user.department:

            department_data = {
                "id":
                    user.department.id,
                "name":
                    user.department.name,
                "code":
                    user.department.code,
            }

        return Response(
            {
                "message":
                    "Department Admin created successfully.",
                "id":
                    user.id,
                "username":
                    user.username,
                "full_name":
                    user.full_name,
                "phone":
                    user.phone,
                "role":
                    user.role,
                "department":
                    department_data,
                "is_active":
                    user.is_active,
            },
            status=status.HTTP_201_CREATED
        )


# ==========================================================
# DEPARTMENT ADMIN LIST
# ==========================================================

class DepartmentAdminListView(
    generics.ListAPIView
):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            User.objects
            .filter(
                role=User.Role.DEPARTMENT_ADMIN
            )
            .select_related(
                "department"
            )
            .order_by("-date_joined")
        )

    def list(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "view Department Admins."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        admins = self.get_queryset()

        data = []

        for admin in admins:

            department_data = None

            if admin.department:

                department_data = {
                    "id":
                        admin.department.id,
                    "name":
                        admin.department.name,
                    "code":
                        admin.department.code,
                }

            data.append(
                {
                    "id":
                        admin.id,
                    "full_name":
                        admin.full_name,
                    "username":
                        admin.username,
                    "phone":
                        admin.phone,
                    "role":
                        admin.role,
                    "department":
                        department_data,
                    "department_id":
                        admin.department_id,
                    "department_name":
                        (
                            admin.department.name
                            if admin.department
                            else None
                        ),
                    "is_active":
                        admin.is_active,
                    "date_joined":
                        admin.date_joined,
                }
            )

        return Response(
            data,
            status=status.HTTP_200_OK
        )


# ==========================================================
# UPDATE DEPARTMENT ADMIN
# ==========================================================

class DepartmentAdminUpdateView(
    generics.UpdateAPIView
):

    serializer_class = UpdateDepartmentAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return User.objects.filter(
            role=User.Role.DEPARTMENT_ADMIN
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "update Department Admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        admin = self.get_object()

        serializer = self.get_serializer(
            admin,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        admin = serializer.save()

        department_data = None

        if admin.department:

            department_data = {
                "id":
                    admin.department.id,
                "name":
                    admin.department.name,
                "code":
                    admin.department.code,
            }

        return Response(
            {
                "message":
                    "Department Admin updated successfully.",
                "id":
                    admin.id,
                "full_name":
                    admin.full_name,
                "username":
                    admin.username,
                "phone":
                    admin.phone,
                "role":
                    admin.role,
                "department":
                    department_data,
                "department_id":
                    admin.department_id,
                "department_name":
                    (
                        admin.department.name
                        if admin.department
                        else None
                    ),
                "is_active":
                    admin.is_active,
            },
            status=status.HTTP_200_OK
        )


# ==========================================================
# DELETE DEPARTMENT ADMIN
# ==========================================================

class DepartmentAdminDeleteView(
    generics.DestroyAPIView
):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return User.objects.filter(
            role=User.Role.DEPARTMENT_ADMIN
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "delete Department Admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        admin = self.get_object()

        if admin.id == request.user.id:

            return Response(
                {
                    "detail":
                        "You cannot delete your own account."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        username = admin.username

        admin.delete()

        return Response(
            {
                "message":
                    "Department Admin deleted successfully.",
                "username":
                    username,
            },
            status=status.HTTP_200_OK
        )


# ==========================================================
# CREATE WARD ADMIN
# ==========================================================

class CreateWardAdminView(
    generics.CreateAPIView
):

    serializer_class = CreateWardAdminSerializer
    permission_classes = [IsAuthenticated]

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "create Ward Admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        ward_data = None

        if user.ward:

            ward_data = {
                "id":
                    user.ward.id,
                "ward_number":
                    user.ward.ward_number,
                "name":
                    user.ward.name,
                "city":
                    user.ward.city,
            }

        return Response(
            {
                "message":
                    "Ward Admin created successfully.",
                "id":
                    user.id,
                "username":
                    user.username,
                "full_name":
                    user.full_name,
                "phone":
                    user.phone,
                "role":
                    user.role,
                "ward":
                    ward_data,
                "is_active":
                    user.is_active,
            },
            status=status.HTTP_201_CREATED
        )


# ==========================================================
# WARD ADMIN LIST
# ==========================================================

class WardAdminListView(
    generics.ListAPIView
):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            User.objects
            .filter(
                role=User.Role.WARD_ADMIN
            )
            .select_related(
                "ward"
            )
            .order_by("-date_joined")
        )

    def list(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "view Ward Admins."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        admins = self.get_queryset()

        data = []

        for admin in admins:

            ward_data = None

            if admin.ward:

                ward_data = {
                    "id":
                        admin.ward.id,
                    "ward_number":
                        admin.ward.ward_number,
                    "name":
                        admin.ward.name,
                    "city":
                        admin.ward.city,
                }

            data.append(
                {
                    "id":
                        admin.id,
                    "full_name":
                        admin.full_name,
                    "username":
                        admin.username,
                    "phone":
                        admin.phone,
                    "role":
                        admin.role,
                    "ward":
                        ward_data,
                    "ward_id":
                        admin.ward_id,
                    "ward_number":
                        (
                            admin.ward.ward_number
                            if admin.ward
                            else None
                        ),
                    "ward_name":
                        (
                            admin.ward.name
                            if admin.ward
                            else None
                        ),
                    "is_active":
                        admin.is_active,
                    "date_joined":
                        admin.date_joined,
                }
            )

        return Response(
            data,
            status=status.HTTP_200_OK
        )


# ==========================================================
# UPDATE WARD ADMIN
# ==========================================================

class WardAdminUpdateView(
    generics.UpdateAPIView
):

    serializer_class = UpdateWardAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            User.objects
            .filter(
                role=User.Role.WARD_ADMIN
            )
            .select_related(
                "ward"
            )
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "update Ward Admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        admin = self.get_object()

        serializer = self.get_serializer(
            admin,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        admin = serializer.save()

        ward_data = None

        if admin.ward:

            ward_data = {
                "id":
                    admin.ward.id,
                "ward_number":
                    admin.ward.ward_number,
                "name":
                    admin.ward.name,
                "city":
                    admin.ward.city,
            }

        return Response(
            {
                "message":
                    "Ward Admin updated successfully.",
                "id":
                    admin.id,
                "full_name":
                    admin.full_name,
                "username":
                    admin.username,
                "phone":
                    admin.phone,
                "role":
                    admin.role,
                "ward":
                    ward_data,
                "ward_id":
                    admin.ward_id,
                "ward_number":
                    (
                        admin.ward.ward_number
                        if admin.ward
                        else None
                    ),
                "ward_name":
                    (
                        admin.ward.name
                        if admin.ward
                        else None
                    ),
                "is_active":
                    admin.is_active,
            },
            status=status.HTTP_200_OK
        )


# ==========================================================
# DELETE WARD ADMIN
# ==========================================================

class WardAdminDeleteView(
    generics.DestroyAPIView
):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return User.objects.filter(
            role=User.Role.WARD_ADMIN
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can "
                        "delete Ward Admin."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        admin = self.get_object()

        if admin.id == request.user.id:

            return Response(
                {
                    "detail":
                        "You cannot delete your own account."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        username = admin.username

        admin.delete()

        return Response(
            {
                "message":
                    "Ward Admin deleted successfully.",
                "username":
                    username,
            },
            status=status.HTTP_200_OK
        )


# ==========================================================
# ASSIGN CITIZEN TO WARD
# ==========================================================

class CitizenWardUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        pk,
        *args,
        **kwargs
    ):

        # --------------------------------------------------
        # ONLY SUPER ADMIN
        # --------------------------------------------------

        if request.user.role != User.Role.SUPER_ADMIN:

            return Response(
                {
                    "detail":
                        "Only Super Admin can assign "
                        "a citizen to a ward."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------------------------
        # FIND CITIZEN
        # --------------------------------------------------

        try:

            citizen = (
                User.objects
                .select_related("ward")
                .get(
                    pk=pk,
                    role=User.Role.CITIZEN
                )
            )

        except User.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Citizen not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------------------------
        # GET WARD ID
        # --------------------------------------------------

        ward_id = request.data.get("ward_id")

        if ward_id in [None, ""]:

            return Response(
                {
                    "detail":
                        "ward_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------------------------
        # IMPORT WARD
        # --------------------------------------------------

        from departments.models import Ward

        try:

            ward = Ward.objects.get(
                pk=ward_id,
                is_active=True
            )

        except Ward.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Ward not found or inactive."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------------------------
        # ASSIGN WARD
        # --------------------------------------------------

        citizen.ward = ward

        citizen.save(
            update_fields=["ward"]
        )

        # --------------------------------------------------
        # RESPONSE
        # --------------------------------------------------

        return Response(
            {
                "message":
                    "Citizen ward assigned successfully.",

                "citizen": {
                    "id":
                        citizen.id,

                    "username":
                        citizen.username,

                    "full_name":
                        citizen.full_name,

                    "role":
                        citizen.role,
                },

                "ward": {
                    "id":
                        ward.id,

                    "ward_number":
                        ward.ward_number,

                    "name":
                        ward.name,

                    "city":
                        ward.city,
                },
            },
            status=status.HTTP_200_OK
        )