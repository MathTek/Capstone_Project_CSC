from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal, engine, Base
from models import User
from utils import hash_password, verify_password
from auth import create_access_token
from pydantic import BaseModel
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/data")
def get_data():
    return {"values": [10, 30, 50, 80]}

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    display_consent: bool
    cgu: bool

class UserLogin(BaseModel):
    username: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
