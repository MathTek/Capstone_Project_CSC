from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from models import ScanPiiDetected, UsersScansResults, PiiFeedbacks
from score_calculation import calculate_score, save_scan_result


router = APIRouter(tags=["score"])


class PIIItem(BaseModel):
    type: str
    occurrence: int
    source: Literal["bio", "post", "highlight"]


class ScoreRequest(BaseModel):
    pii_list: List[PIIItem]
    user_id: int
    media: str


@router.post("/calculate_score")
async def calculate_score_endpoint(payload: ScoreRequest, request: Request = None):
    score = calculate_score(payload.pii_list)
    save_scan_result(payload.user_id, payload.pii_list, score, payload.media)

    ws_manager = request.app.state.ws_manager if request else None
    if ws_manager:
        await ws_manager.broadcast(f"new_scan_available:{payload.user_id}")

    return {"score": score}


@router.get("/get_scans_by_userid/{user_id}")
def get_scans_by_userid(user_id: int, db: Session = Depends(get_db)):
    scans = db.query(UsersScansResults).filter(UsersScansResults.user_id == user_id).all()
    return {"scans": scans}


@router.delete("/delete_scan_by_scanid/{scan_id}")
def delete_scan_by_scanid(scan_id: int, db: Session = Depends(get_db)):
    db.query(UsersScansResults).filter(UsersScansResults.id == scan_id).delete()
    db.commit()
    return {"msg": "Scan deleted successfully"}


@router.get("/get_pii_details_by_scanid/{scan_id}")
def get_pii_details_by_scanid(scan_id: int, db: Session = Depends(get_db)):
    pii_details = db.query(ScanPiiDetected).filter(ScanPiiDetected.scan_id == scan_id).all()
    return {"pii_details": pii_details}


@router.get("/get_feedbacks")
def get_feedbacks(db: Session = Depends(get_db)):
    feedback = db.query(PiiFeedbacks).all()
    return {"feedback": feedback}


@router.get("/get_score_by_scanid/{scan_id}")
def get_score_by_scanid(scan_id: int, db: Session = Depends(get_db)):
    score = db.query(UsersScansResults).filter(UsersScansResults.id == scan_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"score": score}
