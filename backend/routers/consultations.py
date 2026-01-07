from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import database, models, schemas

router = APIRouter(
    prefix="/consultations",
    tags=["consultations"]
)

@router.post("/", response_model=schemas.ConsultationResponse)
def create_consultation(data: schemas.ConsultationCreate, db: Session = Depends(database.get_db)):
    new_con = models.Consultation(
        patient_id=1, 
        doctor_id=data.doctor_id,
        notes=data.notes,
        appointment_time=data.appointment_time,
        status=models.ConsultationStatus.PENDING
    )
    db.add(new_con)
    db.commit()
    db.refresh(new_con)
    return new_con

@router.get("/", response_model=List[schemas.ConsultationResponse])
def read_consultations(db: Session = Depends(database.get_db)):
    return db.query(models.Consultation).all()

@router.put("/{consultation_id}/status")
def update_status(consultation_id: int, data: schemas.ConsultationUpdate, db: Session = Depends(database.get_db)):
    con = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not con:
        raise HTTPException(status_code=404, detail="Consultation not found")

    con.status = data.status
    db.commit()
    return {"message": "Status updated"}
