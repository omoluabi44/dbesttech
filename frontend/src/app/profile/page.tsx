"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
// @ts-expect-error - missing types
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { User, Mail, Lock, Shield, School } from 'lucide-react';
import { z } from 'zod';

import { useAuthStore } from '@/lib/stores/authStore';
import { changePassword, updateStudentProfile } from '@/lib/api/auth';
import { changePasswordSchema } from '@/lib/utils/validators';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(user?.student_profile?.level || '');
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      setIsChangingPassword(true);
      await changePassword(data);
      toast.success('Password changed successfully');
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateLevel = async () => {
    if (!user) return;
    try {
      setIsUpdatingLevel(true);
      await updateStudentProfile({ level: selectedLevel });
      toast.success('Level updated successfully');
      
      const updatedLevelDisplay = SCHOOL_LEVELS.find((l: any) => l.value === selectedLevel)?.label || selectedLevel;
      useAuthStore.getState().updateUser({
        ...user,
        student_profile: {
          ...user.student_profile!,
          level: selectedLevel,
          level_display: updatedLevelDisplay
        }
      });
    } catch (error: any) {
      toast.error('Failed to update level');
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Profile Settings</h1>
        <p className="text-slate-600">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-8">
          <Card padding="lg" className="border-slate-100 shadow-sm text-center flex flex-col items-center">
            <Avatar 
              initials={user.first_name?.charAt(0) || user.username.charAt(0)} 
              src={user.student_profile?.avatar}
              size="xl"
              className="mb-4 shadow-lg border-4 border-primary/10"
            />
            <h2 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h2>
            <p className="text-slate-500 mb-4">@{user.username}</p>
            
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <Badge variant="primary">{user.student_profile?.level_display}</Badge>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            
            <Button variant="ghost" className="w-full" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
          </Card>


        </div>

        {/* Right Column - Settings */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personal Information */}
          <Card padding="lg" className="border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-primary" /> Personal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="First Name" value={user.first_name} readOnly disabled />
              <Input label="Last Name" value={user.last_name} readOnly disabled />
              <Input label="Email Address" value={user.email} leftIcon={<Mail size={18} />} readOnly disabled />
              <Input label="Username" value={user.username} readOnly disabled />
            </div>
            <p className="text-sm text-slate-500 mt-4">Contact your school administrator to change your email or username.</p>
          </Card>

          {/* Academic Profile */}
          {(user.role === 'student' || user.role === 'admin' || user.role === 'root_admin') && (
            <Card padding="lg" className="border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <School size={20} className="text-primary" /> Academic Profile
              </h3>
              
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Level</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    <option value="" disabled>Select your level</option>
                    {SCHOOL_LEVELS.map(lvl => (
                      <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                    ))}
                  </select>
                </div>
                <Button 
                  onClick={handleUpdateLevel} 
                  isLoading={isUpdatingLevel}
                  disabled={selectedLevel === user.student_profile?.level}
                >
                  Update Level
                </Button>
              </div>
            </Card>
          )}

          {/* Security */}
          <Card padding="lg" className="border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-primary" /> Security Settings
            </h3>
            
            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6 max-w-md">
              <Input
                label="Current Password"
                type="password"
                leftIcon={<Lock size={18} />}
                error={errors.old_password?.message}
                {...register('old_password')}
              />
              
              <div className="pt-4 border-t border-slate-100">
                <Input
                  label="New Password"
                  type="password"
                  className="mb-4"
                  leftIcon={<Lock size={18} />}
                  error={errors.new_password?.message}
                  {...register('new_password')}
                />
                
                <Input
                  label="Confirm New Password"
                  type="password"
                  leftIcon={<Lock size={18} />}
                  error={errors.new_password_confirm?.message}
                  {...register('new_password_confirm')}
                />
              </div>

              <Button type="submit" isLoading={isChangingPassword}>
                Update Password
              </Button>
            </form>
          </Card>
        </div>

      </div>
      
      <EditProfileModal 
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => {}}
      />
    </DashboardLayout>
  );
}
