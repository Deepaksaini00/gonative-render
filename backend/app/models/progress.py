from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    status = Column(String, default="not_started")  # not_started, in_progress, completed, mastered
    score = Column(Float, default=0.0)              # 0-100
    attempts = Column(Integer, default=0)
    last_attempted = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    xp_earned = Column(Integer, default=0)

    user = relationship("User", back_populates="progresses")
    lesson = relationship("Lesson", back_populates="progresses")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    attempt_type = Column(String, default="lesson")  # lesson, daily_review, mock
    answers = Column(JSON, nullable=True)            # [{question_id, answer, correct, explanation}]
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    ai_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="quiz_attempts")
