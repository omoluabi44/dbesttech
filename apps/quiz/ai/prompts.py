"""
Prompt templates for Gemini AI interactions.

Separates prompt engineering from API call logic for maintainability.
"""

from utils.constants import SCHOOL_LEVELS


# --- Helpers ---

def _get_level_display(level_code: str) -> str:
    """Convert level code to human-readable display name."""
    for code, display in SCHOOL_LEVELS:
        if code == level_code:
            return display
    return level_code


def _get_difficulty_description(difficulty: str) -> str:
    """Map difficulty to a description the AI can use to calibrate questions."""
    descriptions = {
        'easy': (
            "Questions should require understanding and some analytical thinking. Include "
            "problems that test application of concepts, not just memorization. About 60-70% "
            "of well-prepared students should answer correctly. (Note: These 'easy' questions should feel like standard 'medium' level questions)."
        ),
        'medium': (
            "Questions should be challenging and require deeper analysis, multi-step reasoning, "
            "or creative problem solving. Include tricky distractors that test common "
            "misconceptions. Only about 30-40% of students should answer correctly. (Note: These 'medium' questions should feel like standard 'hard' level questions)."
        ),
        'hard': (
            "Questions should be extremely difficult, highly complex, and require profound analytical thinking, "
            "advanced multi-step reasoning, or exceptional problem-solving skills. The distractors must be incredibly tricky and plausible. "
            "Only the top 5-10% of brilliant students should be able to answer correctly. (Note: These 'hard' questions should feel like 'expert' or 'very hard' level)."
        ),
    }
    return descriptions.get(difficulty, descriptions['medium'])



def _get_curriculum_context(level_code: str) -> str:
    """Provide age-appropriate curriculum context for the AI."""
    if level_code.startswith('primary'):
        return (
            "This is a PRIMARY school student in Nigeria. Use simple, age-appropriate language. "
            "Avoid complex vocabulary. Questions should be fun and engaging. "
            "Use relatable real-world scenarios (e.g., market shopping, sports, family activities). "
            "Keep sentences short and clear."
        )
    elif level_code.startswith('jss'):
        return (
            "This is a JUNIOR SECONDARY school student in Nigeria. Use moderately academic language. "
            "Questions can involve slightly abstract concepts but should still be accessible. "
            "Reference Nigerian daily life where applicable. Follow the Nigerian NERDC curriculum."
        )
    else:
        return (
            "This is a SENIOR SECONDARY school student in Nigeria. Use formal academic language. "
            "Questions should be rigorous and exam-ready, following WAEC/NECO standards. "
            "Include questions that test both theory and practical application. "
            "Follow the Nigerian NERDC curriculum."
        )


# --- Quiz Generation Prompt (Agent 1) ---

QUIZ_GENERATION_SYSTEM = (
    "You are an expert Nigerian school teacher and question setter. "
    "You generate high-quality multiple-choice questions for students, strictly following "
    "the Nigerian curriculum (NERDC). Every question must be factually accurate and have "
    "exactly one unambiguously correct answer."
)


def build_quiz_prompt(
    subject_name: str,
    topic_name: str | None,
    level: str,
    difficulty: str,
    num_questions: int,
) -> str:
    """Build the user prompt for quiz question generation."""
    level_display = _get_level_display(level)
    difficulty_desc = _get_difficulty_description(difficulty)
    curriculum_context = _get_curriculum_context(level)

    topic_line = f"Topic: {topic_name}" if topic_name else "Topic: Mixed (cover a broad range of topics within the subject)"

    return f"""Generate exactly {num_questions} unique multiple-choice questions.

Subject: {subject_name}
{topic_line}
Level: {level_display}
Difficulty: {difficulty}

Student Context:
{curriculum_context}

Difficulty Calibration:
{difficulty_desc}

STRICT REQUIREMENTS:
1. Each question MUST have exactly 4 options labeled A, B, C, D.
2. Exactly ONE option must be correct per question.
3. Include a clear, educational explanation for why the correct answer is right.
4. All questions must be unique — no repeated or near-duplicate questions.
5. Options should be plausible. Distractors should reflect common student mistakes.
6. Do NOT include question numbers in the question_text field.

Respond with a JSON array. Each element must follow this exact schema:
{{
  "question_text": "The question text here",
  "explanation": "A clear explanation of the correct answer",
  "options": [
    {{"label": "A", "text": "Option A text", "is_correct": false}},
    {{"label": "B", "text": "Option B text", "is_correct": true}},
    {{"label": "C", "text": "Option C text", "is_correct": false}},
    {{"label": "D", "text": "Option D text", "is_correct": false}}
  ]
}}

Return ONLY the JSON array. No markdown, no code fences, no extra text."""


# --- Past Question Extraction Prompt (Agent 2) ---

EXTRACTION_SYSTEM = (
    "You are an expert at reading Nigerian school examination papers and extracting "
    "structured data from them. You carefully extract every multiple-choice question from "
    "the provided exam document, identifying the correct answer, and producing clean structured output."
)


def build_extraction_prompt(
    exam_body: str,
    year: int,
    subject_name: str,
    level: str,
) -> str:
    """Build the prompt for extracting questions from a past exam document."""
    level_display = _get_level_display(level)

    return f"""Extract ALL multiple-choice questions from this {exam_body} {year} {subject_name} exam paper for {level_display} students.

For each question:
1. Extract the full question text (clean up any OCR artifacts or formatting issues).
2. Extract all 4 options (A, B, C, D) with their text.
3. Identify the correct answer. If not explicitly marked, use your expert knowledge to determine it.
4. Write a brief educational explanation for why the correct answer is right.

STRICT REQUIREMENTS:
- Each question MUST have exactly 4 options (A, B, C, D).
- Exactly ONE option must be marked correct per question.
- Clean up any OCR errors, fix broken text, and normalize formatting.
- Skip any non-multiple-choice questions (essay, fill-in-the-blank, etc.).
- Do NOT include question numbers in the question_text field.

Respond with a JSON array. Each element must follow this exact schema:
{{
  "question_text": "The extracted question text",
  "explanation": "Explanation of the correct answer",
  "options": [
    {{"label": "A", "text": "Option A text", "is_correct": false}},
    {{"label": "B", "text": "Option B text", "is_correct": true}},
    {{"label": "C", "text": "Option C text", "is_correct": false}},
    {{"label": "D", "text": "Option D text", "is_correct": false}}
  ]
}}

Return ONLY the JSON array. No markdown, no code fences, no extra text."""
