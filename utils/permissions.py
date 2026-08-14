"""Custom DRF permissions."""
from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Allow access only to students."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsTeacher(BasePermission):
    """Allow access only to teachers."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsAdminUser(BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'root_admin']

class IsRootAdmin(BasePermission):
    """Allow access only to root admins."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'root_admin'

class IsSchoolAdmin(BasePermission):
    """Allow access only to school admins."""
    def has_permission(self, request, view):
        is_school = request.user.is_authenticated and request.user.role == 'school_admin'
        is_root = request.user.is_authenticated and (request.user.role in ['root_admin', 'admin'] or getattr(request.user, 'is_superuser', False))
        return is_school or is_root

class IsOwner(BasePermission):
    """Allow access only to the owner of an object."""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'student'):
            return obj.student == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
