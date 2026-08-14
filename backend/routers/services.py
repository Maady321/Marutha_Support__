from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime

from backend.database import get_db
from backend.models import User, Role, ServiceRequest, ServiceRequestStatus, ServiceRequestType
from backend.schemas import ServiceRequestResponse, CreateServiceRequestSchema, ClaimServiceRequestSchema, UpdateServiceRequestStatusSchema
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/services", tags=["services"])

@router.post("/requests", response_model=ServiceRequestResponse)
def create_service_request(
    payload: CreateServiceRequestSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [Role.PATIENT, Role.CAREGIVER, Role.HOSPITAL, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create service requests")
        
    # For simplicity, if Caregiver creates it, patientId is still required.
    # We will assume current_user is the patient for now if role is patient
    patient_id = current_user.id # To do: allow specifying patientId if caregiver

    request = ServiceRequest(
        patientId=patient_id,
        title=payload.title,
        description=payload.description,
        requestType=payload.requestType,
        status=ServiceRequestStatus.PENDING,
        dueDate=payload.dueDate
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

@router.get("/requests", response_model=List[ServiceRequestResponse])
def get_service_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == Role.VOLUNTEER:
        # Volunteers see pending requests and their claimed requests
        requests = db.scalars(
            select(ServiceRequest).where(
                (ServiceRequest.status == ServiceRequestStatus.PENDING) |
                (ServiceRequest.volunteerId == current_user.id)
            ).order_by(ServiceRequest.createdAt.desc())
        ).all()
        return requests
    elif current_user.role == Role.ORGANIZATION:
        # Organizations see pending requests and their claimed requests
        requests = db.scalars(
            select(ServiceRequest).where(
                (ServiceRequest.status == ServiceRequestStatus.PENDING) |
                (ServiceRequest.organizationId == current_user.id)
            ).order_by(ServiceRequest.createdAt.desc())
        ).all()
        return requests
    elif current_user.role == Role.PATIENT:
        # Patients see their own requests
        requests = db.scalars(
            select(ServiceRequest).where(ServiceRequest.patientId == current_user.id).order_by(ServiceRequest.createdAt.desc())
        ).all()
        return requests
    else:
        # Admin or others can see all
        requests = db.scalars(select(ServiceRequest).order_by(ServiceRequest.createdAt.desc())).all()
        return requests

@router.patch("/requests/{request_id}/claim", response_model=ServiceRequestResponse)
def claim_service_request(
    request_id: uuid.UUID,
    payload: ClaimServiceRequestSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [Role.VOLUNTEER, Role.ORGANIZATION]:
        raise HTTPException(status_code=403, detail="Only volunteers and organizations can claim requests")

    req = db.scalar(select(ServiceRequest).where(ServiceRequest.id == request_id))
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != ServiceRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is already claimed or not pending")

    if current_user.role == Role.VOLUNTEER:
        req.volunteerId = current_user.id
    else:
        req.organizationId = current_user.id
        
    req.status = ServiceRequestStatus.ASSIGNED
    req.updatedAt = datetime.utcnow()
    
    db.commit()
    db.refresh(req)
    return req

@router.patch("/requests/{request_id}/status", response_model=ServiceRequestResponse)
def update_service_request_status(
    request_id: uuid.UUID,
    payload: UpdateServiceRequestStatusSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.scalar(select(ServiceRequest).where(ServiceRequest.id == request_id))
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Verify owner or claimant
    if req.patientId != current_user.id and req.volunteerId != current_user.id and req.organizationId != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this request")

    req.status = payload.status
    req.updatedAt = datetime.utcnow()
    
    db.commit()
    db.refresh(req)
    return req
