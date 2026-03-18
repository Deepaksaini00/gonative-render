from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.lesson import Lesson, QuizQuestion
from app.models.progress import UserProgress
from app.services.gemini_service import (
    generate_lesson_content,
    generate_quiz_questions,
    LESSON_CURRICULUM,
)


async def get_all_lessons(db: AsyncSession) -> List[Lesson]:
    result = await db.execute(select(Lesson).order_by(Lesson.level, Lesson.order_index))
    return result.scalars().all()


async def get_lesson_by_id(db: AsyncSession, lesson_id: int) -> Optional[Lesson]:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    return result.scalar_one_or_none()


async def get_lessons_with_progress(db: AsyncSession, user_id: int) -> List[dict]:
    lessons = await get_all_lessons(db)
    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    progress_map = {p.lesson_id: p for p in progress_result.scalars().all()}

    result = []
    for lesson in lessons:
        p = progress_map.get(lesson.id)
        result.append(
            {
                "id": lesson.id,
                "title": lesson.title,
                "title_hindi": lesson.title_hindi,
                "description": lesson.description,
                "level": lesson.level,
                "order_index": lesson.order_index,
                "category": lesson.category,
                "content": lesson.content,
                "is_generated": lesson.is_generated,
                "status": p.status if p else "not_started",
                "score": p.score if p else 0.0,
                "xp_earned": p.xp_earned if p else 0,
            }
        )
    return result


async def get_or_create_lesson(
    db: AsyncSession,
    level: int,
    category: str,
    order_index: int,
    native_language: str = "hindi",
    target_language: str = "english",
) -> Lesson:
    """Get existing lesson or generate a new one with Gemini."""
    result = await db.execute(
        select(Lesson).where(Lesson.level == level, Lesson.category == category)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    # Generate with Gemini
    content = await generate_lesson_content(
        level=level,
        category=category,
        native_language=native_language,
        target_language=target_language,
        order_index=order_index,
    )

    lesson = Lesson(
        title=content.get("title", category),
        title_hindi=content.get("title_native", ""),
        description=content.get("description", ""),
        level=level,
        order_index=order_index,
        category=category,
        content=content,
        is_generated=True,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)

    # Generate quiz questions for the lesson
    await generate_and_save_quiz(db, lesson, native_language, target_language)
    return lesson


async def generate_and_save_quiz(
    db: AsyncSession,
    lesson: Lesson,
    native_language: str = "hindi",
    target_language: str = "english",
):
    """Generate and persist quiz questions for a lesson."""
    existing = await db.execute(
        select(QuizQuestion).where(QuizQuestion.lesson_id == lesson.id)
    )
    if existing.scalars().first():
        return  # Already have questions

    questions_data = await generate_quiz_questions(
        lesson_content=lesson.content or {},
        lesson_title=lesson.title,
        native_language=native_language,
        target_language=target_language,
    )

    for q in questions_data:
        qq = QuizQuestion(
            lesson_id=lesson.id,
            question_text=q.get("question_text", ""),
            question_hindi=q.get("question_hindi", ""),
            question_type=q.get("question_type", "mcq"),
            options=q.get("options", []),
            correct_answer=q.get("correct_answer", ""),
            explanation=q.get("explanation", ""),
            explanation_hindi=q.get("explanation_hindi", ""),
        )
        db.add(qq)
    await db.commit()


async def seed_curriculum(
    db: AsyncSession,
    native_language: str = "hindi",
    target_language: str = "english",
):
    """Pre-generate the first 3 lessons so the user has content immediately."""
    for item in LESSON_CURRICULUM[:3]:
        await get_or_create_lesson(
            db,
            level=item["level"],
            category=item["category"],
            order_index=item["order"],
            native_language=native_language,
            target_language=target_language,
        )


async def get_quiz_questions(
    db: AsyncSession, lesson_id: int
) -> List[QuizQuestion]:
    result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.lesson_id == lesson_id)
    )
    return result.scalars().all()


async def get_user_progress(
    db: AsyncSession, user_id: int, lesson_id: int
) -> Optional[UserProgress]:
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id, UserProgress.lesson_id == lesson_id
        )
    )
    return result.scalar_one_or_none()


async def update_progress(
    db: AsyncSession,
    user_id: int,
    lesson_id: int,
    score: float,
    xp: int,
) -> UserProgress:
    from datetime import datetime, timezone

    progress = await get_user_progress(db, user_id, lesson_id)
    if not progress:
        progress = UserProgress(user_id=user_id, lesson_id=lesson_id)
        db.add(progress)

    progress.score = max(progress.score, score)
    progress.attempts += 1
    progress.last_attempted = datetime.now(timezone.utc)

    if score >= 80:
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)
        progress.xp_earned = max(progress.xp_earned, xp)
    elif score >= 50:
        progress.status = "in_progress"
    else:
        if progress.status == "not_started":
            progress.status = "in_progress"

    await db.commit()
    await db.refresh(progress)
    return progress


async def get_last_completed_lessons(
    db: AsyncSession, user_id: int, limit: int = 2
) -> List[Lesson]:
    result = await db.execute(
        select(Lesson)
        .join(UserProgress, UserProgress.lesson_id == Lesson.id)
        .where(
            UserProgress.user_id == user_id,
            UserProgress.status.in_(["completed", "mastered"]),
        )
        .order_by(UserProgress.completed_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
