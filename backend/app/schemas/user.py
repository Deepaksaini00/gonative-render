from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    native_language: str = "hindi"
    target_language: str = "english"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    native_language: str
    target_language: str
    current_streak: int
    total_xp: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    name: Optional[str] = None
    native_language: Optional[str] = None
    target_language: Optional[str] = None

# from pydantic import BaseModel, EmailStr
# from typing import Optional
# from datetime import datetime


# class UserRegister(BaseModel):
#     name: str
#     email: EmailStr
#     password: str
#     native_language: str = "hindi"
#     target_language: str = "english"


# class UserLogin(BaseModel):
#     email: EmailStr
#     password: str


# class UserOut(BaseModel):
#     id: int
#     name: str
#     email: str
#     native_language: str
#     target_language: str
#     current_streak: int
#     total_xp: int
#     created_at: datetime

#     class Config:
#         orm_mode = True


# class TokenResponse(BaseModel):
#     access_token: str
#     token_type: str = "bearer"
#     user: UserOut


# class UserUpdate(BaseModel):
#     name: Optional[str] = None
#     native_language: Optional[str] = None
#     target_language: Optional[str] = None
