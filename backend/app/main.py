from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import init_db
from app.core.config import settings
from app.api import auth, lessons, quiz, chat, progress


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="LangLearn API",
    description="AI-powered language learning platform (Hindi → English)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(lessons.router)
app.include_router(quiz.router)
app.include_router(chat.router)
app.include_router(progress.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
