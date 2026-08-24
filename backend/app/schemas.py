from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    role: Optional[int] = None
    role_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    entrance_date: Optional[date] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[int] = None
    role_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    entrance_date: Optional[date] = None
    password: Optional[str] = None
    game_progress: Optional[int] = None

class UserResponse(UserBase):
    id: int
    game_progress: Optional[int] = 0
    height: Optional[int] = None
    weight: Optional[int] = None
    role: Optional[int] = None
    role_name: Optional[str] = None
    entrance_date: Optional[date] = None
    date_of_registration: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ChatRequest(BaseModel):
    question: str

class QuizOptionResponse(BaseModel):
    id: int
    option_key: str
    option_text: str
    is_correct: bool

    class Config:
        from_attributes = True

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    options: List[QuizOptionResponse] = []
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    source: Optional[str] = None

    class Config:
        from_attributes = True

class TrainingStartResponse(BaseModel):
    session_token: str
    start_time: datetime

class TrainingCompleteRequest(BaseModel):
    session_token: str
    exercise_type: str
    reps: int
    duration_seconds: int
    rep_timestamps: List[int] # milliseconds elapsed since start for each rep

class TrainingCompleteResponse(BaseModel):
    success: bool
    message: str
    record_id: Optional[int] = None
    is_valid: bool
