from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import database, models, schemas
from backend.auth import get_current_user

router = APIRouter(
    prefix="/doctors",
    tags=["doctors"]
)

@router.get("/", response_model=List[schemas.DoctorResponse])
def read_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    doctors = db.query(models.Doctor).offset(skip).limit(limit).all()
    return doctors

@router.get("/{doctor_id}", response_model=schemas.DoctorResponse)
def read_doctor(doctor_id: int, db: Session = Depends(database.get_db)):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.post("/me/status")
def set_status(status: bool, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    doc.is_online = status
    db.commit()
    return {"status": "updated", "is_online": status}

@router.get("/requests/pending")
def get_pending_requests(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        return []

    reqs = db.query(models.Consultation).filter(
        models.Consultation.doctor_id == doc.id,
        models.Consultation.status == models.ConsultationStatus.PENDING
    ).all()
    return reqs

@router.post("/requests/{request_id}/accept")
def accept_request(request_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=403)

    req = db.query(models.Consultation).filter(models.Consultation.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404)

    req.status = models.ConsultationStatus.ACCEPTED

    patient = db.query(models.Patient).filter(models.Patient.id == req.patient_id).first()
    if patient:
        patient.doctor_id = doc.id

    db.commit()
    return {"message": "Accepted"}

@router.get("/{doctor_id}/patients", response_model=List[schemas.PatientResponse])
def get_my_patients(doctor_id: int, db: Session = Depends(database.get_db)):
    patients = db.query(models.Patient).filter(models.Patient.doctor_id == doctor_id).all()
    return patients

@router.post("/assign_volunteer")
def assign_volunteer(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    pid = data.get("patient_id")
    vid = data.get("volunteer_id")

    patient = db.query(models.Patient).filter(models.Patient.id == pid).first()
    if patient:
        patient.volunteer_id = vid
        db.commit()

    return {"message": "Volunteer assigned"}
