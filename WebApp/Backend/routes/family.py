from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from models import User, FamilyPool


router = APIRouter(tags=["family"])



class FamilyPoolCreate(BaseModel):
    chief_id: int
    member_username: str
    family_name: str
    is_accepted: bool = False

class AcceptFamilyMemberRequest(BaseModel):
    family_pool_id: int
    user_id: int


@router.post("/create_family_member")
async def create_family_member(payload: FamilyPoolCreate, db: Session = Depends(get_db), request: Request = None):
    member = db.query(User).filter(User.username == payload.member_username).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member user not found")
    
    if db.query(FamilyPool).filter(member.id == FamilyPool.member_id).first():
        raise HTTPException(status_code=400, detail="User is already a family member")

    new_entry = FamilyPool(
        chief_id=payload.chief_id,
        member_id=member.id,
        family_name=payload.family_name,
        is_accepted=False,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    ws_manager = request.app.state.ws_manager if request else None
    if ws_manager:
        await ws_manager.broadcast(f"family_invite:{member.id}")

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

@router.post("/accept_family_member_request")
async def accept_family_member_request(payload: AcceptFamilyMemberRequest, db: Session = Depends(get_db), request: Request = None):
    family_member = db.query(FamilyPool).filter(FamilyPool.id == payload.family_pool_id and FamilyPool.member_id == payload.user_id).first()
    if not family_member:
        raise HTTPException(status_code=404, detail="Family member not found")
    family_member.is_accepted = True
    db.commit()

    ws_manager = request.app.state.ws_manager if request else None
    if ws_manager:
        await ws_manager.broadcast(f"family_accept:{family_member.member_id}")

    return {"msg": "Family member request accepted"}

@router.delete("/remove_family_member/{family_pool_id}")
async def remove_family_member(family_pool_id: int, db: Session = Depends(get_db), request: Request = None):
    context = (await request.json()).get("context", "unknown") if request else "unknown"
    member_removed = db.query(FamilyPool).filter(FamilyPool.id == family_pool_id).first()
    db.query(FamilyPool).filter(FamilyPool.id == family_pool_id).delete()
    db.commit()

    ws_manager = request.app.state.ws_manager if request else None
    if ws_manager:
        await ws_manager.broadcast(f"family_remove:{member_removed.member_id}:{context}")
    return {"msg": "Family member removed successfully"}
