from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    display_consent = Column(Boolean, nullable=False)
    cgu = Column(Boolean, nullable=False)

class UsersScansResults(Base):
    __tablename__ = "users_scans_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    pii_count = Column(Integer, nullable=False)
    pii_categories_count = Column(Integer, nullable=False)
    src_bio_count = Column(Integer, nullable=False)
    src_posts_count = Column(Integer, nullable=False)
    src_highlights_count = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
