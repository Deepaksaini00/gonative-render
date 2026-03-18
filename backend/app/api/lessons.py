from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.lesson import (
    LessonWithProgress,
    QuizQuestionOut,
    GenerateLessonRequest,
)
from app.services.lesson_service import (
    get_lessons_with_progress,
    get_lesson_by_id,
    get_or_create_lesson,
    get_quiz_questions,
    LESSON_CURRICULUM,
)
from app.services.gemini_service import LESSON_CURRICULUM as CURRICULUM

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("", response_model=List[LessonWithProgress])
async def list_lessons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lessons = await get_lessons_with_progress(db, current_user.id)
    return lessons


@router.get("/{lesson_id}", response_model=LessonWithProgress)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lessons = await get_lessons_with_progress(db, current_user.id)
    lesson = next((l for l in lessons if l["id"] == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post("/generate")
async def generate_lesson(
    req: GenerateLessonRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate a new lesson on demand."""
    # Find order index
    order = sum(
        1 for c in CURRICULUM if c["level"] == req.level and c["order"] <= 99
    )
    lesson = await get_or_create_lesson(
        db,
        level=req.level,
        category=req.category,
        order_index=order,
        native_language=req.native_language,
        target_language=req.target_language,
    )
    return {"lesson_id": lesson.id, "message": "Lesson generated successfully"}


@router.post("/seed")
async def seed_lessons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Seed the first few lessons for a new user."""
    from app.services.lesson_service import seed_curriculum

    await seed_curriculum(
        db,
        native_language=current_user.native_language,
        target_language=current_user.target_language,
    )
    return {"message": "Curriculum seeded"}


@router.get("/{lesson_id}/questions", response_model=List[QuizQuestionOut])
async def get_lesson_questions(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lesson = await get_lesson_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    questions = await get_quiz_questions(db, lesson_id)
    if not questions:
        # Generate on demand if missing
        from app.services.lesson_service import generate_and_save_quiz

        await generate_and_save_quiz(
            db, lesson, current_user.native_language, current_user.target_language
        )
        questions = await get_quiz_questions(db, lesson_id)

    return questions
