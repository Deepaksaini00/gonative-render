from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    title_hindi = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    level = Column(Integer, default=1)       # 1=beginner, 2=elementary, 3=intermediate
    order_index = Column(Integer, default=0)  # order within level
    category = Column(String, default="general")  # greetings, numbers, grammar, etc.
    content = Column(JSON, nullable=True)    # structured lesson content from Gemini
    is_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    progresses = relationship("UserProgress", back_populates="lesson")
    quiz_questions = relationship("QuizQuestion", back_populates="lesson", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_hindi = Column(Text, nullable=True)
    question_type = Column(String, default="mcq")  # mcq, fill_blank, translate
    options = Column(JSON, nullable=True)          # list of option strings
    correct_answer = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    explanation_hindi = Column(Text, nullable=True)

    lesson = relationship("Lesson", back_populates="quiz_questions")
