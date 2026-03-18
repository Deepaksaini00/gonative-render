from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.schemas.user import UserRegister


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        native_language=data.native_language,
        target_language=data.target_language,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def update_user_xp(db: AsyncSession, user: User, xp: int):
    user.total_xp += xp
    await db.commit()
