"""Constants for the quiz platform."""

SCHOOL_CATEGORIES = [
    ('primary', 'Primary'),
    ('junior_secondary', 'Junior Secondary'),
    ('senior_secondary', 'Senior Secondary'),
]

SCHOOL_LEVELS = [
    ('primary_1', 'Primary 1'),
    ('primary_2', 'Primary 2'),
    ('primary_3', 'Primary 3'),
    ('primary_4', 'Primary 4'),
    ('primary_5', 'Primary 5'),
    ('primary_6', 'Primary 6'),
    ('jss_1', 'JSS 1'),
    ('jss_2', 'JSS 2'),
    ('jss_3', 'JSS 3'),
    ('ss_1', 'SS 1'),
    ('ss_2', 'SS 2'),
    ('ss_3', 'SS 3'),
]

GRADUATING_LEVELS = ['primary_6', 'jss_3', 'ss_3']

LEVEL_TO_CATEGORY = {
    'primary_1': 'primary', 'primary_2': 'primary', 'primary_3': 'primary',
    'primary_4': 'primary', 'primary_5': 'primary', 'primary_6': 'primary',
    'jss_1': 'junior_secondary', 'jss_2': 'junior_secondary', 'jss_3': 'junior_secondary',
    'ss_1': 'senior_secondary', 'ss_2': 'senior_secondary', 'ss_3': 'senior_secondary',
}

DIFFICULTY_CHOICES = [
    ('easy', 'Easy'),
    ('medium', 'Medium'),
    ('hard', 'Hard'),
]

QUESTION_SOURCE_CHOICES = [
    ('ai_generated', 'AI Generated'),
    ('past_question', 'Past Question'),
    ('manual', 'Manual'),
]

EXAM_BODY_CHOICES = [
    ('federal_common_entrance', 'Federal Common Entrance'),
    ('state_common_entrance', 'State Common Entrance'),
    ('bece', 'BECE'),
    ('waec', 'WAEC'),
    ('gce', 'GCE'),
    ('neco', 'NECO'),
    ('nabteb', 'NABTEB'),
    ('jamb', 'JAMB'),
]

QUIZ_TYPE_CHOICES = [
    ('practice', 'Practice'),
    ('past_question', 'Past Question'),
]

QUIZ_STATUS_CHOICES = [
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('abandoned', 'Abandoned'),
]

ROLE_CHOICES = [
    ('student', 'Student'),
    ('teacher', 'Teacher'),
    ('admin', 'Admin'),
    ('root_admin', 'Root Admin'),
    ('school_admin', 'School Admin'),
]
