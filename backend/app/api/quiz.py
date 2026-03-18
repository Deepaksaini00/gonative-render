from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.lesson import (
    QuizSubmitRequest,
    QuizResult,
    AnswerFeedback,
    DailyReviewRequest,
    QuizQuestionOut,
)
from app.models.lesson import QuizQuestion
from app.models.progress import QuizAttempt
from app.services.lesson_service import (
    update_progress,
    get_last_completed_lessons,
    get_lesson_by_id,
)
from app.services.user_service import update_user_xp
from app.services.gemini_service import (
    generate_ai_correction,
    generate_quiz_feedback,
    generate_daily_review_questions,
)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


def calculate_xp(score: float, attempt_number: int) -> int:
    base = 50
    if score >= 90:
        base = 100
    elif score >= 80:
        base = 75
    elif score >= 60:
        base = 40
    # Decay for multiple attempts
    return max(10, base - (attempt_number - 1) * 10)


@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    req: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Fetch all questions for this lesson
    result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.lesson_id == req.lesson_id)
    )
    questions = {q.id: q for q in result.scalars().all()}

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this lesson")

    detailed_answers: List[AnswerFeedback] = []
    correct_count = 0
    wrong_summaries = []

    for ans in req.answers:
        qid = ans.get("question_id")
        user_answer = ans.get("answer", "").strip()
        q = questions.get(qid)
        if not q:
            continue

        is_correct = user_answer.strip().lower() == q.correct_answer.strip().lower()
        if is_correct:
            correct_count += 1

        ai_correction = None
        if not is_correct:
            wrong_summaries.append(
                {
                    "question": q.question_text,
                    "user_answer": user_answer,
                    "correct": q.correct_answer,
                }
            )
            # Generate personalized correction for wrong answers
            try:
                ai_correction = await generate_ai_correction(
                    question_text=q.question_text,
                    user_answer=user_answer,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation or "",
                    native_language=current_user.native_language,
                )
            except Exception:
                ai_correction = q.explanation

        detailed_answers.append(
            AnswerFeedback(
                question_id=qid,
                is_correct=is_correct,
                correct_answer=q.correct_answer,
                explanation=q.explanation or "",
                explanation_hindi=q.explanation_hindi or "",
                user_answer=user_answer,
                ai_correction=ai_correction,
            )
        )

    total = len(req.answers)
    score = (correct_count / total * 100) if total > 0 else 0
    passed = score >= 70

    # Get attempt count for XP calculation
    from app.services.lesson_service import get_user_progress
    existing = await get_user_progress(db, current_user.id, req.lesson_id)
    attempt_num = (existing.attempts + 1) if existing else 1
    xp = calculate_xp(score, attempt_num) if passed else 10

    # Generate overall feedback
    try:
        ai_feedback = await generate_quiz_feedback(
            score=score,
            correct=correct_count,
            total=total,
            wrong_answers=wrong_summaries,
            native_language=current_user.native_language,
        )
    except Exception:
        if score >= 80:
            ai_feedback = "Bahut accha! Great job on completing this lesson!"
        elif score >= 60:
            ai_feedback = "Achha kiya! Keep practicing to improve your score."
        else:
            ai_feedback = "Don't worry! Thoda aur practice karo. You'll get it!"

    # Save attempt
    attempt = QuizAttempt(
        user_id=current_user.id,
        lesson_id=req.lesson_id,
        attempt_type=req.attempt_type,
        answers=[
            {
                "question_id": a.question_id,
                "answer": a.user_answer,
                "correct": a.is_correct,
            }
            for a in detailed_answers
        ],
        score=score,
        total_questions=total,
        correct_answers=correct_count,
        time_taken_seconds=req.time_taken_seconds,
        ai_feedback=ai_feedback,
    )
    db.add(attempt)

    # Update progress
    await update_progress(db, current_user.id, req.lesson_id, score, xp)

    # Update user XP
    if xp > 0:
        await update_user_xp(db, current_user, xp)

    await db.commit()

    return QuizResult(
        score=score,
        correct_answers=correct_count,
        total_questions=total,
        passed=passed,
        xp_earned=xp,
        ai_feedback=ai_feedback,
        detailed_answers=detailed_answers,
    )


@router.get("/daily-review", response_model=List[QuizQuestionOut])
async def get_daily_review(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get daily review questions from recently completed lessons."""
    last_lessons = await get_last_completed_lessons(db, current_user.id, limit=3)

    if not last_lessons:
        raise HTTPException(
            status_code=404,
            detail="No completed lessons found. Complete at least one lesson first!",
        )

    lesson_contents = [
        l.content for l in last_lessons if l.content
    ]

    try:
        questions_data = await generate_daily_review_questions(
            last_lessons=lesson_contents,
            native_language=current_user.native_language,
            target_language=current_user.target_language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate review: {str(e)}")

    # Convert to response format (without correct_answer)
    questions = []
    for i, q in enumerate(questions_data[:5]):
        questions.append(
            QuizQuestionOut(
                id=-(i + 1),  # Negative IDs for dynamic questions
                question_text=q.get("question_text", ""),
                question_hindi=q.get("question_hindi", ""),
                question_type=q.get("question_type", "mcq"),
                options=q.get("options", []),
            )
        )

    # Store temporarily in session context (we'll include answers in the route for review)
    return questions


@router.get("/daily-review/full")
async def get_daily_review_full(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get daily review questions WITH answers (for the review session)."""
    last_lessons = await get_last_completed_lessons(db, current_user.id, limit=3)

    if not last_lessons:
        raise HTTPException(status_code=404, detail="No completed lessons yet")

    lesson_contents = [l.content for l in last_lessons if l.content]

    questions_data = await generate_daily_review_questions(
        last_lessons=lesson_contents,
        native_language=current_user.native_language,
        target_language=current_user.target_language,
    )

    return {"questions": questions_data[:5]}
