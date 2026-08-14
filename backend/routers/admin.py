from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid

from backend.database import get_db
from backend.models import User, Role, VerificationStatus
from backend.schemas import AdminUserResponse, AdminVerifyUserSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

def require_admin(user: User = Depends(get_current_user)):
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Only administrators can access this endpoint")
    return user

@router.get("/users/pending", response_model=List[AdminUserResponse])
def get_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Fetch users who need verification (Doctors, Nurses, Organizations, Hospitals)
    users = db.scalars(
        select(User).where(
            User.verificationStatus == VerificationStatus.PENDING,
            User.role.in_([Role.DOCTOR, Role.NURSE, Role.ORGANIZATION, Role.HOSPITAL])
        ).order_by(User.createdAt.desc())
    ).all()
    
    return users

@router.patch("/users/{target_user_id}/verify", response_model=AdminUserResponse)
def verify_user(
    target_user_id: uuid.UUID,
    payload: AdminVerifyUserSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    target = db.scalar(select(User).where(User.id == target_user_id))
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    target.verificationStatus = payload.verificationStatus
    db.commit()
    db.refresh(target)
    
    return target
