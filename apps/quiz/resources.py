from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget
from .models import Subject, Quiz, PastQuestion

class BaseQuestionResource(resources.ModelResource):
    """Base resource with common processing logic for questions."""
    subject = fields.Field(
        column_name='subject',
        attribute='subject',
        widget=ForeignKeyWidget(Subject, field='name')
    )

    def before_import_row(self, row, **kwargs):
        # Merge individual incorrect answer columns into the JSON array
        incorrect_answers = []
        for key in ['incorrect_answer_1', 'incorrect_answer_2', 'incorrect_answer_3', 'incorrect_answer_4']:
            if key in row and str(row[key]).strip():
                incorrect_answers.append(str(row[key]).strip())
                
        if incorrect_answers:
            import json
            row['incorrect_answers'] = json.dumps(incorrect_answers)

class QuizResource(BaseQuestionResource):
    class Meta:
        model = Quiz
        fields = (
            'id', 'subject', 'level', 'difficulty', 'is_practice', 'is_past_question',
            'exam_body', 'year', 'questionText', 'questionType', 'correct_answer',
            'incorrect_answers', 'explanation', 'modelAnswer', 'markingGuide', 'is_active'
        )
        export_order = fields


class PastQuestionResource(BaseQuestionResource):
    class Meta:
        model = PastQuestion
        fields = (
            'id', 'subject', 'level', 'difficulty', 'exam_body', 'year', 
            'questionText', 'questionType', 'correct_answer', 'incorrect_answers', 
            'explanation', 'modelAnswer', 'markingGuide', 'is_active'
        )
        export_order = fields
