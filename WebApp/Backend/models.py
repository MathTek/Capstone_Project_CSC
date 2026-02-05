from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKeyConstraint
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


class ScanPiiDetected(Base):
    __tablename__ = "scan_pii_detected"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, nullable=False)
    pii_type = Column(String(50), nullable=False)
    occurrences = Column(Integer, default=1)
    source = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        ForeignKeyConstraint(
            [scan_id],
            [UsersScansResults.id],
            ondelete="CASCADE"
        ),
    )

# CREATE TABLE pii_feedbacks (
#     id SERIAL PRIMARY KEY,
#     pii_type VARCHAR(50) UNIQUE NOT NULL,

#     severity VARCHAR(20) NOT NULL,
#     title TEXT NOT NULL,
#     message TEXT NOT NULL,
#     advice TEXT NOT NULL,

#     impact INTEGER DEFAULT 0,

#     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );

class PiiFeedbacks(Base):
    __tablename__ = "pii_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    pii_type = Column(String(50), unique=True, nullable=False)
    severity = Column(String(20), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    advice = Column(String, nullable=False)
    impact = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

