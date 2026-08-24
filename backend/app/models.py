from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Name / Account
    date_of_registration = Column(DateTime(timezone=True), server_default=func.now())
    hashed_password = Column(String)

    # 1-to-1 relationship with UserProfile
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    role = Column(Integer, ForeignKey("roles.id")) # Role ID
    game_progress = Column(Integer, default=0)
    date_of_birth = Column(Date)
    height = Column(Integer) # Height in cm
    weight = Column(Integer) # Weight in kg
    entrance_date = Column(Date) # 入伍日期

    user = relationship("User", back_populates="profile")
    role_rel = relationship("Role", foreign_keys=[role])

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Role name

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    explanation = Column(String)
    source = Column(String)

    # 1-to-many relationship with QuizOption
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan", order_by="QuizOption.option_key")

class QuizOption(Base):
    __tablename__ = "quiz_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_key = Column(String(10), nullable=False) # e.g., 'A', 'B', 'C', 'D'
    option_text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("QuizQuestion", back_populates="options")

class TrainingRecord(Base):
    __tablename__ = "training_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    create_at = Column(DateTime(timezone=True), server_default=func.now())
    exercise_type = Column(String, index=True) # e.g., 'squats', 'salute'
    reps = Column(Integer)
    duration_seconds = Column(Integer)
    is_valid = Column(Boolean, default=True)

    user = relationship("User")
