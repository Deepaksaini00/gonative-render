
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut
from app.services.user_service import get_user_by_email, create_user, authenticate_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await create_user(db, data)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    return UserOut.model_validate(current_user)



# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.ext.asyncio import AsyncSession
# from app.core.database import get_db
# from app.core.security import create_access_token, get_current_user
# from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut
# from app.services.user_service import get_user_by_email, create_user, authenticate_user

# router = APIRouter(prefix="/api/auth", tags=["auth"])


# @router.post("/register", response_model=TokenResponse)
# async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
#     existing = await get_user_by_email(db, data.email)
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     user = await create_user(db, data)
#     token = create_access_token({"sub": str(user.id)})
#     return TokenResponse(access_token=token, user=UserOut.from_orm(user))


# @router.post("/login", response_model=TokenResponse)
# async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
#     user = await authenticate_user(db, data.email, data.password)
#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid email or password")

#     token = create_access_token({"sub": str(user.id)})
#     return TokenResponse(access_token=token, user=UserOut.from_orm(user))


# @router.get("/me", response_model=UserOut)
# async def get_me(current_user=Depends(get_current_user)):
#     return UserOut.from_orm(current_user)
