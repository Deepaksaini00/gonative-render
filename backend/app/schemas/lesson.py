
from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class LessonOut(BaseModel):
    id: int
    title: str
    title_hindi: Optional[str] = None
    description: Optional[str] = None
    level: int
    order_index: int
    category: str
    content: Optional[Any] = None
    is_generated: bool

    model_config = {"from_attributes": True}


class LessonWithProgress(LessonOut):
    status: str = "not_started"
    score: float = 0.0
    xp_earned: int = 0


class QuizQuestionOut(BaseModel):
    id: int
    question_text: str
    question_hindi: Optional[str] = None
    question_type: str
    options: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class QuizQuestionWithAnswer(QuizQuestionOut):
    correct_answer: str
    explanation: Optional[str] = None
    explanation_hindi: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    question_id: int
    user_answer: str


class AnswerFeedback(BaseModel):
    question_id: int
    is_correct: bool
    correct_answer: str
    explanation: str
    explanation_hindi: Optional[str] = None
    user_answer: str
    ai_correction: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    lesson_id: int
    attempt_type: str = "lesson"
    answers: List[Dict[str, Any]]
    time_taken_seconds: int = 0


class QuizResult(BaseModel):
    score: float
    correct_answers: int
    total_questions: int
    passed: bool
    xp_earned: int
    ai_feedback: str
    detailed_answers: List[AnswerFeedback]


class GenerateLessonRequest(BaseModel):
    level: int = 1
    category: str = "greetings"
    native_language: str = "hindi"
    target_language: str = "english"


class DailyReviewRequest(BaseModel):
    last_lesson_id: int


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    lesson_id: Optional[int] = None
    messages: List[ChatMessage]
    context: Optional[str] = None


    
# from pydantic import BaseModel
# from typing import Optional, List, Any, Dict


# class LessonOut(BaseModel):
#     id: int
#     title: str
#     title_hindi: Optional[str]
#     description: Optional[str]
#     level: int
#     order_index: int
#     category: str
#     content: Optional[Any]
#     is_generated: bool

#     class Config:
#         orm_mode = True


# class LessonWithProgress(LessonOut):
#     status: str = "not_started"
#     score: float = 0.0
#     xp_earned: int = 0


# class QuizQuestionOut(BaseModel):
#     id: int
#     question_text: str
#     question_hindi: Optional[str]
#     question_type: str
#     options: Optional[List[str]]

#     class Config:
#         orm_mode = True


# class QuizQuestionWithAnswer(QuizQuestionOut):
#     correct_answer: str
#     explanation: Optional[str]
#     explanation_hindi: Optional[str]


# class SubmitAnswerRequest(BaseModel):
#     question_id: int
#     user_answer: str


# class AnswerFeedback(BaseModel):
#     question_id: int
#     is_correct: bool
#     correct_answer: str
#     explanation: str
#     explanation_hindi: Optional[str]
#     user_answer: str
#     ai_correction: Optional[str] = None


# class QuizSubmitRequest(BaseModel):
#     lesson_id: int
#     attempt_type: str = "lesson"
#     answers: List[Dict[str, Any]]
#     time_taken_seconds: int = 0


# class QuizResult(BaseModel):
#     score: float
#     correct_answers: int
#     total_questions: int
#     passed: bool
#     xp_earned: int
#     ai_feedback: str
#     detailed_answers: List[AnswerFeedback]


# class GenerateLessonRequest(BaseModel):
#     level: int = 1
#     category: str = "greetings"
#     native_language: str = "hindi"
#     target_language: str = "english"


# class DailyReviewRequest(BaseModel):
#     last_lesson_id: int


# class ChatMessage(BaseModel):
#     role: str
#     content: str


# class ChatRequest(BaseModel):
#     lesson_id: Optional[int] = None
#     messages: List[ChatMessage]
#     context: Optional[str] = None
