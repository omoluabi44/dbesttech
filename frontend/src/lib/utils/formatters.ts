export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatScore = (score: number): string => {
  return `${Math.round(score)}%`;
};

export const getGrade = (score: number) => {
  if (score >= 70) return { letter: 'A', color: 'text-green-500', label: 'Excellent' };
  if (score >= 60) return { letter: 'B', color: 'text-blue-500', label: 'Good' };
  if (score >= 50) return { letter: 'C', color: 'text-amber-500', label: 'Average' };
  if (score >= 40) return { letter: 'D', color: 'text-orange-500', label: 'Pass' };
  return { letter: 'F', color: 'text-red-500', label: 'Fail' };
};

export const formatRelativeTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(dateStr);
};
