from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from models import User, FamilyPool


router = APIRouter(tags=["family"])


class FamilyPoolCreate(BaseModel):
    chief_id: int
    member_username: str
    family_name: str


@router.post("/create_family_member")
def create_family_member(payload: FamilyPoolCreate, db: Session = Depends(get_db)):
    member = db.query(User).filter(User.username == payload.member_username).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member user not found")

    new_entry = FamilyPool(
        chief_id=payload.chief_id,
        member_id=member.id,
        family_name=payload.family_name,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return {"msg": "Family member added successfully", "family_pool_id": new_entry.id}


@router.get("/get_family_pool_by_userid/{user_id}")
def get_family_pool_by_userid(user_id: int, db: Session = Depends(get_db)):
    family_pool = db.query(FamilyPool).filter(FamilyPool.chief_id == user_id).all()
    if not family_pool:
        family_pool = db.query(FamilyPool).filter(FamilyPool.member_id == user_id).all()
        chief_id = family_pool[0].chief_id if family_pool else None
        if chief_id:
            all_family_pool = db.query(FamilyPool).filter(
                (FamilyPool.chief_id == chief_id) | (FamilyPool.member_id == chief_id)
            ).all()
            family_pool = all_family_pool
        if not family_pool:
            return {"family_pool": []}
    return {"family_pool": family_pool}


@router.get("/get_user_by_id/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user.username}


@router.delete("/remove_family_member/{family_pool_id}")
def remove_family_member(family_pool_id: int, db: Session = Depends(get_db)):
    db.query(FamilyPool).filter(FamilyPool.id == family_pool_id).delete()
    db.commit()
    return {"msg": "Family member removed successfully"}
