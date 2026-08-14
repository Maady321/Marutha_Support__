import uuid
import secrets
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.models import User, FamilyRelationship, Role, FamilyRelationshipStatus
from backend.schemas import FamilyRelationshipResponse
from backend.auth import get_current_user, require_role

router = APIRouter(prefix="/family", tags=["family"])

class AcceptInviteSchema(BaseModel):
    inviteCode: str

@router.post("/generate-invite")
async def generate_invite(
    current_user: User = Depends(require_role(Role.PATIENT)),
    db: AsyncSession = Depends(get_db)
):
    # Generate 8-character uppercase hex code
    invite_code = secrets.token_hex(4).upper()
    
    # Create relationship with familyMemberId set to current_user.id as a placeholder
    # because database schema requires familyMemberId to be NOT NULL.
    # When accepted, familyMemberId will be overwritten with the actual claimant.
    rel = FamilyRelationship(
        patientId=current_user.id,
        familyMemberId=current_user.id,
        inviteCode=invite_code,
        status=FamilyRelationshipStatus.PENDING,
        initiatedById=current_user.id
    )
    db.add(rel)
    await db.commit()
    
    return {"inviteCode": invite_code}

@router.post("/accept-invite")
async def accept_invite(
    dto: AcceptInviteSchema,
    current_user: User = Depends(require_role(Role.FAMILY_MEMBER)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyRelationship)
        .where(
            FamilyRelationship.inviteCode == dto.inviteCode,
            FamilyRelationship.status == FamilyRelationshipStatus.PENDING
        )
    )
    rel = result.scalars().first()
    if not rel:
        raise HTTPException(status_code=400, detail="Invalid or expired invite code")

    # Update relationship to active and set claimant
    rel.familyMemberId = current_user.id
    rel.status = FamilyRelationshipStatus.ACTIVE
    rel.linkedAt = datetime.utcnow()
    
    await db.commit()
    return {"data": {"message": "Successfully linked to patient"}}

@router.get("/relationships")
async def list_relationships(
    current_user: User = Depends(require_role(Role.FAMILY_MEMBER, Role.PATIENT)),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == Role.PATIENT:
        result = await db.execute(
            select(FamilyRelationship)
            .options(selectinload(FamilyRelationship.familyMember))
            .where(
                FamilyRelationship.patientId == current_user.id,
                FamilyRelationship.status == FamilyRelationshipStatus.ACTIVE
            )
        )
        rels = result.scalars().all()
        data = []
        for r in rels:
            fm = r.familyMember
            data.append({
                "id": str(r.id),
                "patientId": str(r.patientId),
                "familyMemberId": str(r.familyMemberId),
                "inviteCode": r.inviteCode,
                "relationshipType": r.relationshipType,
                "status": r.status.value,
                "linkedAt": r.linkedAt,
                "familyMember": {
                    "id": str(fm.id) if fm else None,
                    "firstName": fm.firstName if fm else "",
                    "lastName": fm.lastName if fm else ""
                }
            })
        return {"data": data}
        
    elif current_user.role == Role.FAMILY_MEMBER:
        result = await db.execute(
            select(FamilyRelationship)
            .options(selectinload(FamilyRelationship.patient))
            .where(
                FamilyRelationship.familyMemberId == current_user.id,
                FamilyRelationship.status == FamilyRelationshipStatus.ACTIVE
            )
        )
        rels = result.scalars().all()
        data = []
        for r in rels:
            p = r.patient
            data.append({
                "id": str(r.id),
                "patientId": str(r.patientId),
                "familyMemberId": str(r.familyMemberId),
                "inviteCode": r.inviteCode,
                "relationshipType": r.relationshipType,
                "status": r.status.value,
                "linkedAt": r.linkedAt,
                "patient": {
                    "id": str(p.id) if p else None,
                    "firstName": p.firstName if p else "",
                    "lastName": p.lastName if p else ""
                }
            })
        return {"data": data}
        
    return {"data": []}

@router.get("/relationships/{id}")
async def get_relationship(
    id: str,
    current_user: User = Depends(require_role(Role.FAMILY_MEMBER, Role.PATIENT)),
    db: AsyncSession = Depends(get_db)
):
    try:
        rel_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Relationship not found")
        
    result = await db.execute(select(FamilyRelationship).where(FamilyRelationship.id == rel_id))
    rel = result.scalars().first()
    if not rel:
        raise HTTPException(status_code=404, detail="Relationship not found")
        
    if rel.patientId != current_user.id and rel.familyMemberId != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return {
        "data": {
            "id": str(rel.id),
            "patientId": str(rel.patientId),
            "familyMemberId": str(rel.familyMemberId),
            "inviteCode": rel.inviteCode,
            "relationshipType": rel.relationshipType,
            "status": rel.status.value,
            "initiatedById": str(rel.initiatedById),
            "linkedAt": rel.linkedAt,
            "revokedAt": rel.revokedAt,
            "createdAt": rel.createdAt,
            "updatedAt": rel.updatedAt
        }
    }

@router.patch("/relationships/{id}/revoke")
async def revoke_access(
    id: str,
    current_user: User = Depends(require_role(Role.PATIENT)),
    db: AsyncSession = Depends(get_db)
):
    try:
        rel_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Relationship not found")
        
    result = await db.execute(select(FamilyRelationship).where(FamilyRelationship.id == rel_id))
    rel = result.scalars().first()
    if not rel:
        raise HTTPException(status_code=404, detail="Relationship not found")
        
    if rel.patientId != current_user.id:
        raise HTTPException(status_code=403, detail="Only patient can revoke access")
        
    rel.status = FamilyRelationshipStatus.REVOKED
    rel.revokedAt = datetime.utcnow()
    
    await db.commit()
    return {"message": "Access revoked"}
