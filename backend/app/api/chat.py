from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.lesson import ChatRequest
from app.services.lesson_service import get_lesson_by_id
from app.services.gemini_service import chat_with_tutor

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lesson_context = None
    if req.lesson_id:
        lesson = await get_lesson_by_id(db, req.lesson_id)
        if lesson and lesson.content:
            lesson_context = {
                "title": lesson.title,
                "vocabulary": lesson.content.get("vocabulary", [])[:5],
                "grammar_points": lesson.content.get("grammar_points", [])[:2],
            }

    try:
        reply = await chat_with_tutor(
            messages=[m.dict() for m in req.messages],
            lesson_context=lesson_context,
            native_language=current_user.native_language,
            target_language=current_user.target_language,
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
