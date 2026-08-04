import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { UserWithProfile } from '@/lib/types/auth';
import { updateStudentProfile, updateUser } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { SCHOOL_LEVELS } from '@/lib/utils/constants';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const editProfileSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  level: z.string().optional(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  user: UserWithProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditProfileModal({ user, isOpen, onClose, onUpdated }: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      level: user.student_profile?.level || '',
    },
  });

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    try {
      setIsSubmitting(true);
      let updatedUser = { ...user };
      let changed = false;

      // Update name if changed
      if (data.first_name !== user.first_name || data.last_name !== user.last_name) {
        const userRes = await updateUser({
          first_name: data.first_name,
          last_name: data.last_name,
        });
        updatedUser = { ...updatedUser, first_name: userRes.first_name, last_name: userRes.last_name };
        changed = true;
      }

      // Update avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const profileRes = await updateStudentProfile(formData);
        updatedUser = { 
          ...updatedUser, 
          student_profile: {
            ...updatedUser.student_profile!,
            avatar: profileRes.avatar
          } 
        };
        changed = true;
      }

      // Update level if changed
      if (data.level && user.role === 'student' && data.level !== user.student_profile?.level) {
        const profileRes = await updateStudentProfile({ level: data.level });
        updatedUser = { 
          ...updatedUser, 
          student_profile: {
            ...updatedUser.student_profile!,
            level: profileRes.level,
            level_display: SCHOOL_LEVELS.find((l: any) => l.value === profileRes.level)?.label || profileRes.level
          } 
        };
        changed = true;
      }

      if (changed) {
        useAuthStore.getState().updateUser(updatedUser);
        toast.success('Profile updated successfully');
        onUpdated();
      }
      
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-[var(--surface-dark)]">
          <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <div 
                className="w-24 h-24 rounded-full bg-[var(--surface-dark)] overflow-hidden flex items-center justify-center border-4 border-[var(--background)] shadow-md mb-3 relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {(avatarPreview || user.student_profile?.avatar) ? (
                  <img 
                    src={avatarPreview || user.student_profile?.avatar || undefined} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-400 uppercase">
                    {user.first_name?.charAt(0) || user.username.charAt(0)}
                  </span>
                )}
                
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud size={20} className="text-white mb-1" />
                  <span className="text-white text-xs font-medium">Upload</span>
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
              />
              <p className="text-xs text-gray-500">JPG, PNG or WEBP (Max 2MB)</p>
            </div>

            <div className="space-y-4">
              <Input
                label="First Name"
                {...register('first_name')}
                error={errors.first_name?.message}
              />
              <Input
                label="Last Name"
                {...register('last_name')}
                error={errors.last_name?.message}
              />
              
              {user.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Level</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    {...register('level')}
                  >
                    <option value="" disabled>Select your level</option>
                    {SCHOOL_LEVELS.map(lvl => (
                      <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
