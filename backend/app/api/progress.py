from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.progress import UserProgress, QuizAttempt
from app.models.lesson import Lesson

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Count completed lessons
    completed_result = await db.execute(
        select(func.count(UserProgress.id)).where(
            UserProgress.user_id == current_user.id,
            UserProgress.status.in_(["completed", "mastered"]),
        )
    )
    completed_count = completed_result.scalar() or 0

    # Total lessons
    total_result = await db.execute(select(func.count(Lesson.id)))
    total_lessons = total_result.scalar() or 0

    # Recent quiz attempts
    recent_attempts = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.created_at.desc())
        .limit(5)
    )
    attempts = recent_attempts.scalars().all()

    avg_score = 0.0
    if attempts:
        avg_score = sum(a.score for a in attempts) / len(attempts)

    return {
        "total_xp": current_user.total_xp,
        "current_streak": current_user.current_streak,
        "completed_lessons": completed_count,
        "total_lessons": total_lessons,
        "avg_score": round(avg_score, 1),
        "recent_attempts": [
            {
                "lesson_id": a.lesson_id,
                "score": a.score,
                "correct": a.correct_answers,
                "total": a.total_questions,
                "date": a.created_at.isoformat(),
            }
            for a in attempts
        ],
    }
