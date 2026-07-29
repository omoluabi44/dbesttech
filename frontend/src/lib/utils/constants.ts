export const SCHOOL_CATEGORIES = [
  { value: 'primary', label: 'Primary' },
  { value: 'junior_secondary', label: 'Junior Secondary' },
  { value: 'senior_secondary', label: 'Senior Secondary' },
];

export const SCHOOL_LEVELS = [
  { value: 'primary_1', label: 'Primary 1', category: 'primary' },
  { value: 'primary_2', label: 'Primary 2', category: 'primary' },
  { value: 'primary_3', label: 'Primary 3', category: 'primary' },
  { value: 'primary_4', label: 'Primary 4', category: 'primary' },
  { value: 'primary_5', label: 'Primary 5', category: 'primary' },
  { value: 'primary_6', label: 'Primary 6', category: 'primary' },
  { value: 'jss_1', label: 'JSS 1', category: 'junior_secondary' },
  { value: 'jss_2', label: 'JSS 2', category: 'junior_secondary' },
  { value: 'jss_3', label: 'JSS 3', category: 'junior_secondary' },
  { value: 'ss_1', label: 'SS 1', category: 'senior_secondary' },
  { value: 'ss_2', label: 'SS 2', category: 'senior_secondary' },
  { value: 'ss_3', label: 'SS 3', category: 'senior_secondary' },
];

export const GRADUATING_LEVELS = ['primary_6', 'jss_3', 'ss_3'];



export const DIFFICULTY_CHOICES = [
  { value: 'easy', label: 'Easy', color: 'text-green-500 bg-green-50 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { value: 'hard', label: 'Hard', color: 'text-red-500 bg-red-50 border-red-200' },
];

export const LEVEL_TO_CATEGORY: Record<string, string> = {
  primary_1: 'primary',
  primary_2: 'primary',
  primary_3: 'primary',
  primary_4: 'primary',
  primary_5: 'primary',
  primary_6: 'primary',
  jss_1: 'junior_secondary',
  jss_2: 'junior_secondary',
  jss_3: 'junior_secondary',
  ss_1: 'senior_secondary',
  ss_2: 'senior_secondary',
  ss_3: 'senior_secondary',
};

export const isPrimaryLevel = (level: string) => level.startsWith('primary');
export const isGraduatingLevel = (level: string) => GRADUATING_LEVELS.includes(level);

export const EXAM_BODY_CHOICES: Record<string, { value: string; label: string }[]> = {
  primary_6: [
    { value: 'federal_common_entrance', label: 'Federal Common Entrance' },
    { value: 'state_common_entrance', label: 'State Common Entrance' },
  ],
  jss_3: [
    { value: 'bece', label: 'BECE' },
  ],
  ss_3: [
    { value: 'waec', label: 'WAEC' },
    { value: 'gce', label: 'GCE' },
    { value: 'neco', label: 'NECO' },
    { value: 'nabteb', label: 'NABTEB' },
    { value: 'jamb', label: 'JAMB' },
  ],
};
