import { useAuthStore } from '../stores/authStore';
import { isPrimaryLevel, isGraduatingLevel, LEVEL_TO_CATEGORY, SCHOOL_LEVELS } from '../utils/constants';

export const useSchoolCategory = () => {
  const { user } = useAuthStore();
  
  if (!user || !user.student_profile) {
    return {
      isPrimary: false,
      isSecondary: false,
      isGraduating: false,
      category: '',
      level: '',
      levelDisplay: '',
    };
  }

  const profile = user.student_profile;
  const levelObj = SCHOOL_LEVELS.find(l => l.value === profile.level);

  return {
    isPrimary: isPrimaryLevel(profile.level),
    isSecondary: !isPrimaryLevel(profile.level),
    isGraduating: isGraduatingLevel(profile.level),
    category: LEVEL_TO_CATEGORY[profile.level] || 'primary',
    level: profile.level,
    levelDisplay: levelObj?.label || profile.level,
  };
};
