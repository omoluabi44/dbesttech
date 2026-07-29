from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, School, SchoolAdminProfile


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Student Profile'
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role', {'fields': ('role',)}),
    )

    inlines = [StudentProfileInline]


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'level', 'school_category', 'is_graduating')
    list_filter = ('school_category', 'level', 'is_graduating')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('is_graduating', 'school_category')

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_email', 'created_at')
    search_fields = ('name', 'contact_email')

@admin.register(SchoolAdminProfile)
class SchoolAdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'school', 'created_at')
    list_filter = ('school',)
    search_fields = ('user__email', 'school__name')
