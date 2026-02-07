from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal, engine, Base
from models import User, ScanPiiDetected, UsersScansResults, PiiFeedbacks, FamilyPool
from utils import hash_password, verify_password
from auth import create_access_token
from pydantic import BaseModel
from score_calculation import calculate_score
from typing import List, Literal
from score_calculation import save_scan_result
from db import get_db


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PIIItem(BaseModel):
    type: str
    occurrence: int
    source: Literal["bio", "post", "highlight"]

class ScoreRequest(BaseModel):
    pii_list: List[PIIItem]
    user_id: int

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    display_consent: bool
    cgu: bool

class UserLogin(BaseModel):
    username: str
    password: str

class FamilyPoolCreate(BaseModel):
    chief_id: int
    member_username: str
    family_name: str

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    if not user.cgu:
        raise HTTPException(status_code=400, detail="Terms and conditions must be accepted")
    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, email=user.email, password_hash=hashed_pw, display_consent=user.display_consent, cgu=user.cgu)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully", "user_id": new_user.id, "display_content": new_user.display_consent}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer", "user_id": db_user.id, "display_content": db_user.display_consent}

@app.post("/calculate_score")
def calculate_score_endpoint(payload: ScoreRequest):
    score = calculate_score(payload.pii_list)
    save_scan_result(payload.user_id, payload.pii_list, score)
    return {"score": score}

@app.get("/get_scans_by_userid/{user_id}")
def get_scans_by_userid(user_id: int, db: Session = Depends(get_db)):
    scans = db.query(UsersScansResults).filter(UsersScansResults.user_id == user_id).all()
    return {"scans": scans}

@app.delete("/delete_scan_by_scanid/{scan_id}")
def delete_scan_by_scanid(scan_id: int, db: Session = Depends(get_db)):
    db.query(UsersScansResults).filter(UsersScansResults.id == scan_id).delete()
    db.commit()
    return {"msg": "Scan deleted successfully"}

@app.get("/get_pii_details_by_scanid/{scan_id}")
def get_pii_details_by_scanid(scan_id: int, db: Session = Depends(get_db)):
    pii_details = db.query(ScanPiiDetected).filter(ScanPiiDetected.scan_id == scan_id).all()
    return {"pii_details": pii_details}


@app.get("/get_feedbacks")
def get_feedbacks(db: Session = Depends(get_db)):
    feedback = db.query(PiiFeedbacks).all()
    return {"feedback": feedback}

@app.get("/get_score_by_scanid/{scan_id}")
def get_score_by_scanid(scan_id: int, db: Session = Depends(get_db)):
    score = db.query(UsersScansResults).filter(UsersScansResults.id == scan_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"score": score}

@app.post("/create_family_member")
def create_family_member(payload: FamilyPoolCreate, db: Session = Depends(get_db)):
    member = db.query(User).filter(User.username == payload.member_username).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member user not found")
    new_entry = FamilyPool(chief_id=payload.chief_id, member_id=member.id, family_name=payload.family_name)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {"msg": "Family member added successfully", "family_pool_id": new_entry.id}

@app.get("/get_family_pool_by_userid/{user_id}")
def get_family_pool_by_userid(user_id: int, db: Session = Depends(get_db)):
    family_pool = db.query(FamilyPool).filter(FamilyPool.chief_id == user_id).all()
    if not family_pool:
        family_pool = db.query(FamilyPool).filter(FamilyPool.member_id == user_id).all()
        chief_id = family_pool[0].chief_id if family_pool else None
        if chief_id:
            all_family_pool = db.query(FamilyPool).filter((FamilyPool.chief_id == chief_id) | (FamilyPool.member_id == chief_id)).all()
            family_pool = all_family_pool
        if not family_pool:
            return {"family_pool": []}
    return {"family_pool": family_pool}

@app.get("/get_user_by_id/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user.username}


@app.delete("/remove_family_member/{family_pool_id}")
def remove_family_member(family_pool_id: int, db: Session = Depends(get_db)):
    db.query(FamilyPool).filter(FamilyPool.id == family_pool_id).delete()
    db.commit()
    return {"msg": "Family member removed successfully"}

    